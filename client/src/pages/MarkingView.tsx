import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Submission, Exam, Answer } from '../types.ts';
import { Printer, ChevronLeft, CheckCircle, FileText, User, GraduationCap, Percent, Phone } from 'lucide-react';
import ToastContainer, { useToast } from '../components/Toast';

const MarkingView: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [localAnswers, setLocalAnswers] = useState<Answer[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toasts, showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (submissionId) {
      api.getSubmissions().then(subs => {
        const sub = subs.find(s => s.id === submissionId);
        if (sub) {
          setSubmission(sub);
          setLocalAnswers(sub.answers);
          api.getExam(sub.examId).then(setExam);
        }
      });
    }
  }, [submissionId]);

  const handlePointChange = (questionId: string, points: number) => {
    setLocalAnswers(prev => prev.map(ans => 
      ans.questionId === questionId ? { ...ans, pointsAwarded: points } : ans
    ));
  };

  const handleFeedbackChange = (questionId: string, feedback: string) => {
    setLocalAnswers(prev => prev.map(ans => 
      ans.questionId === questionId ? { ...ans, feedback } : ans
    ));
  };

  const saveMarks = async (finalize: boolean = false) => {
    if (!submissionId || !submission) return;
    setIsSaving(true);
    try {
      const status = finalize ? 'MARKED' : submission.status;
      const updated = await api.markSubmission(submissionId, {
        answers: localAnswers,
        status: status
      });
      setSubmission(updated);
      if (finalize) {
        showToast('Marking finalized successfully!', 'success');
        setTimeout(() => navigate('/teacher'), 1200);
      } else {
        showToast('Marks saved as draft.', 'info');
      }
    } catch (err) {
      console.error('Failed to save marks', err);
      showToast('Error saving marks.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!submission || !exam) return (
    <div className="loading-center">
      <div className="loading-spinner" />
      <span>Loading marking data...</span>
    </div>
  );

  const totalPointsAwarded = localAnswers.reduce((sum, a) => sum + (a.pointsAwarded || 0), 0);
  const totalMaxPoints = exam.questions.reduce((sum, q) => sum + q.maxPoints, 0);
  const percentage = ((totalPointsAwarded / totalMaxPoints) * 100).toFixed(1);

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <ToastContainer toasts={toasts} />
      <header className="no-print" style={{
        marginBottom: '2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <button className="btn" style={{ background: 'white', border: '1px solid var(--border)' }} onClick={() => navigate('/teacher')}>
          <ChevronLeft size={18} /> Back
        </button>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" style={{ background: 'white', border: '1px solid var(--border)' }} onClick={() => window.print()}>
            <Printer size={18} /> Print Report
          </button>
          <button className="btn btn-primary" onClick={() => saveMarks(true)} disabled={isSaving}>
            <CheckCircle size={18} /> {submission.status === 'MARKED' ? 'Update Marks' : 'Finalize Marking'}
          </button>
        </div>
      </header>

      <div className="card result-paper" style={{ padding: '3.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
            <GraduationCap size={48} style={{ margin: '0 auto' }} />
          </div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: 800 }}>Assessment Report</h1>
          <div className="badge badge-info" style={{ fontSize: '0.9rem' }}>{exam.title}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '3rem', marginBottom: '4rem', padding: '2rem', background: '#f8fafc', borderRadius: '16px' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Information</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <User size={20} className="text-muted" />
              <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{submission.student.name} {submission.student.surname}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
              <FileText size={20} />
              <span>SA ID: {submission.student.id}</span>
            </div>
            {submission.student.cellNumber && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                <Phone size={20} />
                <span>Cell: {submission.student.cellNumber}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
              <CheckCircle size={20} />
              <span>Submitted: {submission.submitTime ? new Date(submission.submitTime).toLocaleString() : 'N/A'}</span>
            </div>
          </div>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '1px solid var(--border)', paddingLeft: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Final Result</h3>
            <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>
              {totalPointsAwarded}<span style={{ fontSize: '1.5rem', color: 'var(--text-muted)', fontWeight: 400 }}>/{totalMaxPoints}</span>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.25rem' }}>
              <Percent size={20} /> {percentage}%
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '2.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '2px solid var(--border)', paddingBottom: '0.75rem' }}>Detailed Breakdown</h3>
          {exam.questions.map((q, idx) => {
            const answer = localAnswers.find(a => a.questionId === q.id);
            return (
              <div key={q.id} style={{ 
                padding: '2rem', 
                border: '1px solid var(--border)', 
                borderRadius: '16px',
                background: 'white',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      {idx + 1}
                    </div>
                    <span className="badge badge-info">{q.type}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="no-print" style={{ fontSize: '0.875rem', fontWeight: 600 }}>Score:</span>
                    <input 
                      type="number" 
                      max={q.maxPoints} 
                      min={0}
                      className="score-input"
                      style={{ width: '60px', margin: 0, textAlign: 'center', fontWeight: 800, fontSize: '1.125rem', color: 'var(--primary)' }}
                      value={answer?.pointsAwarded || 0}
                      onChange={(e) => handlePointChange(q.id, parseInt(e.target.value) || 0)}
                      disabled={q.type === 'MCQ'}
                    />
                    <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>/ {q.maxPoints}</span>
                  </div>
                </div>
                
                <p style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>{q.prompt}</p>
                
                <div style={{ padding: '1.5rem', borderRadius: '12px', background: '#f1f5f9', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Student's Response</div>
                  <div style={{ fontSize: '1.05rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {q.type === 'MCQ' ? (
                      <span style={{ fontWeight: 700 }}>{q.options?.[answer?.value as number] || 'No answer'}</span>
                    ) : (
                      answer?.value || <span style={{ fontStyle: 'italic', color: 'var(--danger)' }}>No answer provided</span>
                    )}
                  </div>
                  {q.type === 'MCQ' && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: answer?.pointsAwarded === q.maxPoints ? 'var(--success)' : 'var(--danger)', fontWeight: 700, fontSize: '0.875rem' }}>
                      {answer?.pointsAwarded === q.maxPoints ? '✓ Correct Answer' : `✗ Incorrect (Correct: ${q.options?.[q.correctOptionIndex!]})`}
                    </div>
                  )}
                </div>

                <div className="no-print">
                  <label style={{ fontSize: '0.875rem', fontWeight: 700 }}>Assessor Feedback</label>
                  <textarea 
                    rows={2} 
                    style={{ margin: '0.5rem 0 0 0', background: 'white' }}
                    placeholder="Provide constructive feedback..."
                    value={answer?.feedback || ''}
                    onChange={(e) => handleFeedbackChange(q.id, e.target.value)}
                  />
                </div>
                {answer?.feedback && (
                  <div className="only-print" style={{ marginTop: '1rem', padding: '1rem', borderLeft: '4px solid var(--primary)', background: '#f8fafc' }}>
                    <strong>Feedback:</strong> {answer.feedback}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="only-print" style={{ marginTop: '5rem', borderTop: '2px solid var(--text)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ height: '40px', width: '200px', borderBottom: '1px solid black', marginBottom: '0.5rem' }}></div>
            <p><strong>Assessor Signature</strong></p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <style>{`
        .result-paper { box-shadow: var(--shadow-lg); }
        .only-print { display: none; }
        .loading-spinner {
          width: 40px; height: 40px; border: 4px solid var(--primary-light);
          border-top: 4px solid var(--primary); border-radius: 50%;
          animation: spin 1s linear infinite; margin: 0 auto 1.5rem;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @media print {
          .no-print { display: none !important; }
          .only-print { display: block !important; }
          .container { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
          .card { border: none !important; box-shadow: none !important; padding: 0 !important; }
          body { background: white !important; }
          .score-input { border: none !important; background: transparent !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default MarkingView;
