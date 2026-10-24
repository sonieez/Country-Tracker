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
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSession() {
      const result = await supabase.auth.getSession();
      setSession(result.data.session);
      setLoading(false);
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
      return;
    }

    async function loadUser() {
      try{
        const user = await api('/me');        
        setUser(user);
      } catch(error) {
        console.error(error);
      }
    }
    loadUser();
  }, [userId])

  return (
    <AuthContext.Provider value={{ session, user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}