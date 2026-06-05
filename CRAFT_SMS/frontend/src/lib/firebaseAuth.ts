import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  UserCredential
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Sign in a user with email and password
 */
export const signIn = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    console.error('Firebase Auth sign in error:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Firebase Auth sign out error:', error);
    throw error;
  }
};

/**
 * Request a password reset email
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Firebase Auth reset password error:', error);
    throw error;
  }
};

/**
 * Get the current JWT token for the authenticated user
 */
export const getCurrentToken = async (): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  } catch (error) {
    console.error('Firebase Auth token retrieval error:', error);
    return null;
  }
};
