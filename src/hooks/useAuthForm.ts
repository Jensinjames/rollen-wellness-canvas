/**
 * Authentication Form State Management Hook
 */

import { useState } from 'react';

export interface AuthFormState {
  isLoading: boolean;
  error: string | null;
  message: string | null;
  passwordErrors: string[];
}

export const useAuthForm = () => {
  const [state, setState] = useState<AuthFormState>({
    isLoading: false,
    error: null,
    message: null,
    passwordErrors: []
  });

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  };


  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error, message: null }));
  };

  const setMessage = (message: string | null) => {
    setState(prev => ({ ...prev, message, error: null }));
  };

  const setPasswordErrors = (errors: string[]) => {
    setState(prev => ({ ...prev, passwordErrors: errors }));
  };

  const clearState = () => {
    setState({
      isLoading: false,
      error: null,
      message: null,
      passwordErrors: []
    });
  };

  const clearMessages = () => {
    setState(prev => ({ 
      ...prev, 
      error: null, 
      message: null, 
      passwordErrors: []
    }));
  };

  return {
    ...state,
    setLoading,
    
    setError,
    setMessage,
    setPasswordErrors,
    clearState,
    clearMessages
  };
};