import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Exam, Submission } from './types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ─── Data files ──────────────────────────────────────────────────────────────
// In production (compiled to dist/), data lives at dist/data/*.json
// In dev (ts-node-dev), __dirname is src/ so data is at src/data/*.json
const EXAMS_FILE = path.join(__dirname, 'data', 'exams.json');
const SUBMISSIONS_FILE = path.join(__dirname, 'data', 'submissions.json');
const STUDENT_SESSIONS_FILE = path.join(__dirname, 'data', 'student-sessions.json');

// Student session tracking for once-off login enforcement
interface StudentSession {
  studentId: string;
  studentName: string;
  loginTime: string;
  ipAddress?: string;
}

// Ensure data directory + files exist (first deploy on a fresh server)
const ensureDataFiles = () => {
  const dataDir = path.dirname(EXAMS_FILE);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(EXAMS_FILE)) fs.writeFileSync(EXAMS_FILE, '[]');
  if (!fs.existsSync(SUBMISSIONS_FILE)) fs.writeFileSync(SUBMISSIONS_FILE, '[]');
  if (!fs.existsSync(STUDENT_SESSIONS_FILE)) fs.writeFileSync(STUDENT_SESSIONS_FILE, '[]');
};
ensureDataFiles();

const readData = <T>(filePath: string): T => {
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
};

const writeData = <T>(filePath: string, data: T): void => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// ─── Once-off Student Login ───────────────────────────────────────────────────

app.post('/api/auth/student-login', (req, res) => {
  const { studentId, name, surname, cellNumber } = req.body;

  if (!studentId || !name) {
    return res.status(400).json({ message: 'Student ID and name are required.' });
  }

  const sessions = readData<StudentSession[]>(STUDENT_SESSIONS_FILE);

  // Check if this student has already logged in (once-off enforcement)
  const existingSession = sessions.find(s => s.studentId === studentId);
  if (existingSession) {
    return res.status(403).json({
      message: 'You have already logged in from another device or browser. ' +
        'For security reasons, each student may only log in once. ' +
        'If you believe this is an error, please contact your teacher.'
    });
  }

  // Record this login session
  const newSession: StudentSession = {
    studentId,
    studentName: `${name} ${surname}`,
    loginTime: new Date().toISOString(),
    ipAddress: req.ip || req.socket.remoteAddress
  };
  sessions.push(newSession);
  writeData(STUDENT_SESSIONS_FILE, sessions);

  res.status(200).json({ success: true, message: 'Login recorded successfully.' });
});

// ─── Teacher: Reset a student's login session (for legitimate cases) ──────────
app.post('/api/auth/reset-student-login', (req, res) => {
  const { studentId, teacherToken } = req.body;

  // Simple teacher authorization (in production, use proper auth)
  if (!teacherToken || teacherToken !== process.env.TEACHER_SECRET) {
    return res.status(401).json({ message: 'Unauthorized. Teacher token required.' });
  }

  const sessions = readData<StudentSession[]>(STUDENT_SESSIONS_FILE);
  const filtered = sessions.filter(s => s.studentId !== studentId);

  if (filtered.length < sessions.length) {
    writeData(STUDENT_SESSIONS_FILE, filtered);
    res.json({ success: true, message: `Login session reset for student ${studentId}.` });
  } else {
    res.json({ success: true, message: 'No active session found for that student.' });
  }
});

// ─── Teacher: Get all student sessions ────────────────────────────────────────
app.get('/api/auth/student-sessions', (req, res) => {
  const sessions = readData<StudentSession[]>(STUDENT_SESSIONS_FILE);
  res.json(sessions);
});

// ─── Exam & Submission Routes ─────────────────────────────────────────────────

app.get('/api/exams', (req, res) => {
  const exams = readData<Exam[]>(EXAMS_FILE);
  res.json(exams);
});

app.get('/api/exams/:id', (req, res) => {
  const exams = readData<Exam[]>(EXAMS_FILE);
  const exam = exams.find(e => e.id === req.params.id);
  if (exam) {
    res.json(exam);
  } else {
    res.status(404).json({ message: 'Exam not found' });
  }
});

app.post('/api/exams', (req, res) => {
  const exams = readData<Exam[]>(EXAMS_FILE);
  const newExam: Exam = {
    ...req.body,
    id: Date.now().toString()
  };
  exams.push(newExam);
  writeData(EXAMS_FILE, exams);
  res.status(201).json(newExam);
});

app.put('/api/exams/:id', (req, res) => {
  const exams = readData<Exam[]>(EXAMS_FILE);
  const index = exams.findIndex(e => e.id === req.params.id);
  if (index !== -1) {
    const submissions = readData<Submission[]>(SUBMISSIONS_FILE);
    const hasSubmissions = submissions.some(s => s.examId === req.params.id);
    if (hasSubmissions) {
      return res.status(400).json({ message: 'Cannot edit exam with existing submissions' });
    }
    exams[index] = { ...exams[index], ...req.body, id: req.params.id };
    writeData(EXAMS_FILE, exams);
    res.json(exams[index]);
  } else {
    res.status(404).json({ message: 'Exam not found' });
  }
});

app.delete('/api/exams/:id', (req, res) => {
  const exams = readData<Exam[]>(EXAMS_FILE);
  const submissions = readData<Submission[]>(SUBMISSIONS_FILE);
  const hasSubmissions = submissions.some(s => s.examId === req.params.id);
  if (hasSubmissions) {
    return res.status(400).json({ message: 'Cannot delete exam with existing submissions' });
  }
  const filteredExams = exams.filter(e => e.id !== req.params.id);
  if (filteredExams.length < exams.length) {
    writeData(EXAMS_FILE, filteredExams);
    res.json({ message: 'Exam deleted successfully' });
  } else {
    res.status(404).json({ message: 'Exam not found' });
  }
});

app.get('/api/exams/:id/submissions', (req, res) => {
  const submissions = readData<Submission[]>(SUBMISSIONS_FILE);
  const filtered = submissions.filter(s => s.examId === req.params.id);
  res.json(filtered);
});

app.get('/api/submissions', (req, res) => {
  const submissions = readData<Submission[]>(SUBMISSIONS_FILE);
  res.json(submissions);
});

app.post('/api/submissions', (req, res) => {
  const { examId, student } = req.body;

  if (!examId || !student || !student.id) {
    return res.status(400).json({ message: 'examId and student details are required.' });
  }

  const submissions = readData<Submission[]>(SUBMISSIONS_FILE);

  // ─── Enforce: ONE submission per student per exam (no retries) ──────────────
  const existingSubmission = submissions.find(
    s => s.examId === examId && s.student.id === student.id
  );

  if (existingSubmission) {
    // If they have an in-progress submission, return it so they can continue
    if (existingSubmission.status === 'STARTED') {
      return res.status(200).json(existingSubmission);
    }
    // If they've already submitted or been marked, reject
    return res.status(403).json({
      message: 'You have already submitted this assessment. Only one attempt is allowed.'
    });
  }

  const newSubmission: Submission = {
    ...req.body,
    id: Date.now().toString(),
    status: 'STARTED',
    startTime: new Date().toISOString(),
    answers: []
  };
  submissions.push(newSubmission);
  writeData(SUBMISSIONS_FILE, submissions);
  res.status(201).json(newSubmission);
});

app.put('/api/submissions/:id', (req, res) => {
  const submissions = readData<Submission[]>(SUBMISSIONS_FILE);
  const index = submissions.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    const updatedSubmission = { ...submissions[index], ...req.body };

    // Auto-mark MCQs if submitted
    if (updatedSubmission.status === 'SUBMITTED') {
      const exams = readData<Exam[]>(EXAMS_FILE);
      const exam = exams.find(e => e.id === updatedSubmission.examId);
      if (exam) {
        updatedSubmission.answers = updatedSubmission.answers.map((answer: any) => {
          const question = exam.questions.find(q => q.id === answer.questionId);
          if (question?.type === 'MCQ' && question.correctOptionIndex !== undefined) {
            answer.pointsAwarded = answer.value === question.correctOptionIndex ? question.maxPoints : 0;
          }
          return answer;
        });
      }
      updatedSubmission.submitTime = new Date().toISOString();
    }

    submissions[index] = updatedSubmission;
    writeData(SUBMISSIONS_FILE, submissions);
    res.json(updatedSubmission);
  } else {
    res.status(404).json({ message: 'Submission not found' });
  }
});

// Marking endpoint for teacher
app.patch('/api/submissions/:id/mark', (req, res) => {
  const submissions = readData<Submission[]>(SUBMISSIONS_FILE);
  const index = submissions.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ message: 'Submission not found' });
    return;
  }

  const submission = submissions[index]!;
  const { answers, status } = req.body;

  if (answers) {
    submission.answers = answers;
  }
  if (status) {
    submission.status = status;
  }

  // Calculate total score if marked
  if (submission.status === 'MARKED') {
    submission.totalScore = submission.answers.reduce((sum, ans) => sum + (ans.pointsAwarded || 0), 0);
  }

  submissions[index] = submission;
  writeData(SUBMISSIONS_FILE, submissions);
  res.json(submission);
});

// ─── Serve frontend in production ────────────────────────────────────────────
// After `npm run build`, the client dist lives at ../client/dist (relative to server root)
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA fallback — serve index.html for any non-API route (Express 5 syntax)
  app.get('{*path}', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
  console.log(`Serving frontend from ${clientDist}`);
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});