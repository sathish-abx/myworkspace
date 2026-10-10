import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendEmailVerification } from '../lib/firebase';
import { Mail, CheckCircle2, RefreshCw, LogOut, AlertCircle } from 'lucide-react';

export const VerifyEmail = () => {
  const { user, emailVerified, refreshUserStatus, logout } = useAuth();
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingResend, setLoadingResend] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (emailVerified) {
      navigate('/dashboard');
    }
  }, [user, emailVerified, navigate]);

  const handleResendEmail = async () => {
    if (!user) return;
    setResendMessage(null);
    setErrorMessage(null);
    setLoadingResend(true);

    try {
      await sendEmailVerification(user);
      setResendMessage('Verification email sent! Please check your inbox and spam folder.');
    } catch (err: any) {
      console.error('Error resending email verification:', err);
      if (err.code === 'auth/too-many-requests') {
        setErrorMessage('Too many requests. Please wait a few minutes before requesting another email.');
      } else {
        setErrorMessage(err.message || 'Failed to resend verification email.');
      }
    } finally {
      setLoadingResend(false);
    }
  };

  const handleCheckStatus = async () => {
    setResendMessage(null);
    setErrorMessage(null);
    setCheckingStatus(true);

    try {
      await refreshUserStatus();
      if (user?.emailVerified) {
        setResendMessage('Email verified successfully! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1200);
      } else {
        setErrorMessage('Email is not verified yet. Please click the link in your email and try again.');
      }
    } catch (err: any) {
      console.error('Status check error:', err);
      setErrorMessage('Failed to refresh status. Please try again.');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleBackToLogin = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo accent-warning">
            <Mail size={32} />
          </div>
          <h2>Verify Your Email</h2>
          <p>A verification link has been sent to your email address:</p>
          <div className="email-highlight">{user?.email || 'Your registered email'}</div>
        </div>

        {resendMessage && (
          <div className="alert alert-success">
            <CheckCircle2 size={18} />
            <span>{resendMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="verify-instructions">
          <p>
            Please open your inbox, click the verification link, and then return here to log in or click <strong>Check Verification Status</strong>.
          </p>
        </div>

        <div className="verify-actions">
          <button
            onClick={handleCheckStatus}
            className="btn btn-primary btn-full"
            disabled={checkingStatus}
          >
            <RefreshCw className={checkingStatus ? 'spinner' : ''} size={18} />
            {checkingStatus ? 'Checking Status...' : 'Check Verification Status'}
          </button>

          <button
            onClick={handleResendEmail}
            className="btn btn-secondary btn-full"
            disabled={loadingResend}
          >
            <Mail size={18} />
            {loadingResend ? 'Sending Email...' : 'Resend Verification Email'}
          </button>

          <button onClick={handleBackToLogin} className="btn btn-ghost btn-full">
            <LogOut size={18} />
            Back to Login / Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
