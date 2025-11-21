import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import ToDoManagerView, { ToDo } from './ToDoManagerView';
import { fetchTodos, createTodo, updateTodo, setTodoDone, deleteTodo, shareTodo, updateTodoForOwner, setTodoDoneForOwner, deleteTodoForOwner, fetchAllUserEmails } from './firebase-todos';

const ToDoManager: React.FC = () => {
  const [todos, setTodos] = useState<ToDo[]>([]);
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const createdId = await createTodo(newDescription);
      setNewDescription('');
      await refreshTodos();
      addToast('success', `ToDo created (id: ${createdId})`, 'Success');
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

  // copy helper used by view
  const handleCopy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      addToast('info', `Copied ID ${id} to clipboard`, 'Copied');
    } catch (err: any) {
      addToast('danger', 'Could not copy ID to clipboard', 'Copy failed');
    }
  };

  // owner share helper used by view (prompts for email)
  const handleOwnerShare = async (id: string) => {
    const email = window.prompt('Enter recipient email to share this ToDo:');
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      await shareTodo(id, email);
      await refreshTodos();
      addToast('success', `ToDo shared with ${email}`, 'Shared');
    } catch (err: any) {
      const msg = firebaseErrorMessage(err);
      setError(msg);
      addToast('danger', msg, 'Share failed');
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
    <ToDoManagerView
      todos={todos}
      loading={loading}
      error={error}
      newDescription={newDescription}
      setNewDescription={setNewDescription}
      handleCreate={handleCreate}
      shareId={shareId}
      setShareId={setShareId}
      shareEmail={shareEmail}
      setShareEmail={setShareEmail}
      handleShare={handleShare}
      handleDone={handleDone}
      handleUpdate={handleUpdate}
      handleDelete={handleDelete}
      userList={userList}
      toasts={toasts}
      onCopy={handleCopy}
      onOwnerShare={handleOwnerShare}
    />
  );
};

export default ToDoManager;
