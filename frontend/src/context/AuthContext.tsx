import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

type AppUser = {
  id: string
  email: string
  username: string | null
  displayName: string | null
  profilePicture: string | null
}

type AuthContextValue = {
  session: Session | null
  user: AppUser | null
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  signInOpen: boolean
  openSignIn: () => void
  closeSignIn: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionChecked, setSessionChecked] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

  useEffect(() => {
    async function loadSession() {
      const result = await supabase.auth.getSession();
      setSession(result.data.session);
      setSessionChecked(true);
    }
    loadSession();

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      data.subscription.unsubscribe();
    }
  }, [])
  
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) {
      setUser(null);
      if (sessionChecked) {
        setLoading(false);
      }
      return;
    }

    async function loadUser() {
      try{
        const meData = await api('/me');        
        setUser(meData);
        
      } catch(error) {
        console.error(error);

      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [userId, sessionChecked])

  async function signIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });

    if (error) {
      console.error(error);
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  function openSignIn() {
    setSignInOpen(true);
  }

  function closeSignIn() {
    setSignInOpen(false);
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signOut, signInOpen, openSignIn, closeSignIn }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}