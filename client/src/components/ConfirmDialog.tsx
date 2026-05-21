import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  title?: string;
  message: string;
  confirmLabel?: string;
  confirmDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<Props> = ({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  confirmDanger = false,
  onConfirm,
  onCancel,
}) => (
  <div className="modal-overlay" onClick={onCancel}>
    <div className="modal" onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: confirmDanger ? '#fee2e2' : '#fef9c3',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: confirmDanger ? 'var(--danger)' : '#d97706'
        }}>
          <AlertTriangle size={20} />
        </div>
        <div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800 }}>{title}</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5 }}>{message}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button
          className={`btn ${confirmDanger ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmDialog;
