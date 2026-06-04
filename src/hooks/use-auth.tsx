"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { firebaseConfig } from "@/lib/firebase/config";
import { authenticateMockUser } from "@/app/actions/auth";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: "admin" | "company";
  companyId: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isMock: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Check if we are running in mock mode
const isMockMode = firebaseConfig.apiKey === "mock-api-key";

// Mock user store in LocalStorage for testing without Firebase setup
const MOCK_ADMIN: UserProfile = {
  uid: "mock-admin-uid",
  email: "admin@mawork.jp",
  displayName: "MA WORK JP 管理者",
  role: "admin",
  companyId: null,
};

const MOCK_COMPANY: UserProfile = {
  uid: "mock-company-uid",
  email: "company@abc.com",
  displayName: "ABC商事 担当者",
  role: "company",
  companyId: "mock-company-id-abc",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMockMode) {
      const stored = typeof window !== "undefined" ? sessionStorage.getItem("mock_user") : null;
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
      return;
    }

    // Real Firebase Auth Listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Fetch additional profile data from Firestore
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: userDoc.data().displayName || "ユーザー",
              role: userDoc.data().role || "company",
              companyId: userDoc.data().companyId || null,
            });
          } else {
            // Profile document doesn't exist, create default company user
            const defaultProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "ユーザー",
              role: "company",
              companyId: null,
            };
            await setDoc(userDocRef, {
              email: defaultProfile.email,
              displayName: defaultProfile.displayName,
              role: defaultProfile.role,
              companyId: defaultProfile.companyId,
              createdAt: new Date(),
            });
            setUser(defaultProfile);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (isMockMode) {
        const res = await authenticateMockUser(email, password);
        if (res.success && res.user) {
          setUser(res.user);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("mock_user", JSON.stringify(res.user));
          }
        } else {
          throw new Error(res.error || "ログインIDまたはパスワードが正しくありません。");
        }
        return;
      }

      // Real Firebase Sign-In
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (isMockMode) {
        // Mock Sign-Out
        setUser(null);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("mock_user");
        }
        return;
      }

      // Real Firebase Sign-Out
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, isMock: isMockMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
