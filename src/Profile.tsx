import React from 'react';
import { auth } from './firebase';

const Profile: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const user = auth.currentUser;

  return (
    <div className="card mx-auto" style={{ maxWidth: 420 }}>
      <div className="card-body">
        <h2 className="card-title">Profile</h2>
        {user ? (
          <>
            <p><strong>Email:</strong> {user.email}</p>
            <button className="btn btn-outline-danger w-100" onClick={() => { auth.signOut(); onLogout(); }}>Logout</button>
          </>
        ) : (
          <p>No user logged in.</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
