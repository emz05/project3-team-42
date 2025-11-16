import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './css/manager-login.css';
import { MANAGER_WHITELIST, useManagerAuth } from './ManagerAuthContext.jsx';

const ManagerLogin = () => {
  const navigate = useNavigate();
  const { isAuthorized, login } = useManagerAuth();
  const [error, setError] = useState('');
  const configured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  useEffect(() => {
    if (isAuthorized) {
      navigate('/manager', { replace: true });
    }
  }, [isAuthorized, navigate]);

  const handleSuccess = useCallback((credentialResponse) => {
    setError('');
    try {
      const payload = jwtDecode(credentialResponse?.credential || '');
      const success = login({
        email: payload?.email,
        name: payload?.name,
        picture: payload?.picture,
        sub: payload?.sub,
      });

      if (!success) {
        setError('This Google account is not on the authorized manager list.');
        return;
      }

      navigate('/manager', { replace: true });
    } catch (err) {
      setError('Unable to verify Google response. Please try again.');
    }
  }, [login, navigate]);

  const handleError = useCallback(() => {
    setError('Google sign-in failed. Please try again.');
  }, []);

  const approvedList = useMemo(
    () => MANAGER_WHITELIST.map((email) => email.toLowerCase()),
    [],
  );

  return (
    <div className="manager-login-container">
      <div className="manager-login-box">
        <h1>Manager Sign In</h1>
        <p>Only approved Google accounts may access the dashboard.</p>

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        <div className="google-login-wrapper">
          {configured ? (
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              width="100%"
              height="100%"
              shape="rectangular"
              text="continue_with"
            />
          ) : (
            <div className="missing-config">
              Missing <code>VITE_GOOGLE_CLIENT_ID</code> configuration.
            </div>
          )}
        </div>

        <div className="note">
          Approved emails:
          <ul>
            {approvedList.map((email) => (
              <li key={email}>{email}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ManagerLogin;
