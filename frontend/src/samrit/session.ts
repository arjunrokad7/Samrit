import { createContext, useContext } from "react";
import type { SessionUser } from "./api";
export const AuthContext = createContext<{
  user: SessionUser | null;
  loading: boolean;
  signIn: (user: SessionUser, token: string) => void;
  signOut: () => void;
}>({ user: null, loading: true, signIn: () => {}, signOut: () => {} });
export const useSession = () => useContext(AuthContext);
