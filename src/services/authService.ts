/**
 * Tuned Podcast Player - Firebase Auth Service
 *
 * Wraps @react-native-firebase/auth with typed responses, consistent error
 * handling, and helpers for token retrieval (to authenticate with the Azure backend).
 */

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import type { User } from '../types/user';

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

export interface AuthResult<T = void> {
  success: boolean;
  data?: T;
  error?: AuthError;
}

export interface AuthError {
  code: string;
  message: string;
}

/**
 * Normalise Firebase error objects into a consistent `AuthError` shape.
 */
function toAuthError(err: unknown): AuthError {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const fbErr = err as { code: string; message?: string };
    return {
      code: fbErr.code,
      message: friendlyMessage(fbErr.code) ?? fbErr.message ?? 'Unknown error',
    };
  }
  if (err instanceof Error) {
    return { code: 'unknown', message: err.message };
  }
  return { code: 'unknown', message: 'An unexpected error occurred.' };
}

/**
 * Map Firebase error codes to user-friendly messages.
 */
function friendlyMessage(code: string): string | null {
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/requires-recent-login': 'Please sign in again to continue.',
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
  };
  return map[code] ?? null;
}

// ---------------------------------------------------------------------------
// Firebase User -> Tuned User Mapper
// ---------------------------------------------------------------------------

function mapFirebaseUser(fbUser: FirebaseAuthTypes.User): User {
  return {
    id: fbUser.uid,
    email: fbUser.email ?? '',
    displayName: fbUser.displayName ?? '',
    avatarUrl: fbUser.photoURL ?? null,
    tier: 'free', // tier is determined server-side; default to free locally
    createdAt: fbUser.metadata.creationTime ?? new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Auth Methods
// ---------------------------------------------------------------------------

/**
 * Sign in with email and password.
 */
async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult<User>> {
  try {
    const credential = await auth().signInWithEmailAndPassword(email, password);
    return {
      success: true,
      data: mapFirebaseUser(credential.user),
    };
  } catch (err) {
    return { success: false, error: toAuthError(err) };
  }
}

/**
 * Create a new account with email, password, and display name.
 */
async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthResult<User>> {
  try {
    const credential = await auth().createUserWithEmailAndPassword(
      email,
      password,
    );

    // Set the display name immediately after creation.
    await credential.user.updateProfile({ displayName });
    // Reload to pick up the updated profile.
    await credential.user.reload();

    const updatedUser = auth().currentUser;
    return {
      success: true,
      data: mapFirebaseUser(updatedUser ?? credential.user),
    };
  } catch (err) {
    return { success: false, error: toAuthError(err) };
  }
}

/**
 * Sign out the current user.
 */
async function signOut(): Promise<AuthResult> {
  try {
    await auth().signOut();
    return { success: true };
  } catch (err) {
    return { success: false, error: toAuthError(err) };
  }
}

/**
 * Return the currently authenticated user (or null).
 */
function getCurrentUser(): User | null {
  const fbUser = auth().currentUser;
  return fbUser ? mapFirebaseUser(fbUser) : null;
}

/**
 * Subscribe to authentication state changes.
 * Returns an unsubscribe function.
 */
function onAuthStateChanged(
  callback: (user: User | null) => void,
): () => void {
  return auth().onAuthStateChanged((fbUser) => {
    callback(fbUser ? mapFirebaseUser(fbUser) : null);
  });
}

/**
 * Send a password-reset email.
 */
async function resetPassword(email: string): Promise<AuthResult> {
  try {
    await auth().sendPasswordResetEmail(email);
    return { success: true };
  } catch (err) {
    return { success: false, error: toAuthError(err) };
  }
}

/**
 * Update the current user's profile.
 */
async function updateProfile(
  displayName?: string,
  photoURL?: string,
): Promise<AuthResult<User>> {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      return {
        success: false,
        error: { code: 'auth/no-user', message: 'No user is signed in.' },
      };
    }

    const updates: { displayName?: string; photoURL?: string } = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (photoURL !== undefined) updates.photoURL = photoURL;

    await currentUser.updateProfile(updates);
    await currentUser.reload();

    const refreshedUser = auth().currentUser;
    return {
      success: true,
      data: mapFirebaseUser(refreshedUser ?? currentUser),
    };
  } catch (err) {
    return { success: false, error: toAuthError(err) };
  }
}

/**
 * Retrieve the Firebase ID token for authenticating with the Azure backend.
 * Forces a refresh if the token is expired.
 */
async function getIdToken(forceRefresh = false): Promise<AuthResult<string>> {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      return {
        success: false,
        error: { code: 'auth/no-user', message: 'No user is signed in.' },
      };
    }

    const token = await currentUser.getIdToken(forceRefresh);
    return { success: true, data: token };
  } catch (err) {
    return { success: false, error: toAuthError(err) };
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const authService = {
  signInWithEmail,
  signUpWithEmail,
  signOut,
  getCurrentUser,
  onAuthStateChanged,
  resetPassword,
  updateProfile,
  getIdToken,
};

export default authService;
