import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { signIn as fbSignIn, signUp as fbSignUp, signOut as fbSignOut, onAuthChange, getProfile, createProfile } from '../lib/firebase';

type Profile = {
  id: string;
  full_name: string;
  role: 'trainer' | 'client';
  trainer_id?: string | null;
  payment_status?: boolean;
};

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: 'trainer' | 'client', trainerId?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      setUser(u);
      if (u) {
        const p = await getProfile(u.uid);
        setProfile(p as Profile | null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function signIn(email: string, password: string) {
    await fbSignIn(email, password);
  }

  async function signUp(email: string, password: string, fullName: string, role: 'trainer' | 'client', trainerId?: string) {
    const result = await fbSignUp(email, password);
    const uid = result.user?.uid;
    if (!uid) throw new Error('No user returned');
    await createProfile(uid, {
      id: uid,
      full_name: fullName,
      role,
      trainer_id: trainerId || null,
      payment_status: role === 'trainer' ? true : false,
    });
  }

  async function signOut() {
    await fbSignOut();
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
