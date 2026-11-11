import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthContextValue = { session: Session | null; user: User | null; loading: boolean; signIn: (email: string, password: string) => Promise<string | null>; signOut: () => Promise<void> }
const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setLoading(false) })
    return () => data.subscription.unsubscribe()
  }, [])
  const value = useMemo<AuthContextValue>(() => ({
    session, user: session?.user ?? null, loading,
    signIn: async (email, password) => { const { error } = await supabase.auth.signInWithPassword({ email, password }); return error?.message ?? null },
    signOut: async () => { await supabase.auth.signOut() },
  }), [session, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}
