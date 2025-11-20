
import React, { useState } from 'react';
import ToDoManager from './ToDoManager';
import Login from './Login';
import Register from './Register';
import Profile from './Profile';
import { auth } from './firebase';

type Page = 'login' | 'register' | 'profile' | 'todos';

function App() {
  const [page, setPage] = useState<Page>('login');
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = () => {
    setLoggedIn(true);
    setPage('todos');
  };
  const handleRegister = () => {
    setLoggedIn(true);
    setPage('todos');
  };
  const handleLogout = async () => {
    await auth.signOut();
    setLoggedIn(false);
    setPage('login');
  };

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container">
          <a className="navbar-brand" href="#">ToDo App</a>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav ms-auto">
              {!loggedIn && <li className="nav-item"><button className="btn btn-link nav-link" onClick={() => setPage('login')}>Login</button></li>}
              {!loggedIn && <li className="nav-item"><button className="btn btn-link nav-link" onClick={() => setPage('register')}>Register</button></li>}
              {loggedIn && <li className="nav-item"><button className="btn btn-link nav-link" onClick={() => setPage('todos')}>ToDos</button></li>}
              {loggedIn && <li className="nav-item"><button className="btn btn-link nav-link" onClick={() => setPage('profile')}>Profile</button></li>}
              {loggedIn && <li className="nav-item"><button className="btn btn-outline-secondary" onClick={handleLogout}>Logout</button></li>}
            </ul>
          </div>
        </div>
      </nav>
      <div className="container mt-4">
        {page === 'login' && <Login onLogin={handleLogin} />}
        {page === 'register' && <Register onRegister={handleRegister} />}
        {page === 'profile' && <Profile onLogout={handleLogout} />}
        {page === 'todos' && loggedIn && <ToDoManager />}
      </div>
    </div>
  );
}

export default App;
