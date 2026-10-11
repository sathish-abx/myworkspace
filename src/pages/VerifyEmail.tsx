import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const VerifyEmail = () => {
  const { emailVerified } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (emailVerified) {
      navigate('/dashboard');
    }
  }, [emailVerified, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo accent-warning">
            <Mail size={32} />
          </div>
          <h2>Verify Your Email</h2>
          <p>Please check your inbox for a verification link. Once verified, you can log in.</p>
        </div>
      </div>
    </div>
  );
};
