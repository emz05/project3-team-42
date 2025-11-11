import React from 'react';
import './css/manager-login.css';

const ManagerLogin = () => {
  const googleAuthUrl = '/auth/google';
  return (
    <div className="manager-login-container">
      <div className="manager-login-box">
        <h1>Manager Sign In</h1>
        <p>Google OAuth sign-in coming soon.</p>
        <a className="google-btn disabled" href={googleAuthUrl} onClick={(e) => e.preventDefault()}>
          Continue with Google
        </a>
        <div className="note">This is a placeholder screen.</div>
      </div>
    </div>
  );
};

export default ManagerLogin;

