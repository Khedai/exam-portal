export type QuestionType = 'MCQ' | 'SHORT' | 'LONG';

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[]; // Only for MCQ
  correctOptionIndex?: number; // Only for MCQ auto-marking
  maxPoints: number;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  startTime: string; // ISO string
  dueDate: string; // ISO string
  maxRetries: number;
  questions: Question[];
  exceptions?: string[]; // Student IDs who can access even when locked
}

export type SubmissionStatus = 'STARTED' | 'SUBMITTED' | 'MARKED';

export interface Answer {
  questionId: string;
  value: string | number; // String for short/long, number (index) for MCQ
  pointsAwarded?: number;
  feedback?: string;
}

export interface Submission {
  id: string;
  examId: string;
  student: {
    name: string;
    surname: string;
    id: string;
  };
  status: SubmissionStatus;
  startTime: string; // ISO string
  submitTime?: string; // ISO string
  answers: Answer[];
  totalScore?: number;
}
