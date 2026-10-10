import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth, onAuthStateChanged, signOut, type User } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  emailVerified: boolean;
  refreshUserStatus: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  emailVerified: false,
  refreshUserStatus: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  const checkUserStatus = async (currentUser: User | null) => {
    if (currentUser) {
      // Reload user to fetch updated emailVerified status from Firebase
      try {
        await currentUser.reload();
      } catch (err) {
        console.warn('Failed to reload current user:', err);
      }
      setUser(auth.currentUser);
      setEmailVerified(auth.currentUser?.emailVerified ?? false);
    } else {
      setUser(null);
      setEmailVerified(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      await checkUserStatus(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUserStatus = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser(auth.currentUser);
      setEmailVerified(auth.currentUser.emailVerified);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setEmailVerified(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, emailVerified, refreshUserStatus, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
