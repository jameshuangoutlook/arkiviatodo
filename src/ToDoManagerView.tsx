import React from 'react';
import { auth } from './firebase';

export type ToDo = {
  id: string;
  description: string;
  done: boolean;
  sharedWith?: string[];
  ownerId?: string;
};

type Toast = { id: number; variant: 'success'|'danger'|'info'|'warning'; title?: string; message: string };

interface Props {
  todos: ToDo[];
  loading: boolean;
  error: string | null;
  newDescription: string;
  setNewDescription: (v: string) => void;
  handleCreate: (e: React.FormEvent) => void;
  shareId: string;
  setShareId: (v: string) => void;
  shareEmail: string;
  setShareEmail: (v: string) => void;
  handleShare: (e: React.FormEvent) => void;
  handleDone: (ownerId: string | undefined, id: string, done: boolean) => void;
  handleUpdate: (ownerId: string | undefined, id: string, description: string) => void;
  handleDelete: (ownerId: string | undefined, id: string) => void;
  userList: Array<{ uid: string; email: string }>;
  toasts: Toast[];
  onCopy: (id: string) => void;
  onOwnerShare: (id: string) => void;
}

const ToDoManagerView: React.FC<Props> = ({
  todos,
  loading,
  error,
  newDescription,
  setNewDescription,
  handleCreate,
  shareId,
  setShareId,
  shareEmail,
  setShareEmail,
  handleShare,
  handleDone,
  handleUpdate,
  handleDelete,
  userList,
  toasts,
  onCopy,
  onOwnerShare,
}) => {
  return (
    <div className="container my-4">
      <h1 className="mb-4">ToDo Manager</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-3">
        <div className="card-body">
          <form onSubmit={handleCreate} className="row g-2">
            <div className="col">
              <input className="form-control" type="text" placeholder="Description" value={newDescription} onChange={e => setNewDescription(e.target.value)} required />
            </div>
            <div className="col-auto">
              <button className="btn btn-primary" type="submit" disabled={loading}>Add ToDo</button>
            </div>
          </form>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <form onSubmit={handleShare} className="row g-2 align-items-center">
            <div className="col-auto">
              <input className="form-control" type="text" placeholder="ToDo ID to share" value={shareId} onChange={e => setShareId(e.target.value)} required />
            </div>
            <div className="col-auto">
              <input className="form-control" type="email" placeholder="Recipient Email" value={shareEmail} onChange={e => setShareEmail(e.target.value)} required />
            </div>
            <div className="col-auto">
              <button className="btn btn-secondary" type="submit" disabled={loading}>Share ToDo</button>
            </div>
          </form>
        </div>
      </div>

      <div className="list-group">
        {todos.map(todo => (
          <div key={todo.id} className="list-group-item list-group-item-action mb-2">
            <div className="d-flex align-items-center">
              <div className="me-3"><strong>ID:</strong> {todo.id}</div>
              <div>
                <button className="btn btn-sm btn-outline-secondary ms-2" onClick={() => onCopy(todo.id)}>Copy</button>
                {todo.ownerId && todo.ownerId === auth.currentUser?.uid && (
                  <button className="btn btn-sm btn-outline-primary ms-2" onClick={() => onOwnerShare(todo.id)}>Share</button>
                )}
              </div>
              <div className="me-2">
                <span className="badge bg-light text-dark">
                  {todo.ownerId && todo.ownerId === auth.currentUser?.uid ? 'You' : (userList.find(u => u.uid === todo.ownerId)?.email ?? todo.ownerId ?? 'Unknown')}
                </span>
              </div>
              <div className="form-check form-check-inline me-2">
                <input className="form-check-input" type="checkbox" checked={todo.done} onChange={e => handleDone(todo.ownerId, todo.id, e.target.checked)} />
              </div>
              <div className="flex-grow-1 me-2">
                <input className="form-control" type="text" value={todo.description} onChange={e => handleUpdate(todo.ownerId, todo.id, e.target.value)} />
              </div>
              <div>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(todo.ownerId, todo.id)} disabled={loading}>Delete</button>
              </div>
            </div>
            {todo.sharedWith && todo.sharedWith.length > 0 && (
              <div className="mt-2 text-muted">Shared with: {todo.sharedWith.join(', ')}</div>
            )}
          </div>
        ))}
      </div>
      
      {loading && <p>Loading...</p>}
      <div aria-live="polite" aria-atomic="true" className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1060 }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast show text-bg-${t.variant} mb-2`} role="alert" aria-live="assertive" aria-atomic="true">
            <div className="toast-header">
              <strong className="me-auto">{t.title ?? 'Notice'}</strong>
              <button type="button" className="btn-close btn-close-white ms-2 mb-1" onClick={() => { /* noop: container controls toasts */ }}></button>
            </div>
            <div className="toast-body">{t.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToDoManagerView;
