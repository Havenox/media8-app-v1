import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserLoginRequest } from '@/types/api';
import { setStoredToken, setStoredUser, removeStoredToken, getStoredToken, getStoredUser } from '@/lib/api';
import { userService } from '@/services/userService';

interface SignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: UserLoginRequest) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getStoredToken();
      const storedUser = getStoredUser();
      
      if (token && storedUser) {
        // Verify user still exists in system
        try {
          const existingUser = await userService.getById(storedUser.id);
          if (existingUser) {
            setUser(existingUser);
          } else {
            // User no longer exists, clear auth
            removeStoredToken();
          }
        } catch {
          // API error, keep stored user if token exists
          setUser(storedUser);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials: UserLoginRequest): Promise<void> => {
    try {
      const { token, user } = await userService.login(credentials.email, credentials.password);
      
      setStoredToken(token);
      setStoredUser(user);
      setUser(user);
    } catch (error) {
      console.error('Login failed', error);
      throw new Error('E-mail ou senha inválidos');
    }
  };

  const signup = async (data: SignupData): Promise<void> => {
    // Create new user using userService (calls API)
    await userService.create({
      name: data.name,
      email: data.email,
      role: 'Client',
      password: data.password,
      phone: data.phone,
    });
    
    // After creation, perform login to get the valid JWT
    const { token, user } = await userService.login(data.email, data.password);
    setStoredToken(token);
    setStoredUser(user);
    setUser(user);
  };

  const logout = (): void => {
    removeStoredToken();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
