import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { usersService } from '../services/usersService';
import type { UserProfile } from '../types/rentkaro';
import { useToast } from './ToastContext';

interface AuthContextValue {
  user: UserProfile | null;
  allUsers: UserProfile[];
  loading: boolean;
  signInOpen: boolean;
  openSignIn: (redirectPath?: string) => void;
  closeSignIn: () => void;
  signInWithPreset: (userId: string) => Promise<void>;
  signInCustom: (input: {
    name: string;
    email: string;
    college: string;
    phone: string;
  }) => Promise<void>;
  updateProfile: (
    patch: Partial<Pick<UserProfile, 'name' | 'college' | 'phone' | 'photoUrl'>>,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [signInOpen, setSignInOpen] = useState(false);
  const [redirectAfter, setRedirectAfter] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const refreshUsers = useCallback(async () => {
    const [current, list] = await Promise.all([
      usersService.getCurrentUser(),
      usersService.listUsers(),
    ]);
    setUser(current);
    setAllUsers(list);
  }, []);

  useEffect(() => {
    refreshUsers().finally(() => setLoading(false));
  }, [refreshUsers]);

  const openSignIn = useCallback((redirectPath?: string) => {
    setRedirectAfter(redirectPath ?? null);
    setSignInOpen(true);
  }, []);

  const closeSignIn = useCallback(() => {
    setSignInOpen(false);
    setRedirectAfter(null);
  }, []);

  const finishAuth = useCallback(
    (signedInUser: UserProfile) => {
      setUser(signedInUser);
      setSignInOpen(false);
      showToast(`Signed in as ${signedInUser.name}`, 'success');
      if (redirectAfter) {
        const next = redirectAfter;
        setRedirectAfter(null);
        navigate(next);
      }
    },
    [navigate, redirectAfter, showToast],
  );

  const signInWithPreset = useCallback(
    async (userId: string) => {
      const signed = await usersService.signInWithGooglePreset(userId);
      await refreshUsers();
      finishAuth(signed);
    },
    [finishAuth, refreshUsers],
  );

  const signInCustom = useCallback(
    async (input: { name: string; email: string; college: string; phone: string }) => {
      const signed = await usersService.signInWithGoogleCustom(input);
      await refreshUsers();
      finishAuth(signed);
    },
    [finishAuth, refreshUsers],
  );

  const updateProfile = useCallback(
    async (patch: Partial<Pick<UserProfile, 'name' | 'college' | 'phone' | 'photoUrl'>>) => {
      if (!user) throw new Error('Sign in required.');
      const updated = await usersService.updateProfile(user.id, patch);
      setUser(updated);
      await refreshUsers();
      showToast('Profile updated', 'success');
    },
    [refreshUsers, showToast, user],
  );

  const signOut = useCallback(async () => {
    await usersService.signOut();
    setUser(null);
    showToast('Signed out', 'info');
  }, [showToast]);

  return (
    <AuthContext.Provider
      value={{
        user,
        allUsers,
        loading,
        signInOpen,
        openSignIn,
        closeSignIn,
        signInWithPreset,
        signInCustom,
        updateProfile,
        signOut,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
