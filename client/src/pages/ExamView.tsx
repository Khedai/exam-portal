import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Exam, Answer } from '../types.ts';
import { Clock, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Send } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

const ExamView: React.FC = () => {
  const { examId, submissionId } = useParams<{ examId: string; submissionId: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  // endTime stored as ms timestamp so polling can update it when teacher extends
  const [endTime, setEndTime] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState('');
  const navigate = useNavigate();

  /** Compute end-time ms from an exam object */
  const calcEndTime = (e: Exam) =>
    new Date(e.startTime).getTime() + (e.durationMinutes || 60) * 60000;

  const submitExam = useCallback(async (finalAnswers?: Answer[]) => {
    if (!submissionId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.updateSubmission(submissionId, {
        answers: finalAnswers || answers,
        status: 'SUBMITTED'
      });
      localStorage.removeItem(`exam-draft-${submissionId}`);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to submit exam', err);
      setIsSubmitting(false);
    }
  }, [submissionId, answers, navigate, isSubmitting]);

  // ── Initial load & validation ────────────────────────
  useEffect(() => {
    if (!examId || !submissionId) return;
    setInitialized(false);
    setTimeLeft(null);
    setEndTime(0);
    const studentInfo = JSON.parse(sessionStorage.getItem('studentInfo') || '{}');

    Promise.all([api.getExam(examId), api.getSubmissions()]).then(([examData, subsData]) => {
      const start = new Date(examData.startTime);
      const end   = new Date(calcEndTime(examData));
      const now   = new Date();
      const isException = examData.exceptions?.includes(studentInfo.studentId);

      if (now < start) { alert("This exam hasn't started yet."); navigate('/dashboard'); return; }
      if (now >= end && !isException) { alert('This exam is now closed.'); navigate('/dashboard'); return; }

      const studentSubs = subsData.filter(s => s.examId === examId && s.student.id === studentInfo.studentId);
      const currentSub  = studentSubs.find(s => s.id === submissionId);

      if (!currentSub) { alert('Submission not found.'); navigate('/dashboard'); return; }
      if (currentSub.status !== 'STARTED') { alert('This submission has already been completed.'); navigate('/dashboard'); return; }

      setExam(examData);
      setEndTime(calcEndTime(examData));

      // Restore draft from localStorage or init fresh
      const draft = localStorage.getItem(`exam-draft-${submissionId}`);
      setAnswers(draft
        ? JSON.parse(draft)
        : examData.questions.map(q => ({ questionId: q.id, value: q.type === 'MCQ' ? -1 : '' }))
      );
      setInitialized(true);
    });
  }, [examId, submissionId, navigate]);

  // ── Poll exam every 30 s — picks up teacher duration changes ─
  useEffect(() => {
    if (!examId || !initialized) return;
    const poll = async () => {
      try {
        const fresh = await api.getExam(examId);
        const newEnd = calcEndTime(fresh);
        setExam(fresh);
        setEndTime(prev => {
          // Only update (and flash the timer) if duration actually changed
          if (prev !== newEnd) return newEnd;
          return prev;
        });
      } catch { /* swallow – don't crash the exam */ }
    };
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, [examId, initialized]);

  // ── Countdown + auto-submit only when wall-clock time has expired ─
  useEffect(() => {
    if (!endTime || !initialized) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(left);
      if (left === 0 && Date.now() >= endTime && exam && !isSubmitting) {
        submitExam();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime, initialized, exam, isSubmitting, submitExam]);

  // ── Auto-save answers to localStorage every 30 s ─────────────
  useEffect(() => {
    if (!submissionId || answers.length === 0) return;
    const id = setInterval(
      () => localStorage.setItem(`exam-draft-${submissionId}`, JSON.stringify(answers)),
      30000
    );
    return () => clearInterval(id);
  }, [submissionId, answers]);

  const handleAnswerChange = (questionId: string, value: string | number) => {
    setAnswers(prev => prev.map(ans => ans.questionId === questionId ? { ...ans, value } : ans));
  };

  const isQuestionAnswered = (index: number) => {
    const ans = answers[index];
    if (!ans) return false;
    if (exam?.questions[index].type === 'MCQ') return ans.value !== -1;
    return (ans.value as string).trim().length > 0;
  };

  const answeredCount = answers.filter((_, i) => isQuestionAnswered(i)).length;

  const handleSubmitClick = () => {
    const unanswered = exam?.questions
      .map((_, i) => (!isQuestionAnswered(i) ? i + 1 : null))
      .filter(Boolean) as number[];

    if (unanswered?.length > 0) {
      setConfirmMsg(`You have ${unanswered.length} unanswered question(s): ${unanswered.join(', ')}. Submit anyway?`);
    } else {
      setConfirmMsg('Are you sure you want to submit your assessment? This cannot be undone.');
    }
    setConfirmOpen(true);
  };

  if (!exam) return (
    <div className="loading-center">
      <div className="loading-spinner" />
      <span>Loading your exam...</span>
    </div>
  );

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const displayTime = timeLeft ?? 0;
  const timerClass = displayTime < 60 ? 'timer-danger' : displayTime < 300 ? 'timer-warning' : '';
  const q = exam.questions[currentQuestion];
  const currentAnswer = answers.find(a => a.questionId === q.id);
  const progressPct = (answeredCount / exam.questions.length) * 100;

  return (
    <div className="app-container">
      {/* Confirm dialog */}
      {confirmOpen && (
        <ConfirmDialog
          title="Submit Assessment"
          message={confirmMsg}
          confirmLabel="Yes, Submit"
          confirmDanger={false}
          onConfirm={() => { setConfirmOpen(false); submitExam(); }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <img src="/logo.png" alt="Khusela" style={{ height: '36px', objectFit: 'contain', flexShrink: 0 }} />
          <h1 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '260px', fontSize: '15px' }}>{exam.title}</h1>
        </div>
        {/* Progress */}
        <div style={{ flex: 1, maxWidth: '200px', margin: '0 16px', display: 'none' }} className="nav-progress">
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '3px', textAlign: 'center' }}>
            {answeredCount}/{exam.questions.length} answered
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <div className={`timer-container ${timerClass}`}>
          <Clock size={18} />
          <span>{timeLeft === null ? '--:--' : formatTime(displayTime)}</span>
        </div>
      </nav>

      {/* Top progress bar strip */}
      <div style={{ height: '4px', background: 'var(--border)' }}>
        <div style={{ height: '100%', background: 'var(--primary)', width: `${progressPct}%`, transition: 'width 0.3s ease' }} />
      </div>

      <div className="container">
        <div className="exam-layout-wrapper">
          {/* Question panel */}
          <div>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Question {currentQuestion + 1} of {exam.questions.length}
                  </span>
                  <div style={{ marginTop: '4px' }}>
                    <span className={`badge ${q.type === 'MCQ' ? 'badge-info' : q.type === 'SHORT' ? 'badge-warning' : 'badge-success'}`}>{q.type}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>{q.maxPoints}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>POINTS</div>
                </div>
              </div>

              <p style={{ fontSize: '19px', fontWeight: 700, lineHeight: 1.5, margin: '0 0 32px' }}>{q.prompt}</p>

              <div style={{ marginBottom: '32px' }}>
                {q.type === 'MCQ' && (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {q.options?.map((option, optIdx) => {
                      const isSelected = currentAnswer?.value === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`mcq-option ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleAnswerChange(q.id, optIdx)}
                        >
                          <div className="mcq-radio" />
                          <span style={{ flex: 1, fontWeight: isSelected ? 600 : 400 }}>{option}</span>
                          {isSelected && <CheckCircle2 size={18} style={{ color: 'var(--secondary)', flexShrink: 0 }} />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === 'SHORT' && (
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>Your Answer</label>
                    <input
                      type="text"
                      placeholder="Type your response here..."
                      style={{ fontSize: '16px' }}
                      value={currentAnswer?.value as string || ''}
                      onChange={e => handleAnswerChange(q.id, e.target.value)}
                    />
                  </div>
                )}

                {q.type === 'LONG' && (
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>Your Detailed Response</label>
                    <textarea
                      rows={10}
                      placeholder="Write your full explanation here..."
                      style={{ fontSize: '15px', lineHeight: '1.65', resize: 'vertical' }}
                      value={currentAnswer?.value as string || ''}
                      onChange={e => handleAnswerChange(q.id, e.target.value)}
                    />
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                      {((currentAnswer?.value as string) || '').length} characters
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                <button
                  className="btn btn-secondary"
                  disabled={currentQuestion === 0}
                  onClick={() => setCurrentQuestion(prev => prev - 1)}
                >
                  <ChevronLeft size={18} /> Previous
                </button>

                {currentQuestion < exam.questions.length - 1 ? (
                  <button className="btn btn-primary" onClick={() => setCurrentQuestion(prev => prev + 1)}>
                    Next <ChevronRight size={18} />
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    style={{ background: '#1e293b' }}
                    onClick={handleSubmitClick}
                    disabled={isSubmitting}
                  >
                    <Send size={16} /> {isSubmitting ? 'Submitting...' : 'Finish & Submit'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="no-print">
            <div className="card" style={{ padding: '20px', position: 'sticky', top: '80px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Progress
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px' }}>
                {answeredCount} of {exam.questions.length} answered
              </p>
              <div className="progress-bar-wrap" style={{ marginBottom: '16px' }}>
                <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="nav-dots">
                {exam.questions.map((_, idx) => (
                  <div
                    key={idx}
                    className={`nav-dot ${currentQuestion === idx ? 'active' : ''} ${isQuestionAnswered(idx) ? 'answered' : ''}`}
                    onClick={() => setCurrentQuestion(idx)}
                    title={`Question ${idx + 1}${isQuestionAnswered(idx) ? ' (answered)' : ''}`}
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '12px' }}>
                  <AlertTriangle size={14} />
                  <span>Review all answers before submitting.</span>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '13px' }}
                  onClick={handleSubmitClick}
                  disabled={isSubmitting}
                >
                  <Send size={14} /> Submit Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) { .nav-progress { display: block !important; } }
      `}</style>
    </div>
  );
};

export default ExamView;
