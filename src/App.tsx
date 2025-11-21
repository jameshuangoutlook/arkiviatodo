
import React, { useEffect, useState } from 'react';
import { Link, NavLink, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import ToDoManager from './ToDoManager';
import Login from './Login';
import Register from './Register';
import Profile from './Profile';
import { auth } from './firebase';

function App() {
  const [loggedIn, setLoggedIn] = useState<boolean>(!!auth.currentUser);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      setLoggedIn(!!user);
    });
    return () => unsub();
  }, []);

  const handleLogin = () => {
    setLoggedIn(true);
    navigate('/todos');
  };
  const handleRegister = () => {
    setLoggedIn(true);
    navigate('/todos');
  };
  const handleLogout = async () => {
    await auth.signOut();
    setLoggedIn(false);
    navigate('/login');
  };

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container">
          <Link className="navbar-brand" to="/">ToDo App</Link>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav ms-auto">
              {!loggedIn && <li className="nav-item"><NavLink className="nav-link" to="/login">Login</NavLink></li>}
              {!loggedIn && <li className="nav-item"><NavLink className="nav-link" to="/register">Register</NavLink></li>}
              {loggedIn && <li className="nav-item"><NavLink className="nav-link" to="/todos">ToDos</NavLink></li>}
              {loggedIn && <li className="nav-item"><NavLink className="nav-link" to="/profile">Profile</NavLink></li>}
              {loggedIn && <li className="nav-item"><button className="btn btn-outline-secondary" onClick={handleLogout}>Logout</button></li>}
            </ul>
          </div>
        </div>
      </nav>
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={loggedIn ? <Navigate to="/todos" replace /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register onRegister={handleRegister} />} />
          <Route path="/profile" element={<Profile onLogout={handleLogout} />} />
          <Route path="/todos" element={loggedIn ? <ToDoManager /> : <Navigate to="/login" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
