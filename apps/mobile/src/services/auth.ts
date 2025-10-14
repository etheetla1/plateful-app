// Temporarily stubbed auth service for testing UI
// TODO: Re-enable Firebase auth later

export const signInWithEmail = async (email: string, password: string) => {
  console.log('🔐 [STUB] Sign in attempt:', email);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  throw new Error('Auth is temporarily disabled for UI testing');
};

export const signUpWithEmail = async (email: string, password: string, displayName: string) => {
  console.log('🔐 [STUB] Sign up attempt:', email);
  await new Promise(resolve => setTimeout(resolve, 1000));
  throw new Error('Auth is temporarily disabled for UI testing');
};

export const signOut = async () => {
  console.log('🔐 [STUB] Sign out');
  await new Promise(resolve => setTimeout(resolve, 500));
};

export const resetPassword = async (email: string) => {
  console.log('🔐 [STUB] Password reset for:', email);
  await new Promise(resolve => setTimeout(resolve, 1000));
  throw new Error('Auth is temporarily disabled for UI testing');
};

export const signInWithGoogle = async () => {
  console.log('🔐 [STUB] Google sign in');
  await new Promise(resolve => setTimeout(resolve, 1000));
  throw new Error('Auth is temporarily disabled for UI testing');
};
