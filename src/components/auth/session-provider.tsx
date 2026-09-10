"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  getSession,
  onAuthStateChange,
  signOut as requestSignOut,
} from "@/lib/supabase/client";
import {
  initialSessionState,
  sessionReducer,
  toAuthUser,
  type AuthStatus,
  type AuthUser,
} from "@/lib/auth/session";

export interface SessionContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);

  useEffect(() => {
    let active = true;

    void getSession().then(({ data }) => {
      if (!active) return;
      dispatch({
        type: "setSession",
        user: data.session?.user ? toAuthUser(data.session.user) : null,
      });
    });

    const {
      data: { subscription },
    } = onAuthStateChange((_event, session) => {
      if (!active) return;
      dispatch({
        type: "setSession",
        user: session?.user ? toAuthUser(session.user) : null,
      });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await requestSignOut();
    } finally {
      dispatch({ type: "signOut" });
    }
  }, []);

  const value = useMemo(
    () => ({ status: state.status, user: state.user, signOut }),
    [state.status, state.user, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}