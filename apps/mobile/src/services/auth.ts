import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { auth } from '../config/firebase';

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Signed in:', userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Sign in error:', error.code, error.message);
    
    // Provide user-friendly error messages
    let message = 'Failed to sign in';
    switch (error.code) {
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/invalid-credential':
        message = 'Invalid email or password';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later';
        break;
      default:
        message = error.message || 'Failed to sign in';
    }
    
    throw new Error(message);
  }
};

/**
 * Sign up with email, password, and display name
 */
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  displayName: string
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name
    await updateProfile(userCredential.user, { displayName });
    
    console.log('✅ Signed up:', userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Sign up error:', error.code, error.message);
    
    // Provide user-friendly error messages
    let message = 'Failed to create account';
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'An account with this email already exists';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/operation-not-allowed':
        message = 'Email/password accounts are not enabled';
        break;
      case 'auth/weak-password':
        message = 'Password is too weak. Use at least 6 characters';
        break;
      default:
        message = error.message || 'Failed to create account';
    }
    
    throw new Error(message);
  }
};

/**
 * Sign out current user
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    console.log('✅ Signed out');
  } catch (error: any) {
    console.error('❌ Sign out error:', error);
    throw new Error('Failed to sign out');
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Password reset email sent to:', email);
  } catch (error: any) {
    console.error('❌ Password reset error:', error);
    
    // Provide user-friendly error messages
    let message = 'Failed to send reset email';
    switch (error.code) {
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email';
        break;
      default:
        message = error.message || 'Failed to send reset email';
    }
    
    throw new Error(message);
  }
};

/**
 * Sign in with Google (placeholder for future implementation)
 */
export const signInWithGoogle = async () => {
  console.log('🔐 Google sign in');
  throw new Error('Google sign-in not yet implemented. Use email/password for now.');
};

/**
 * Get current user
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChange = (callback: (user: any) => void) => {
  return auth.onAuthStateChanged(callback);
};
