import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser } from '../../../shared/src/types';
import { authService } from '../services/auth.service';

interface AuthState {
  user: IUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: async (username, password) => {
        const response = await authService.login(username, password);
        localStorage.setItem('accessToken', response.accessToken);
        set({
          user: response.user,
          accessToken: response.accessToken,
          isAuthenticated: true,
        });
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // ignore errors — always clear local state
        }
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      setToken: (token) => {
        localStorage.setItem('accessToken', token);
        set({ accessToken: token });
      },
    }),
    {
      name: 'eps-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
