import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Submission, Exam } from '../types.ts';
import { Printer, ChevronLeft, CheckCircle, XCircle, FileText, User, GraduationCap, Phone } from 'lucide-react';

const ResultsView: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (submissionId) {
      api.getSubmissions().then(subs => {
        const sub = subs.find(s => s.id === submissionId);
        if (sub) { setSubmission(sub); api.getExam(sub.examId).then(setExam); }
      });
    }
  }, [submissionId]);

  if (!submission || !exam) return (
    <div className="loading-center">
      <div className="loading-spinner" />
      <span>Loading results...</span>
    </div>
  );

  const totalAwarded = submission.answers.reduce((s, a) => s + (a.pointsAwarded || 0), 0);
  const totalMax = exam.questions.reduce((s, q) => s + q.maxPoints, 0);
  const pct = totalMax > 0 ? (totalAwarded / totalMax) * 100 : 0;
  const passed = pct >= 50;

  const scoreColor = pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '60px' }}>
      {/* Toolbar */}
      <div className="no-print" style={{
        background: 'white', borderBottom: '1px solid var(--border)',
        padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
      }}>
        <button className="btn btn-secondary" style={{ fontSize: '13px' }} onClick={() => navigate('/dashboard')}>
          <ChevronLeft size={16} /> Back to Dashboard
        </button>
        <button className="btn btn-secondary" style={{ fontSize: '13px' }} onClick={() => window.print()}>
          <Printer size={15} /> Print Result
        </button>
      </div>

      <div className="container" style={{ maxWidth: '900px' }}>
        <div className="card" style={{ padding: '0', overflow: 'hidden', marginTop: '24px', boxShadow: 'var(--shadow-lg)' }}>
          {/* Score hero */}
          <div style={{
            background: `linear-gradient(135deg, ${scoreColor}15, ${scoreColor}08)`,
            borderBottom: '1px solid var(--border)',
            padding: '40px 40px 32px',
            textAlign: 'center'
          }}>
            <div style={{ color: 'var(--primary)', marginBottom: '12px' }}>
              <GraduationCap size={44} style={{ margin: '0 auto' }} />
            </div>
            <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 900 }}>Assessment Result</h1>
            <div className="badge badge-info" style={{ fontSize: '13px', padding: '4px 12px' }}>{exam.title}</div>

            {/* Big score */}
            <div style={{ marginTop: '28px' }}>
              <div style={{ fontSize: '64px', fontWeight: 900, lineHeight: 1, color: scoreColor }}>
                {totalAwarded}
                <span style={{ fontSize: '28px', color: 'var(--text-muted)', fontWeight: 500 }}>/{totalMax}</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: scoreColor, marginTop: '6px' }}>
                {pct.toFixed(1)}%
              </div>

              {/* Score bar */}
              <div style={{ maxWidth: '320px', margin: '16px auto 0' }}>
                <div className="score-bar-wrap" style={{ height: '12px' }}>
                  <div
                    className="score-bar-fill"
                    style={{ width: `${pct}%`, background: scoreColor, transition: 'width 1s cubic-bezier(0.34,1.56,0.64,1)' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <span>0</span><span>50%</span><span>100%</span>
                </div>
              </div>

              {/* Pass/Fail chip */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                marginTop: '16px', padding: '8px 20px', borderRadius: '99px',
                background: passed ? '#d1fae5' : '#fee2e2',
                color: passed ? '#065f46' : '#991b1b',
                fontWeight: 800, fontSize: '15px'
              }}>
                {passed ? <CheckCircle size={18} /> : <XCircle size={18} />}
                {passed ? 'PASSED' : 'NOT PASSED'}
              </div>
            </div>
          </div>

          {/* Student info */}
          <div style={{ padding: '24px 40px', background: '#f8fafc', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={18} color="var(--text-muted)" />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Student</div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{submission.student.name} {submission.student.surname}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={18} color="var(--text-muted)" />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>SA ID Number</div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{submission.student.id}</div>
              </div>
            </div>
            {submission.student.cellNumber && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Phone size={18} color="var(--text-muted)" />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cell Number</div>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{submission.student.cellNumber}</div>
                </div>
              </div>
            )}
            {submission.submitTime && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={18} color="var(--text-muted)" />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Submitted</div>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{new Date(submission.submitTime).toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>

          {/* Answer breakdown */}
          <div style={{ padding: '32px 40px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 24px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>
              Answer Breakdown
            </h2>
            <div style={{ display: 'grid', gap: '20px' }}>
              {exam.questions.map((q, idx) => {
                const answer = submission.answers.find(a => a.questionId === q.id);
                const awarded = answer?.pointsAwarded || 0;
                const qPct = (awarded / q.maxPoints) * 100;
                const qColor = qPct === 100 ? '#16a34a' : qPct >= 50 ? '#d97706' : '#dc2626';

                return (
                  <div key={q.id} style={{
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: 'white'
                  }}>
                    {/* Question header */}
                    <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'var(--primary)', color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: 800
                        }}>
                          {idx + 1}
                        </div>
                        <span className={`badge ${q.type === 'MCQ' ? 'badge-info' : q.type === 'SHORT' ? 'badge-warning' : 'badge-success'}`}>{q.type}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 900, color: qColor }}>{awarded}</span>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>/ {q.maxPoints}</span>
                        <div style={{ width: '60px', marginLeft: '8px' }}>
                          <div className="score-bar-wrap" style={{ height: '6px' }}>
                            <div className="score-bar-fill" style={{ width: `${qPct}%`, background: qColor }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '16px 20px' }}>
                      <p style={{ fontWeight: 600, fontSize: '15px', margin: '0 0 14px', lineHeight: 1.5 }}>{q.prompt}</p>

                      {/* Student answer */}
                      <div style={{ padding: '12px 16px', background: '#f1f5f9', borderRadius: '8px', marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.05em' }}>
                          Your Response
                        </div>
                        {q.type === 'MCQ' ? (
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '14px' }}>
                              {q.options?.[answer?.value as number] || <span style={{ fontStyle: 'italic', color: 'var(--danger)' }}>No answer</span>}
                            </div>
                            <div style={{ marginTop: '6px', fontSize: '13px', fontWeight: 700, color: awarded === q.maxPoints ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              {awarded === q.maxPoints
                                ? <><CheckCircle size={14} /> Correct</>
                                : <><XCircle size={14} /> Incorrect — Correct: <em>{q.options?.[q.correctOptionIndex!]}</em></>
                              }
                            </div>
                          </div>
                        ) : (
                          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '14px' }}>
                            {answer?.value || <span style={{ fontStyle: 'italic', color: 'var(--danger)' }}>No answer provided</span>}
                          </div>
                        )}
                      </div>

                      {/* Feedback */}
                      {answer?.feedback && (
                        <div style={{
                          padding: '12px 16px',
                          borderLeft: '4px solid var(--primary)',
                          background: '#f0f9ff',
                          borderRadius: '0 8px 8px 0'
                        }}>
                          <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '4px', letterSpacing: '0.05em' }}>
                            Teacher's Feedback
                          </div>
                          <div style={{ fontSize: '14px', lineHeight: 1.6 }}>{answer.feedback}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .container { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
          .card { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ResultsView;
