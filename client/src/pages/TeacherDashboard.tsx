import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Submission, Exam } from '../types.ts';
import { PlusCircle, Search, LogOut, ChevronRight, BookOpen, Users, ClipboardCheck, Clock } from 'lucide-react';
import ToastContainer, { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

const TeacherDashboard: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'submissions' | 'exams'>('submissions');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { toasts, showToast } = useToast();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [subs, examsList] = await Promise.all([api.getSubmissions(), api.getExams()]);
      setSubmissions(subs);
      setExams(examsList);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem('isTeacher') !== 'true') {
      navigate('/teacher/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const handleDeleteExam = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteExam(deleteTarget);
      setDeleteTarget(null);
      showToast('Exam deleted successfully.', 'success');
      fetchData();
    } catch (err: any) {
      setDeleteTarget(null);
      showToast(err.message || 'Failed to delete exam.', 'error');
    }
  };

  const filteredSubmissions = submissions.filter(sub =>
    `${sub.student.name} ${sub.student.surname} ${sub.student.id}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSubCount = (examId: string) => submissions.filter(s => s.examId === examId).length;
  const ungradedCount = submissions.filter(s => s.status === 'SUBMITTED').length;

  return (
    <div className="app-container">
      <ToastContainer toasts={toasts} />

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Exam"
          message="This will permanently delete the exam and cannot be undone. Are you sure?"
          confirmLabel="Delete"
          confirmDanger
          onConfirm={handleDeleteExam}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="Khusela" style={{ height: '40px', objectFit: 'contain' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', borderLeft: '1px solid var(--border)', paddingLeft: '10px' }}>Admin</span>
        </div>
        <button className="btn btn-secondary" style={{ fontSize: '13px' }} onClick={() => {
          sessionStorage.removeItem('isTeacher');
          navigate('/');
        }}>
          <LogOut size={15} /> Logout
        </button>
      </nav>

      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '26px', fontWeight: 900, margin: '0 0 4px' }}>Dashboard</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>Manage assessments and student submissions.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/teacher/create')}>
            <PlusCircle size={17} /> Create Exam
          </button>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="stats-grid">
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="stat-card-value">{exams.length}</div>
                  <div className="stat-card-label">Total Exams</div>
                </div>
                <BookOpen size={22} color="var(--primary)" />
              </div>
            </div>
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="stat-card-value">{submissions.length}</div>
                  <div className="stat-card-label">Submissions</div>
                </div>
                <Users size={22} color="var(--secondary)" />
              </div>
            </div>
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="stat-card-value" style={{ color: ungradedCount > 0 ? '#d97706' : 'var(--text)' }}>{ungradedCount}</div>
                  <div className="stat-card-label">Needs Marking</div>
                </div>
                <Clock size={22} color={ungradedCount > 0 ? '#d97706' : 'var(--text-muted)'} />
              </div>
            </div>
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="stat-card-value" style={{ color: 'var(--primary)' }}>
                    {submissions.filter(s => s.status === 'MARKED').length}
                  </div>
                  <div className="stat-card-label">Marked</div>
                </div>
                <ClipboardCheck size={22} color="var(--primary)" />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="tab-bar" style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--border)' }}>
          <button className={`tab-btn ${activeTab === 'submissions' ? 'active' : ''}`} onClick={() => setActiveTab('submissions')}>
            Submissions
            {ungradedCount > 0 && (
              <span style={{ marginLeft: '8px', background: '#d97706', color: 'white', borderRadius: '12px', padding: '1px 7px', fontSize: '11px', fontWeight: 800 }}>
                {ungradedCount}
              </span>
            )}
          </button>
          <button className={`tab-btn ${activeTab === 'exams' ? 'active' : ''}`} onClick={() => setActiveTab('exams')}>
            Manage Exams
          </button>
        </div>

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', background: '#f8f9fa', borderBottom: '1px solid var(--border)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by name or student ID..."
                  style={{ paddingLeft: '38px', margin: 0, fontSize: '14px' }}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Exam</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map(sub => {
                    const exam = exams.find(e => e.id === sub.examId);
                    const maxPts = exam?.questions.reduce((a, b) => a + b.maxPoints, 0) || 0;
                    return (
                      <tr key={sub.id}>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: '14px' }}>{sub.student.name} {sub.student.surname}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {sub.student.id}</div>
                          {sub.student.cellNumber && (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📱 {sub.student.cellNumber}</div>
                          )}
                        </td>
                        <td style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{exam?.title || sub.examId}</td>
                        <td>
                          <span className={`badge ${sub.status === 'MARKED' ? 'badge-success' : sub.status === 'STARTED' ? 'badge-info' : 'badge-warning'}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td>
                          {sub.status === 'MARKED' ? (
                            <div>
                              <strong style={{ color: 'var(--primary)' }}>{sub.totalScore}</strong>
                              <span style={{ color: 'var(--text-muted)' }}> / {maxPts}</span>
                              {maxPts > 0 && (
                                <div className="score-bar-wrap" style={{ marginTop: '4px', width: '80px', height: '5px' }}>
                                  <div
                                    className="score-bar-fill"
                                    style={{
                                      width: `${((sub.totalScore || 0) / maxPts) * 100}%`,
                                      background: ((sub.totalScore || 0) / maxPts) >= 0.5 ? 'var(--primary)' : 'var(--danger)'
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => navigate(`/teacher/mark/${sub.id}`)}
                          >
                            {sub.status === 'MARKED' ? 'View Report' : 'Mark'} <ChevronRight size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredSubmissions.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty-state">
                          <div className="empty-state-icon"><Users size={26} color="var(--text-muted)" /></div>
                          <div style={{ fontWeight: 700 }}>No submissions found</div>
                          <div style={{ fontSize: '13px' }}>{searchTerm ? 'Try a different search term.' : 'Students haven\'t submitted any exams yet.'}</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Exams Tab */}
        {activeTab === 'exams' && (
          <div className="exam-grid">
            {exams.map(exam => {
              const subCount = getSubCount(exam.id);
              const startTime = new Date(exam.startTime);
              const isUpcoming = startTime > new Date();
              return (
                <div key={exam.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, flex: 1 }}>{exam.title}</h3>
                      <span className={`badge ${isUpcoming ? 'badge-warning' : 'badge-success'}`} style={{ marginLeft: '8px', flexShrink: 0 }}>
                        {isUpcoming ? 'Upcoming' : 'Active'}
                      </span>
                    </div>
                    {exam.description && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 14px', lineHeight: 1.5 }}>{exam.description}</p>
                    )}
                    <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text)' }}>Starts:</strong> {startTime.toLocaleString()}
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text)' }}>Questions:</strong> {exam.questions?.length || 0}
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text)' }}>Submissions:</strong>{' '}
                        <span style={{ color: subCount > 0 ? 'var(--secondary)' : 'var(--text-muted)' }}>{subCount}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ flex: 1, fontSize: '13px' }}
                      onClick={() => navigate(`/teacher/edit/${exam.id}`)}
                      disabled={subCount > 0}
                      title={subCount > 0 ? 'Cannot edit exam with existing submissions' : 'Edit exam'}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ flex: 1, fontSize: '13px' }}
                      onClick={() => setDeleteTarget(exam.id)}
                      disabled={subCount > 0}
                      title={subCount > 0 ? 'Cannot delete exam with existing submissions' : 'Delete exam'}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
            {exams.length === 0 && (
              <div style={{ gridColumn: '1/-1' }}>
                <div className="card empty-state">
                  <div className="empty-state-icon"><BookOpen size={26} color="var(--text-muted)" /></div>
                  <div style={{ fontWeight: 700 }}>No exams yet</div>
                  <div style={{ fontSize: '13px' }}>Click "Create Exam" to post your first assessment.</div>
                  <button className="btn btn-primary" style={{ marginTop: '8px' }} onClick={() => navigate('/teacher/create')}>
                    <PlusCircle size={16} /> Create Exam
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
