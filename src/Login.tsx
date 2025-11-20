import React, { useState } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="card mx-auto" style={{ maxWidth: 420 }}>
      <div className="card-body">
        <h2 className="card-title">Login</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <input className="form-control" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="mb-3">
            <input className="form-control" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary w-100" type="submit">Login</button>
          {error && <div className="mt-2 text-danger">{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default Login;
