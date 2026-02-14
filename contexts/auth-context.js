"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Amplify } from 'aws-amplify';
import { Hub } from 'aws-amplify/utils';
import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  confirmSignUp,
  resendSignUpCode,
  fetchUserAttributes,
} from 'aws-amplify/auth';
import { cognitoConfig, isCognitoConfigured } from '@/lib/cognito-config';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(null);

  // Helper function to clear authentication cookies
  const clearAuthCookies = useCallback(() => {
    if (typeof window !== 'undefined') {
      console.log('[clearAuthCookies] Clearing authentication cookies');
      document.cookie = 'cognito-user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      document.cookie = 'cognito-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    }
  }, []);

  // Check user session - wrapped in useCallback to avoid dependency issues
  const checkUser = useCallback(async () => {
    console.log('[checkUser] Starting auth check...');
    
    try {
      // Fetch current session with retry logic
      let session = await fetchAuthSession({ forceRefresh: false });
      
      // If no tokens, retry with force refresh after a short delay
      if (!session.tokens?.idToken) {
        console.log('[checkUser] No tokens on first attempt, retrying with force refresh...');
        await new Promise(resolve => setTimeout(resolve, 500));
        session = await fetchAuthSession({ forceRefresh: true });
      }
      
      // If still no tokens, user is not authenticated
      if (!session.tokens?.idToken) {
        console.log('[checkUser] No tokens found, user not authenticated');
        setUser(null);
        clearAuthCookies();
        setLoading(false);
        return;
      }
      
      // Get current user and attributes
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      
      if (currentUser && attributes.email) {
        const userData = {
          uid: currentUser.userId,
          email: attributes.email,
          displayName: attributes.name || attributes.email?.split('@')[0],
          photoURL: attributes.picture || null,
        };
        
        console.log('[checkUser] User authenticated:', userData.email);
        setUser(userData);
        
        // Set cookies for server-side access
        if (typeof window !== 'undefined') {
          const cookieOptions = `path=/; max-age=${60 * 60 * 24}; SameSite=Lax${
            window.location.protocol === 'https:' ? '; Secure' : ''
          }`;
          document.cookie = `cognito-user=${encodeURIComponent(JSON.stringify(userData))}; ${cookieOptions}`;
          
          // Get token for server-side verification if needed
          const session = await fetchAuthSession();
          if (session.tokens?.idToken) {
            const idToken = session.tokens.idToken.toString();
            document.cookie = `cognito-token=${encodeURIComponent(idToken)}; ${cookieOptions}`;
          }
        }
        
        // Sync with database
        try {
          await fetch('/api/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cognitoUser: userData }),
          });
        } catch (dbError) {
          console.error('[checkUser] Database sync error:', dbError);
        }
      } else {
        console.log('[checkUser] No current user found');
        setUser(null);
        clearAuthCookies();
      }
    } catch (error) {
      console.error('[checkUser] Error:', error);
      
      // Handle expected auth errors
      if (error.name === 'UserUnAuthenticatedException' || 
          error.name === 'NotAuthorizedException' ||
          error.name === 'UserNotFoundException') {
        setUser(null);
        clearAuthCookies();
      } else {
        console.error('[checkUser] Unexpected error:', error);
        setUser(null);
        clearAuthCookies();
      }
    } finally {
      setLoading(false);
      console.log('[checkUser] Auth check complete');
    }
  }, [clearAuthCookies]);

  useEffect(() => {
    // Only configure Amplify if Cognito is properly set up
    if (!isCognitoConfigured()) {
      console.error('[AuthProvider] AWS Cognito is not configured.');
      setConfigError('AWS Cognito is not configured.');
      setLoading(false);
      return;
    }

    try {
      Amplify.configure(cognitoConfig);
      console.log('[AuthProvider] Amplify configured with Client ID:', process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID);
      
      // Initial auth check
      checkUser();
      
      // Set up Hub listener for auth events
      const hubListener = Hub.listen('auth', ({ payload }) => {
        console.log('[Hub] Auth event:', payload.event);
        
        switch (payload.event) {
          case 'signedIn':
            console.log('[Hub] User signed in, checking session...');
            // Re-check user after sign-in event
            checkUser();
            break;
            
          case 'signedOut':
            console.log('[Hub] User signed out');
            setUser(null);
            clearAuthCookies();
            setLoading(false);
            break;
            
          case 'tokenRefresh':
            console.log('[Hub] Token refreshed');
            break;
            
          case 'tokenRefresh_failure':
            console.log('[Hub] Token refresh failed, user may be logged out');
            setUser(null);
            clearAuthCookies();
            break;
            
          default:
            console.log('[Hub] Unhandled auth event:', payload.event);
        }
      });
      
      // Cleanup Hub listener on unmount
      return () => {
        console.log('[AuthProvider] Cleaning up Hub listener');
        hubListener();
      };
    } catch (error) {
      console.error('[AuthProvider] Amplify configuration error:', error);
      setConfigError('Failed to configure AWS Cognito.');
      setLoading(false);
    }
  }, [checkUser, clearAuthCookies]);

  const signInWithEmail = async (email, password) => {
    if (!isCognitoConfigured()) {
      throw new Error('AWS Cognito is not configured.');
    }
    
    try {
      console.log('[signInWithEmail] Attempting sign-in for:', email);
      
      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password,
      });

      if (isSignedIn) {
        console.log('[signInWithEmail] Sign-in successful');
        // Note: Hub will fire 'signedIn' event which will trigger checkUser()
        // But we'll also manually check to ensure immediate state update
        await checkUser();
        return { success: true };
      }

      return { success: false, nextStep };
    } catch (error) {
      console.error('[signInWithEmail] Error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email, password, name) => {
    if (!isCognitoConfigured()) {
      throw new Error('AWS Cognito is not configured.');
    }
    
    try {
      console.log('[signUpWithEmail] Creating account for:', email);
      
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name,
          },
        },
      });

      console.log('[signUpWithEmail] Sign-up complete:', isSignUpComplete);

      // If sign-up is complete (auto-confirmed), automatically sign the user in
      if (isSignUpComplete) {
        console.log('[signUpWithEmail] Auto sign-up confirmed, signing in...');
        try {
          await signInWithEmail(email, password);
        } catch (signInError) {
          console.error('[signUpWithEmail] Auto sign-in failed:', signInError);
          // Return sign-up result even if auto sign-in fails
        }
      }

      return {
        success: isSignUpComplete,
        userId,
        nextStep,
      };
    } catch (error) {
      console.error('[signUpWithEmail] Error:', error);
      throw error;
    }
  };

  const confirmSignUpCode = async (email, code) => {
    if (!isCognitoConfigured()) {
      throw new Error('AWS Cognito is not configured.');
    }
    
    try {
      console.log('[confirmSignUpCode] Confirming sign-up for:', email);
      await confirmSignUp({
        username: email,
        confirmationCode: code,
      });
      return { success: true };
    } catch (error) {
      console.error('[confirmSignUpCode] Error:', error);
      throw error;
    }
  };

  const resendConfirmationCode = async (email) => {
    if (!isCognitoConfigured()) {
      throw new Error('AWS Cognito is not configured.');
    }
    
    try {
      console.log('[resendConfirmationCode] Resending code to:', email);
      await resendSignUpCode({
        username: email,
      });
      return { success: true };
    } catch (error) {
      console.error('[resendConfirmationCode] Error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('[logout] Signing out user');
      await signOut();
      // Note: Hub will fire 'signedOut' event which will set user to null and clear cookies
      // But we'll also do it here to ensure immediate state update
      setUser(null);
      clearAuthCookies();
      window.location.href = '/';
    } catch (error) {
      console.error('[logout] Error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    configError,
    signInWithEmail,
    signUpWithEmail,
    confirmSignUpCode,
    resendConfirmationCode,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
