export interface AuthUser {
  id: string;
  email?: string;
}

export type AuthStatus = "loading" | "signedIn" | "signedOut";

export interface SessionState {
  status: AuthStatus;
  user: AuthUser | null;
}

export type SessionAction =
  | { type: "setLoading" }
  | { type: "setSession"; user: AuthUser | null }
  | { type: "signOut" };

export const initialSessionState: SessionState = {
  status: "loading",
  user: null,
};

export function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case "setLoading":
      return initialSessionState;
    case "setSession":
      return action.user
        ? { status: "signedIn", user: action.user }
        : { status: "signedOut", user: null };
    case "signOut":
      return { status: "signedOut", user: null };
    default:
      return state;
  }
}

export function toAuthUser(user: {
  id: string;
  email?: string | null;
}): AuthUser {
  return {
    id: user.id,
    ...(user.email ? { email: user.email } : {}),
  };
}