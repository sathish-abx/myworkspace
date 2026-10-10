import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, type UserProfile } from '../lib/api';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Briefcase, 
  MapPin, 
  FileText, 
  Calendar, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Edit2
} from 'lucide-react';

export const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await api.getProfile();
      setProfile(data);
      setFullName(data.fullName || user?.displayName || '');
      setPhone(data.phone || '');
      setJobTitle(data.jobTitle || '');
      setLocation(data.location || '');
      setBio(data.bio || '');
    } catch (err: any) {
      console.error('Fetch profile error:', err);
      setErrorMessage(err.message || 'Failed to load user profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    try {
      setSaving(true);
      const updated = await api.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        jobTitle: jobTitle.trim(),
        location: location.trim(),
        bio: bio.trim(),
      });

      setProfile(updated);
      setEditing(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Save profile error:', err);
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setFullName(profile.fullName || user?.displayName || '');
      setPhone(profile.phone || '');
      setJobTitle(profile.jobTitle || '');
      setLocation(profile.location || '');
      setBio(profile.bio || '');
    }
    setEditing(false);
    setErrorMessage(null);
  };

  if (loading) {
    return (
      <div className="page-loader">
        <Loader2 className="spinner icon-lg" />
        <p>Loading profile information...</p>
      </div>
    );
  }

  const creationDateDisplay = profile?.createdAt 
    ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Recently';

  return (
    <div className="profile-container">
      <div className="page-header">
        <div>
          <h1>User Profile</h1>
          <p className="subtitle">View and update your profile information</p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="btn btn-secondary">
            <Edit2 size={16} /> Edit Profile
          </button>
        )}
      </div>

      {successMessage && (
        <div className="alert alert-success margin-b">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-error margin-b">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="profile-card">
        <div className="profile-header-banner">
          <div className="profile-avatar">
            {(fullName || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="profile-header-info">
            <h2>{fullName || 'Workspace User'}</h2>
            <p className="job-title">{jobTitle || 'No job title specified'}</p>
            <div className="email-badge-row">
              <span className="email-text"><Mail size={14} /> {user?.email}</span>
              <span className="badge badge-success"><ShieldCheck size={12} /> Verified</span>
            </div>
          </div>
        </div>

        {editing ? (
          /* Edit Form */
          <form onSubmit={handleSaveProfile} className="profile-edit-form">
            <div className="form-group margin-v">
              <label>Full Name *</label>
              <div className="input-wrapper">
                <UserIcon className="input-icon" size={18} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="form-group margin-v">
              <label>Email Address (Read-only)</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="input-field disabled"
                />
              </div>
              <small className="help-text">Email address is bound to your verified authentication account.</small>
            </div>

            <div className="grid-2 margin-v">
              <div className="form-group">
                <label>Phone Number</label>
                <div className="input-wrapper">
                  <Phone className="input-icon" size={18} />
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Job Title</label>
                <div className="input-wrapper">
                  <Briefcase className="input-icon" size={18} />
                  <input
                    type="text"
                    placeholder="e.g. Senior Software Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="form-group margin-v">
              <label>Location</label>
              <div className="input-wrapper">
                <MapPin className="input-icon" size={18} />
                <input
                  type="text"
                  placeholder="e.g. San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="form-group margin-v">
              <label>Bio</label>
              <div className="input-wrapper">
                <FileText className="input-icon-top" size={18} />
                <textarea
                  rows={4}
                  placeholder="Tell us a little about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="input-field input-textarea"
                />
              </div>
            </div>

            <div className="form-actions margin-t-lg">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          /* Profile Details View */
          <div className="profile-details-grid">
            <div className="detail-item">
              <span className="detail-label"><UserIcon size={16} /> Full Name</span>
              <span className="detail-value">{profile?.fullName || 'Not provided'}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label"><Mail size={16} /> Verified Email</span>
              <span className="detail-value">{profile?.email || user?.email}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label"><Phone size={16} /> Phone Number</span>
              <span className="detail-value">{profile?.phone || 'Not provided'}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label"><Briefcase size={16} /> Job Title</span>
              <span className="detail-value">{profile?.jobTitle || 'Not provided'}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label"><MapPin size={16} /> Location</span>
              <span className="detail-value">{profile?.location || 'Not provided'}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label"><Calendar size={16} /> Member Since</span>
              <span className="detail-value">{creationDateDisplay}</span>
            </div>

            <div className="detail-item full-width">
              <span className="detail-label"><FileText size={16} /> Bio</span>
              <p className="bio-text">{profile?.bio || 'No bio written yet.'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
