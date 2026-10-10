import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendPasswordResetEmail, auth } from '../lib/firebase';
import { api } from '../lib/api';
import { 
  Mail, 
  Key, 
  LogOut, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';

export const Settings = () => {
  const { user, logout } = useAuth();
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingReset, setLoadingReset] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const navigate = useNavigate();

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    setInfoMessage(null);
    setErrorMessage(null);
    setLoadingReset(true);

    try {
      await sendPasswordResetEmail(auth, user.email);
      setInfoMessage(`Password reset email sent to ${user.email}. Please check your inbox.`);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMessage(err.message || 'Failed to send password reset email.');
    } finally {
      setLoadingReset(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleDeleteAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (confirmEmail.trim().toLowerCase() !== (user?.email || '').toLowerCase()) {
      setErrorMessage('Confirmation email does not match.');
      return;
    }

    setDeletingAccount(true);
    setErrorMessage(null);

    try {
      await api.deleteAccount();
      await logout();
      navigate('/login');
    } catch (err: any) {
      console.error('Account deletion error:', err);
      setErrorMessage(err.message || 'Failed to delete account. You may need to re-authenticate first.');
    } finally {
      setDeletingAccount(false);
      setDeleteModalOpen(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="page-header">
        <div>
          <h1>Account Settings</h1>
          <p className="subtitle">Manage security preferences and account actions</p>
        </div>
      </div>

      {infoMessage && (
        <div className="alert alert-success margin-b">
          <CheckCircle2 size={18} />
          <span>{infoMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-error margin-b">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Account Info Card */}
      <div className="settings-card">
        <div className="card-header">
          <Mail className="header-icon" size={20} />
          <div>
            <h3>Account Overview</h3>
            <p>Your primary account security details</p>
          </div>
        </div>

        <div className="card-body">
          <div className="setting-item">
            <div>
              <span className="setting-title">Primary Email Address</span>
              <p className="setting-desc">{user?.email}</p>
            </div>
            <span className="badge badge-success"><ShieldCheck size={14} /> Verified</span>
          </div>
        </div>
      </div>

      {/* Security Card */}
      <div className="settings-card">
        <div className="card-header">
          <Key className="header-icon" size={20} />
          <div>
            <h3>Password & Authentication</h3>
            <p>Request a password reset link sent to your verified email</p>
          </div>
        </div>

        <div className="card-body">
          <div className="setting-item">
            <div>
              <span className="setting-title">Reset Password</span>
              <p className="setting-desc">We will send a password reset email to {user?.email}</p>
            </div>
            <button
              onClick={handlePasswordReset}
              className="btn btn-secondary"
              disabled={loadingReset}
            >
              {loadingReset ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </div>
      </div>

      {/* Session Card */}
      <div className="settings-card">
        <div className="card-header">
          <LogOut className="header-icon" size={20} />
          <div>
            <h3>Session Management</h3>
            <p>Sign out of your active session on this device</p>
          </div>
        </div>

        <div className="card-body">
          <div className="setting-item">
            <div>
              <span className="setting-title">Sign Out</span>
              <p className="setting-desc">End your active session securely</p>
            </div>
            <button onClick={handleLogout} className="btn btn-ghost">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="settings-card border-danger">
        <div className="card-header header-danger">
          <Trash2 className="header-icon" size={20} />
          <div>
            <h3>Danger Zone</h3>
            <p>Irreversible actions for your workspace account</p>
          </div>
        </div>

        <div className="card-body">
          <div className="setting-item">
            <div>
              <span className="setting-title text-danger">Delete Account & Data</span>
              <p className="setting-desc">
                Permanently delete your profile, tasks, and authentication account from Cloud Firestore and Firebase.
              </p>
            </div>
            <button
              onClick={() => {
                setConfirmEmail('');
                setDeleteModalOpen(true);
              }}
              className="btn btn-danger"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {deleteModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-warning-header">
              <AlertTriangle size={32} className="warning-icon" />
              <h3>Confirm Account Deletion</h3>
            </div>
            <p>
              This action is <strong>PERMANENT</strong>. All of your personal tasks, profile metadata, and Firebase authentication credentials will be erased immediately.
            </p>
            <p className="margin-v text-sm">
              Please type your email <strong>{user?.email}</strong> to confirm:
            </p>

            <form onSubmit={handleDeleteAccount}>
              <input
                type="email"
                required
                placeholder={user?.email || 'Enter your email'}
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className="input-field margin-b"
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={
                    deletingAccount ||
                    confirmEmail.trim().toLowerCase() !== (user?.email || '').toLowerCase()
                  }
                >
                  {deletingAccount ? 'Deleting Account...' : 'Permanently Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
