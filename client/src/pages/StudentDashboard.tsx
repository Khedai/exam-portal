import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Exam, Submission } from '../types.ts';
import { BookOpen, LogOut, Clock, ChevronRight } from 'lucide-react';

const SkeletonCard = () => (
  <div className="card" style={{ padding: '20px' }}>
    <div className="skeleton skeleton-title" />
    <div className="skeleton skeleton-text" />
    <div className="skeleton skeleton-text" style={{ width: '40%' }} />
    <div style={{ marginTop: '20px' }}>
      <div className="skeleton skeleton-text" style={{ width: '30%' }} />
      <div className="skeleton skeleton-text" />
    </div>
    <div className="skeleton skeleton-btn" style={{ marginTop: '16px' }} />
  </div>
);

const StudentDashboard: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = sessionStorage.getItem('studentInfo') || localStorage.getItem('studentInfo');
    if (!raw) { navigate('/'); return; }
    const info = JSON.parse(raw);
    // Ensure sessionStorage is populated for ExamView
    sessionStorage.setItem('studentInfo', raw);
    setStudentInfo(info);

    const fetchData = async () => {
      try {
        const [examsData, subsData] = await Promise.all([api.getExams(), api.getSubmissions()]);
        setExams(examsData);
        setSubmissions(subsData);
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  const handleStartExam = async (exam: Exam) => {
    if (!studentInfo) return;
    const studentSubs = submissions.filter(s => s.examId === exam.id && s.student.id === studentInfo.studentId);
    const inProgress = studentSubs.find(s => s.status === 'STARTED');
    if (inProgress) { navigate(`/exam/${exam.id}/${inProgress.id}`); return; }

    const submittedCount = studentSubs.filter(s => s.status === 'SUBMITTED' || s.status === 'MARKED').length;
    if (submittedCount > (exam.maxRetries || 0)) {
      alert('You have reached the maximum number of retries for this exam.');
      return;
    }
    try {
      const submission = await api.createSubmission({
        examId: exam.id,
        student: {
          name: studentInfo.name,
          surname: studentInfo.surname,
          id: studentInfo.studentId,
          cellNumber: studentInfo.cellNumber
        }
      });
      navigate(`/exam/${exam.id}/${submission.id}`);
    } catch (err) {
      console.error('Failed to start exam', err);
    }
  };

  const getExamStatus = (exam: Exam) => {
    const startTime = new Date(exam.startTime);
    const endTime = new Date(startTime.getTime() + (exam.durationMinutes || 60) * 60000);
    const isException = exam.exceptions?.includes(studentInfo?.studentId);

    if (now < startTime) return {
      label: `Opens ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      isLocked: true, variant: 'locked' as const
    };

    const studentSubs = submissions.filter(s => s.examId === exam.id && s.student.id === studentInfo?.studentId);
    const hasSubmitted = studentSubs.some(s => s.status === 'SUBMITTED' || s.status === 'MARKED');
    const hasStarted = studentSubs.some(s => s.status === 'STARTED');

    if (now >= startTime && now < endTime) {
      if (!hasStarted && !hasSubmitted) {
        const diff = endTime.getTime() - now.getTime();
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        return {
          label: `${mins}m ${secs}s remaining`,
          isLocked: false,
          variant: diff < 300000 ? 'urgent' as const : 'open' as const
        };
      }
      return { label: 'In Progress', isLocked: false, variant: 'inprogress' as const };
    }

    if (now >= endTime && !isException) return { label: 'Exam Closed', isLocked: true, variant: 'locked' as const };
    return { label: 'Open (Exception)', isLocked: false, variant: 'open' as const };
  };

  // Stats
  const mySubmissions = submissions.filter(s => s.student.id === studentInfo?.studentId);
  const completedCount = mySubmissions.filter(s => s.status === 'SUBMITTED' || s.status === 'MARKED').length;
  const gradedCount = mySubmissions.filter(s => s.status === 'MARKED').length;
  const availableCount = exams.filter(exam => {
    const status = studentInfo ? getExamStatus(exam) : null;
    return status && !status.isLocked;
  }).length;

  if (!studentInfo) return null;

  const variantStyle: Record<string, React.CSSProperties> = {
    locked:     { borderLeft: '4px solid var(--border)', opacity: 0.7 },
    open:       { borderLeft: '4px solid var(--primary)' },
    urgent:     { borderLeft: '4px solid #ef4444' },
    inprogress: { borderLeft: '4px solid var(--secondary)' },
  };

  const variantBadge: Record<string, string> = {
    locked: 'badge-neutral', open: 'badge-success', urgent: 'badge-danger', inprogress: 'badge-info',
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BookOpen size={22} color="var(--primary)" />
          <h1>ExamPortal</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right', display: 'none' }} className="student-name-desktop">
            <div style={{ fontWeight: 700, fontSize: '14px' }}>{studentInfo.name} {studentInfo.surname}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              ID: {studentInfo.studentId}
              {studentInfo.cellNumber && <> &bull; {studentInfo.cellNumber}</>}
            </div>
          </div>
          <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }} onClick={() => navigate('/')}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </nav>

      <div className="container">
        {/* Greeting */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: 900 }}>
            Welcome back, {studentInfo.name}
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
            Here are your available assessments.
          </p>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-value">{exams.length}</div>
              <div className="stat-card-label">Total Exams</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value" style={{ color: 'var(--primary)' }}>{availableCount}</div>
              <div className="stat-card-label">Available Now</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value" style={{ color: 'var(--secondary)' }}>{completedCount}</div>
              <div className="stat-card-label">Submitted</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value" style={{ color: '#d97706' }}>{gradedCount}</div>
              <div className="stat-card-label">Graded</div>
            </div>
          </div>
        )}

        {/* Exam Cards */}
        {loading ? (
          <div className="exam-grid">
            {[1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : exams.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon"><BookOpen size={28} color="var(--text-muted)" /></div>
            <h3 style={{ margin: 0, fontWeight: 700 }}>No Assessments Yet</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>Your teacher hasn't posted any exams yet. Check back later.</p>
          </div>
        ) : (
          <div className="exam-grid">
            {exams.map(exam => {
              const status = getExamStatus(exam);
              const studentSubs = submissions.filter(s => s.examId === exam.id && s.student.id === studentInfo.studentId);
              const submittedCount = studentSubs.filter(s => s.status === 'SUBMITTED' || s.status === 'MARKED').length;
              const hasStarted = studentSubs.some(s => s.status === 'STARTED');
              const maxAttempts = (exam.maxRetries || 0) + 1;

              return (
                <div
                  key={exam.id}
                  className="card"
                  style={{
                    display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden',
                    ...variantStyle[status.variant],
                  }}
                >
                  <div style={{ padding: '20px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, flex: 1 }}>{exam.title}</h3>
                      <span className={`badge ${variantBadge[status.variant]}`} style={{ marginLeft: '10px', flexShrink: 0 }}>
                        {status.variant === 'locked' ? 'Locked' : status.variant === 'urgent' ? 'Urgent' : status.variant === 'inprogress' ? 'Active' : 'Open'}
                      </span>
                    </div>

                    {exam.description && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 16px', lineHeight: 1.5 }}>{exam.description}</p>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                        <Clock size={13} />
                        <span>{exam.durationMinutes} min &bull; {exam.questions?.length || 0} questions</span>
                      </div>
                      <div style={{ fontWeight: 700, color: status.variant === 'urgent' ? '#ef4444' : status.variant === 'locked' ? 'var(--text-muted)' : 'var(--primary)', fontSize: '13px' }}>
                        {status.label}
                      </div>
                    </div>

                    {/* Attempts progress */}
                    <div style={{ marginTop: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                        <span>Attempts</span>
                        <span>{submittedCount} / {maxAttempts}</span>
                      </div>
                      <div className="progress-bar-wrap">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${(submittedCount / maxAttempts) * 100}%`, background: submittedCount >= maxAttempts ? '#ef4444' : 'var(--primary)' }}
                        />
                      </div>
                    </div>

                    {/* Past attempts */}
                    {studentSubs.length > 0 && (
                      <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                          Past Attempts
                        </div>
                        <div style={{ display: 'grid', gap: '6px' }}>
                          {studentSubs.map((sub, sIdx) => (
                            <div key={sub.id} className="attempt-row">
                              <span style={{ fontWeight: 600 }}>Attempt #{sIdx + 1}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className={`badge ${sub.status === 'MARKED' ? 'badge-success' : sub.status === 'STARTED' ? 'badge-info' : 'badge-warning'}`}>
                                  {sub.status}
                                </span>
                                {sub.status === 'MARKED' && (
                                  <button
                                    className="btn btn-secondary"
                                    style={{ padding: '3px 10px', fontSize: '12px' }}
                                    onClick={() => navigate(`/results/${sub.id}`)}
                                  >
                                    View <ChevronRight size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    className={`btn ${status.isLocked || submittedCount >= maxAttempts ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ borderRadius: '0', padding: '14px', fontSize: '14px', width: '100%' }}
                    onClick={() => handleStartExam(exam)}
                    disabled={status.isLocked || submittedCount >= maxAttempts}
                  >
                    {status.isLocked ? 'Locked'
                      : hasStarted ? 'Continue Assessment'
                      : submittedCount >= maxAttempts ? 'No Retries Left'
                      : submittedCount > 0 ? 'Retry Assessment'
                      : 'Start Assessment'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 640px) { .student-name-desktop { display: block !important; } }
      `}</style>
    </div>
  );
};

export default StudentDashboard;
