import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, isMockMode } from '../lib/firebase';

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isOfflineUser?: boolean;
}

interface AuthContextProps {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginOffline: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Persistence check for offline users or cached sessions
  useEffect(() => {
    const cachedUser = localStorage.getItem('cachedAuthUser');
    if (cachedUser) {
      setUser(JSON.parse(cachedUser));
      setLoading(false);
      return;
    }

    if (isMockMode || !auth) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Monitor Firebase Auth state change when online/real mode
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const u: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        };
        setUser(u);
        localStorage.setItem('cachedAuthUser', JSON.stringify(u));
      } else {
        setUser(null);
        localStorage.removeItem('cachedAuthUser');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (isMockMode || !auth) {
        // Mock Login
        if (email === 'demo@mawork.jp' && password === 'demo1234') {
          const u: AuthUser = {
            uid: 'demo-user-id',
            email: 'demo@mawork.jp',
            displayName: 'M-A Work Demo User',
            isOfflineUser: false
          };
          setUser(u);
          localStorage.setItem('cachedAuthUser', JSON.stringify(u));
        } else {
          throw new Error('Invalid credentials. In demo mode, use demo@mawork.jp / demo1234');
        }
      } else {
        // Firebase Login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        const u: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        };
        setUser(u);
        localStorage.setItem('cachedAuthUser', JSON.stringify(u));
      }
    } finally {
      setLoading(false);
    }
  };

  const loginOffline = () => {
    const u: AuthUser = {
      uid: 'offline-local-user',
      email: 'offline@mawork.jp',
      displayName: 'Offline Agent',
      isOfflineUser: true
    };
    setUser(u);
    localStorage.setItem('cachedAuthUser', JSON.stringify(u));
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (!isMockMode && auth) {
        await signOut(auth);
      }
    } finally {
      setUser(null);
      localStorage.removeItem('cachedAuthUser');
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, loginOffline, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
