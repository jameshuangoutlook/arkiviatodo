import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { fetchTodos, createTodo, updateTodo, setTodoDone, deleteTodo, shareTodo, updateTodoForOwner, setTodoDoneForOwner, deleteTodoForOwner } from './firebase-todos';
import { fetchAllUserEmails } from './firebase-todos';

type ToDo = {
  id: string;
  description: string;
  done: boolean;
  sharedWith?: string[];
  ownerId?: string;
};

const ToDoManager: React.FC = () => {
  const [todos, setTodos] = useState<ToDo[]>([]);
  const [newId, setNewId] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareId, setShareId] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [userList, setUserList] = useState<Array<{ uid: string; email: string }>>([]);
  const [toasts, setToasts] = useState<Array<{ id: number; variant: 'success'|'danger'|'info'|'warning'; title?: string; message: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  const refreshTodos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTodos();
      setTodos(data as ToDo[]);
      console.log('fetched todos', data);
    } catch (err: any) {
      console.error('refreshTodos error', err);
      setError(err?.message ?? String(err));
      addToast('danger', firebaseErrorMessage(err), 'Load failed');
    } finally {
      setLoading(false);
    }
  };

  const emailMatches = (sharedWith: any, email: string | undefined) => {
    if (!email || !Array.isArray(sharedWith)) return false;
    const target = email.toLowerCase().trim();
    return sharedWith.some((s: any) => typeof s === 'string' && s.toLowerCase().trim() === target);
  };

  const addToast = (variant: 'success'|'danger'|'info'|'warning', message: string, title?: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts(prev => [...prev, { id, variant, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const firebaseErrorMessage = (err: any) => {
    if (!err) return 'An unknown error occurred.';
    const code: string = err.code || '';
    switch (code) {
      case 'permission-denied': return 'You do not have permission to perform this action.';
      case 'auth/user-not-found': return 'No account found with that email.';
      case 'auth/wrong-password': return 'Incorrect password.';
      case 'auth/email-already-in-use': return 'That email is already in use.';
      case 'auth/invalid-email': return 'The email address is invalid.';
      case 'auth/weak-password': return 'The password is too weak.';
      case 'unavailable': return 'Service unavailable. Check your network.';
      default:
        return err.message ?? String(err);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      refreshTodos();
    });
    // Fetch all users for sharing and owner lookup
    fetchAllUserEmails()
      .then((list) => {
        setUserList(list);
        console.log('fetched userList', list);
      })
      .catch((err: any) => {
        console.error('fetchAllUserEmails error', err);
        setError(err?.message ?? String(err));
      });
    return () => unsubscribe();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createTodo(newId, newDescription);
      setNewId('');
      setNewDescription('');
      await refreshTodos();
      addToast('success', 'ToDo created', 'Success');
    } catch (err: any) {
      console.error('handleCreate error', err);
      const msg = firebaseErrorMessage(err);
      setError(msg);
      addToast('danger', msg, 'Create failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = async (ownerId: string | undefined, id: string, done: boolean) => {
    setLoading(true);
    setError(null);
    try {
      if (ownerId && ownerId !== auth.currentUser?.uid) {
        await setTodoDoneForOwner(ownerId, id, done);
      } else {
        await setTodoDone(id, done);
      }
      await refreshTodos();
      addToast('success', `ToDo ${done ? 'marked done' : 'marked undone'}`, 'Updated');
    } catch (err: any) {
      console.error('handleDone error', err);
      const msg = firebaseErrorMessage(err);
      setError(msg);
      addToast('danger', msg, 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (ownerId: string | undefined, id: string, description: string) => {
    setLoading(true);
    setError(null);
    try {
      if (ownerId && ownerId !== auth.currentUser?.uid) {
        await updateTodoForOwner(ownerId, id, description);
      } else {
        await updateTodo(id, description);
      }
      await refreshTodos();
      addToast('success', 'ToDo updated', 'Success');
    } catch (err: any) {
      console.error('handleUpdate error', err);
      const msg = firebaseErrorMessage(err);
      setError(msg);
      addToast('danger', msg, 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (ownerId: string | undefined, id: string) => {
    setLoading(true);
    setError(null);
    try {
      if (ownerId && ownerId !== auth.currentUser?.uid) {
        await deleteTodoForOwner(ownerId, id);
      } else {
        await deleteTodo(id);
      }
      await refreshTodos();
      addToast('success', 'ToDo deleted', 'Success');
    } catch (err: any) {
      console.error('handleDelete error', err);
      const msg = firebaseErrorMessage(err);
      setError(msg);
      addToast('danger', msg, 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  // ...existing code...

  if (!auth.currentUser) {
    return <div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif' }}><h2>Please log in to manage your ToDos.</h2></div>;
  }

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await shareTodo(shareId, shareEmail);
      setShareId('');
      setShareEmail('');
      await refreshTodos();
      addToast('success', 'ToDo shared', 'Success');
    } catch (err: any) {
      console.error('handleShare error', err);
      const msg = firebaseErrorMessage(err);
      setError(msg);
      addToast('danger', msg, 'Share failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-4">
      <h1 className="mb-4">ToDo Manager</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-3">
        <div className="card-body">
          <form onSubmit={handleCreate} className="row g-2">
            <div className="col-auto">
              <input className="form-control" type="text" placeholder="ID" value={newId} onChange={e => setNewId(e.target.value)} required />
            </div>
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
              <button type="button" className="btn-close btn-close-white ms-2 mb-1" onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}></button>
            </div>
            <div className="toast-body">{t.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToDoManager;
