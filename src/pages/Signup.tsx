import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  updateProfile, 
  auth 
} from '../lib/firebase';
import { Sparkles, Eye, EyeOff, Lock, Mail, User as UserIcon, AlertCircle, ArrowRight } from 'lucide-react';

export const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const navigate = useNavigate();

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create Firebase Authentication account
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // 2. Update display name in Firebase Auth
      await updateProfile(user, { displayName: fullName.trim() });

      try {
        // 3. Send real verification email using Firebase built-in service
        await sendEmailVerification(user);
        // Sign out to force login later
        await auth.signOut();
        
        setToast({ type: 'success', message: 'Sign-up successful! Verification email sent.' });
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (emailErr: any) {
        // If email sending fails, delete user to prevent duplicate accounts
        await user.delete();
        setToast({ type: 'error', message: 'Failed to send verification email. Please try again.' });
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setToast({ type: 'error', message: 'Sign-up failed' });
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email address already exists. Please log in.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {toast && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: '#fff',
            fontWeight: '600',
            zIndex: 9999,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            {toast.message}
          </div>
        )}
        <div className="auth-header">
          <div className="auth-logo">
            <Sparkles size={28} />
          </div>
          <h2>Create your Account</h2>
          <p>Join MyWorkspace to manage your tasks and profile</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="auth-form">
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <div className="input-wrapper">
              <UserIcon className="input-icon" size={18} />
              <input
                id="fullName"
                type="text"
                required
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                id="email"
                type="email"
                required
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
