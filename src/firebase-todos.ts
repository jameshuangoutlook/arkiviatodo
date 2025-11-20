import { getFirestore, collection, collectionGroup, getDocs, updateDoc, doc, deleteDoc, setDoc, query, where } from 'firebase/firestore';
import { app, auth } from './firebase';

// Fetch all user emails for sharing dropdown
export async function fetchAllUserEmails(): Promise<Array<{ uid: string; email: string }>> {
  const user = auth.currentUser;
  const allUsersCollection = collection(db, 'users');
  const allUsersSnapshot = await getDocs(allUsersCollection);
  const list: Array<{ uid: string; email: string }> = [];
  allUsersSnapshot.forEach(d => {
    const data = d.data();
    if (data.email && (!user || d.id !== user.uid)) list.push({ uid: d.id, email: data.email });
  });
  return list;
}

const db = getFirestore(app);

function getUserTodosCollection() {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return collection(db, 'users', user.uid, 'todos');
}

function getUserTodosCollectionForUid(uid: string) {
  return collection(db, 'users', uid, 'todos');
}

export async function fetchTodos() {
  try {
    const user = auth.currentUser;
    if (!user) return [];
    const todosCollection = getUserTodosCollection();
    const snapshot = await getDocs(todosCollection);
    // include ownerId for each todo (current user)
    let todos: any[] = snapshot.docs.map(d => ({ id: d.id, ownerId: user.uid, ...d.data() }));

    // Query across all 'todos' subcollections for docs where sharedWith contains current user's email
    // use collectionGroup for efficiency and to avoid scanning parent user docs
    const sharedQuery = query(collectionGroup(db, 'todos'), where('sharedWith', 'array-contains', user.email));
    const sharedSnapshot = await getDocs(sharedQuery);
    for (const todoDoc of sharedSnapshot.docs) {
      // determine ownerId from path: users/{ownerId}/todos/{todoId}
      const parent = todoDoc.ref.parent; // points to 'todos' collection ref
      const ownerRef = parent.parent; // parent of 'todos' is user doc
      const ownerId = ownerRef ? ownerRef.id : undefined;
      // skip the current user's own todos (they are already included)
      if (ownerId === user.uid) continue;
      const data = todoDoc.data();
      // only include if sharedWith indeed contains user's email (defensive)
      if (Array.isArray(data.sharedWith) && data.sharedWith.some((s: any) => typeof s === 'string' && s.toLowerCase().trim() === (user.email || '').toLowerCase().trim())) {
        todos.push({ id: todoDoc.id, ownerId, ...data });
      }
    }

    return todos;
  } catch (err: any) {
    console.error('fetchTodos error', err);
    throw err;
  }
}

export async function createTodo(id: string, description: string) {
  try {
    const todosCollection = getUserTodosCollection();
    await setDoc(doc(todosCollection, id), { description, done: false, sharedWith: [] });
  } catch (err: any) {
    console.error('createTodo error', err);
    throw err;
  }
}
export async function shareTodo(id: string, email: string) {
  try {
    const todosCollection = getUserTodosCollection();
    const todoRef = doc(todosCollection, id);
    const todoSnap = await getDocs(todosCollection);
    let sharedWith: string[] = [];
    todoSnap.forEach(d => {
      if (d.id === id) {
        const data = d.data();
        sharedWith = Array.isArray(data.sharedWith) ? data.sharedWith : [];
      }
    });
    if (!sharedWith.includes(email)) sharedWith.push(email);
    await updateDoc(todoRef, { sharedWith });
  } catch (err: any) {
    console.error('shareTodo error', err);
    throw err;
  }
}

// Owner-specific operations so shared todos can be modified by the owner or by others who have access
export async function updateTodoForOwner(ownerId: string, id: string, description: string) {
  try {
    const todosCollection = getUserTodosCollectionForUid(ownerId);
    await updateDoc(doc(todosCollection, id), { description });
  } catch (err: any) {
    console.error('updateTodoForOwner error', err);
    throw err;
  }
}

export async function setTodoDoneForOwner(ownerId: string, id: string, done: boolean) {
  try {
    const todosCollection = getUserTodosCollectionForUid(ownerId);
    await updateDoc(doc(todosCollection, id), { done });
  } catch (err: any) {
    console.error('setTodoDoneForOwner error', err);
    throw err;
  }
}

export async function deleteTodoForOwner(ownerId: string, id: string) {
  try {
    const todosCollection = getUserTodosCollectionForUid(ownerId);
    await deleteDoc(doc(todosCollection, id));
  } catch (err: any) {
    console.error('deleteTodoForOwner error', err);
    throw err;
  }
}

export async function updateTodo(id: string, description: string) {
  try {
    const todosCollection = getUserTodosCollection();
    await updateDoc(doc(todosCollection, id), { description });
  } catch (err: any) {
    console.error('updateTodo error', err);
    throw err;
  }
}

export async function setTodoDone(id: string, done: boolean) {
  try {
    const todosCollection = getUserTodosCollection();
    await updateDoc(doc(todosCollection, id), { done });
  } catch (err: any) {
    console.error('setTodoDone error', err);
    throw err;
  }
}

export async function deleteTodo(id: string) {
  try {
    const todosCollection = getUserTodosCollection();
    await deleteDoc(doc(todosCollection, id));
  } catch (err: any) {
    console.error('deleteTodo error', err);
    throw err;
  }
}
