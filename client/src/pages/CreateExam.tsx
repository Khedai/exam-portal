import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import type { Exam, Question, QuestionType } from '../types.ts';
import { Plus, Trash, Save, ChevronLeft, GripVertical } from 'lucide-react';
import ToastContainer, { useToast } from '../components/Toast';

const CreateExam: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toasts, showToast } = useToast();

  const [exam, setExam] = useState<Partial<Exam>>({
    title: '',
    description: '',
    durationMinutes: 60,
    startTime: new Date().toISOString().slice(0, 16),
    dueDate: new Date().toISOString().split('T')[0],
    maxRetries: 0,
    questions: [],
    exceptions: []
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('isTeacher') !== 'true') {
      navigate('/teacher/login');
      return;
    }
    if (isEdit) {
      api.getExam(id!).then(data => {
        setExam({
          ...data,
          startTime: data.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
          dueDate: data.dueDate ? data.dueDate.split('T')[0] : new Date().toISOString().split('T')[0]
        });
      }).catch(() => {
        showToast('Failed to load exam data.', 'error');
        navigate('/teacher');
      });
    }
  }, [id, isEdit, navigate]);

  const addQuestion = (type: QuestionType) => {
    const newQ: Question = {
      id: Date.now().toString(),
      type,
      prompt: '',
      maxPoints: type === 'MCQ' ? 5 : 10,
      options: type === 'MCQ' ? ['', '', '', ''] : undefined,
      correctOptionIndex: type === 'MCQ' ? 0 : undefined
    };
    setExam(prev => ({ ...prev, questions: [...(prev.questions || []), newQ] }));
  };

  const removeQuestion = (qId: string) => {
    setExam(prev => ({ ...prev, questions: prev.questions?.filter(q => q.id !== qId) }));
  };

  const updateQuestion = (qId: string, updates: Partial<Question>) => {
    setExam(prev => ({
      ...prev,
      questions: prev.questions?.map(q => q.id === qId ? { ...q, ...updates } : q)
    }));
  };

  const handleSave = async () => {
    if (!exam.title?.trim()) { showToast('Please enter an exam title.', 'error'); return; }
    if (!exam.questions?.length) { showToast('Add at least one question.', 'error'); return; }

    const incomplete = exam.questions.find(q =>
      !q.prompt.trim() || (q.type === 'MCQ' && q.options?.some(o => !o.trim()))
    );
    if (incomplete) { showToast('Please fill in all question prompts and MCQ options.', 'error'); return; }

    setSaving(true);
    try {
      if (isEdit) {
        await api.updateExam(id!, exam as Exam);
        showToast('Exam updated successfully!', 'success');
      } else {
        await api.createExam(exam as Exam);
        showToast('Exam posted successfully!', 'success');
      }
      setTimeout(() => navigate('/teacher'), 1200);
    } catch (err: any) {
      showToast(err.message || 'Failed to save exam.', 'error');
      setSaving(false);
    }
  };

  const totalPoints = exam.questions?.reduce((s, q) => s + (q.maxPoints || 0), 0) || 0;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '60px' }}>
      <ToastContainer toasts={toasts} />

      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'white', borderBottom: '1px solid var(--border)',
        padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
      }}>
        <button className="btn btn-secondary" style={{ fontSize: '13px' }} onClick={() => navigate('/teacher')}>
          <ChevronLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, fontSize: '16px', color: 'var(--text)' }}>
          <img src="/logo.png" alt="Khusela" style={{ height: '32px', objectFit: 'contain' }} />
          {isEdit ? 'Edit Assessment' : 'Create Assessment'}
          {totalPoints > 0 && (
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '12px' }}>
              {totalPoints} pts total
            </span>
          )}
        </div>
        <button className="btn btn-primary" style={{ fontSize: '13px' }} onClick={handleSave} disabled={saving}>
          <Save size={15} /> {saving ? 'Saving...' : isEdit ? 'Update' : 'Post Exam'}
        </button>
      </div>

      <div className="container" style={{ maxWidth: '860px' }}>
        {/* Exam details */}
        <div className="card" style={{ marginTop: '24px' }}>
          <h3 style={{ margin: '0 0 20px', fontWeight: 800, fontSize: '16px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Assessment Details
          </h3>

          <div className="input-group">
            <label>Title *</label>
            <input
              type="text"
              value={exam.title}
              onChange={e => setExam({ ...exam, title: e.target.value })}
              placeholder="e.g. Module 5 Final Assessment"
              style={{ fontSize: '17px', fontWeight: 600 }}
            />
          </div>

          <div className="input-group">
            <label>Description</label>
            <textarea
              rows={2}
              value={exam.description}
              onChange={e => setExam({ ...exam, description: e.target.value })}
              placeholder="Brief instructions for students..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Duration (Minutes)</label>
              <input type="number" value={exam.durationMinutes} min={5}
                onChange={e => setExam({ ...exam, durationMinutes: parseInt(e.target.value) || 60 })} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Max Retries</label>
              <input type="number" value={exam.maxRetries} min={0}
                onChange={e => setExam({ ...exam, maxRetries: parseInt(e.target.value) || 0 })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Start Date &amp; Time *</label>
              <input type="datetime-local" value={exam.startTime}
                onChange={e => setExam({ ...exam, startTime: e.target.value })} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Due Date</label>
              <input type="date" value={exam.dueDate}
                onChange={e => setExam({ ...exam, dueDate: e.target.value })} />
            </div>
          </div>

          <div className="input-group" style={{ marginTop: '16px', marginBottom: 0 }}>
            <label>Exception IDs <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(comma-separated, allows late access)</span></label>
            <input
              type="text"
              value={exam.exceptions?.join(', ')}
              onChange={e => setExam({ ...exam, exceptions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              placeholder="e.g. 1234567890123, 9876543210987"
            />
          </div>
        </div>

        {/* Questions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '28px 0 16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
            Questions <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '15px' }}>({exam.questions?.length || 0})</span>
          </h3>
        </div>

        {exam.questions?.map((q, idx) => (
          <div key={q.id} className="card" style={{ borderLeft: `4px solid ${q.type === 'MCQ' ? 'var(--secondary)' : q.type === 'SHORT' ? 'var(--accent)' : 'var(--primary)'}`, padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <GripVertical size={18} color="var(--border)" style={{ cursor: 'grab' }} />
                <span style={{ fontWeight: 800, fontSize: '15px' }}>Q{idx + 1}</span>
                <span className={`badge ${q.type === 'MCQ' ? 'badge-info' : q.type === 'SHORT' ? 'badge-warning' : 'badge-success'}`}>{q.type}</span>
              </div>
              <button className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '12px' }} onClick={() => removeQuestion(q.id)}>
                <Trash size={14} /> Remove
              </button>
            </div>

            <div className="input-group">
              <label>Question Prompt *</label>
              <textarea
                rows={2}
                value={q.prompt}
                onChange={e => updateQuestion(q.id, { prompt: e.target.value })}
                placeholder="Type the question here..."
                style={{ resize: 'vertical' }}
              />
            </div>

            {q.type === 'MCQ' && (
              <div style={{ marginBottom: '16px' }}>
                <label>Options — click radio to mark correct answer</label>
                <div style={{ display: 'grid', gap: '8px', marginTop: '6px' }}>
                  {q.options?.map((opt, optIdx) => (
                    <div key={optIdx} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 12px', borderRadius: '8px',
                      background: q.correctOptionIndex === optIdx ? '#e8f5e9' : '#f8f9fa',
                      border: `1.5px solid ${q.correctOptionIndex === optIdx ? 'var(--primary)' : 'var(--border)'}`,
                      transition: 'all 0.15s'
                    }}>
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        checked={q.correctOptionIndex === optIdx}
                        onChange={() => updateQuestion(q.id, { correctOptionIndex: optIdx })}
                        style={{ width: '18px', flexShrink: 0 }}
                        title="Mark as correct"
                      />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', minWidth: '20px' }}>
                        {String.fromCharCode(65 + optIdx)}.
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={e => {
                          const newOpts = [...q.options!];
                          newOpts[optIdx] = e.target.value;
                          updateQuestion(q.id, { options: newOpts });
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                        style={{ border: 'none', background: 'transparent', padding: '4px 0', flex: 1, boxShadow: 'none', fontSize: '14px' }}
                      />
                      {q.correctOptionIndex === optIdx && (
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap' }}>✓ Correct</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="input-group" style={{ marginBottom: 0, maxWidth: '200px' }}>
              <label>Max Points</label>
              <input
                type="number"
                value={q.maxPoints}
                min={1}
                onChange={e => updateQuestion(q.id, { maxPoints: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
        ))}

        {/* Add question buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginTop: exam.questions?.length ? '8px' : 0 }}>
          {(['MCQ', 'SHORT', 'LONG'] as QuestionType[]).map(type => (
            <button
              key={type}
              className="btn btn-secondary"
              style={{ border: '1.5px dashed var(--border)', background: 'white', fontSize: '13px' }}
              onClick={() => addQuestion(type)}
            >
              <Plus size={16} />
              {type === 'MCQ' ? 'Multiple Choice' : type === 'SHORT' ? 'Short Answer' : 'Long Answer'}
            </button>
          ))}
        </div>

        {exam.questions?.length === 0 && (
          <div className="card empty-state" style={{ marginTop: '8px', border: '1.5px dashed var(--border)' }}>
            <div className="empty-state-icon"><Plus size={24} color="var(--text-muted)" /></div>
            <div style={{ fontWeight: 700 }}>No questions yet</div>
            <div style={{ fontSize: '13px' }}>Use the buttons above to add MCQ, short, or long answer questions.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateExam;
