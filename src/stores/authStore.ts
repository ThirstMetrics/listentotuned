/**
 * Tuned Podcast Player - Auth Store
 *
 * Manages authentication state: current user, sign-in / sign-up / sign-out
 * flows, and profile updates. Wired to Firebase Auth via authService.
 *
 * The user object is persisted to MMKV so the app can display the correct
 * state immediately on launch before any network request completes.
 * The Firebase onAuthStateChanged listener (started in App.tsx) keeps the
 * store in sync with the actual Firebase session.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { User } from '../types/user';
import { mmkvStorage } from './mmkvStorage';
import authService from '../services/authService';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

interface AuthActions {
  /** Authenticate an existing user with email + password. */
  signIn: (email: string, password: string) => Promise<void>;
  /** Create a new account with email, password, and display name. */
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  /** Sign the current user out and clear persisted data. */
  signOut: () => void;
  /** Update mutable profile fields (displayName, avatarUrl, etc.). */
  updateProfile: (updates: Partial<Pick<User, 'displayName' | 'avatarUrl'>>) => Promise<void>;
  /** Directly set the user (e.g. from onAuthStateChanged or token refresh). */
  setUser: (user: User | null) => void;
  /** Send a password-reset email. */
  resetPassword: (email: string) => Promise<void>;
  /** Clear any error state. */
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // -- Authentication -----------------------------------------------------

      signIn: async (email, password) => {
        set({ isLoading: true, error: null });
        const result = await authService.signInWithEmail(email, password);
        if (result.success && result.data) {
          set({
            user: result.data,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({
            isLoading: false,
            error: result.error?.message ?? 'Sign-in failed',
          });
        }
      },

      signUp: async (email, password, displayName) => {
        set({ isLoading: true, error: null });
        const result = await authService.signUpWithEmail(
          email,
          password,
          displayName,
        );
        if (result.success && result.data) {
          set({
            user: result.data,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({
            isLoading: false,
            error: result.error?.message ?? 'Sign-up failed',
          });
        }
      },

      signOut: async () => {
        await authService.signOut();
        set(initialState);
      },

      updateProfile: async (updates) => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true, error: null });
        const result = await authService.updateProfile(
          updates.displayName,
          updates.avatarUrl ?? undefined,
        );
        if (result.success && result.data) {
          set({ user: result.data, isLoading: false });
        } else {
          set({
            isLoading: false,
            error: result.error?.message ?? 'Profile update failed',
          });
        }
      },

      setUser: (user) =>
        set({
          user,
          isAuthenticated: user !== null,
          error: null,
        }),

      resetPassword: async (email) => {
        set({ isLoading: true, error: null });
        const result = await authService.resetPassword(email);
        if (result.success) {
          set({ isLoading: false });
        } else {
          set({
            isLoading: false,
            error: result.error?.message ?? 'Password reset failed',
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'tuned-auth-store',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
