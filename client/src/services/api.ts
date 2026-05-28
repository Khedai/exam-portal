import type { Exam, Submission } from '../types.ts';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = {
  // ─── Once-off student login ───────────────────────────────
  async studentLogin(info: { studentId: string; name: string; surname: string; cellNumber: string }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/auth/student-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(info)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
  },

  async getExams(): Promise<Exam[]> {
    const res = await fetch(`${API_BASE}/exams`);
    return res.json();
  },

  async getExam(id: string): Promise<Exam> {
    const res = await fetch(`${API_BASE}/exams/${id}`);
    return res.json();
  },

  async createSubmission(submission: Partial<Submission>): Promise<Submission> {
    const res = await fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission)
    });
    return res.json();
  },

  async updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission> {
    const res = await fetch(`${API_BASE}/submissions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  async getSubmissions(): Promise<Submission[]> {
    const res = await fetch(`${API_BASE}/submissions`);
    return res.json();
  },

  async markSubmission(id: string, data: { answers?: any[], status?: string }): Promise<Submission> {
    const res = await fetch(`${API_BASE}/submissions/${id}/mark`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async createExam(exam: Exam): Promise<Exam> {
    const res = await fetch(`${API_BASE}/exams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exam)
    });
    return res.json();
  },

  async updateExam(id: string, exam: Exam): Promise<Exam> {
    const res = await fetch(`${API_BASE}/exams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exam)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to update exam');
    }
    return res.json();
  },

  async deleteExam(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/exams/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to delete exam');
    }
  }
};