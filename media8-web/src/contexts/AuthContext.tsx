import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserLoginRequest } from '@/types/api';
import { setStoredToken, setStoredUser, removeStoredToken, getStoredToken, getStoredUser } from '@/lib/api';
import { userService } from '@/services/userService';

interface SignupData {
  Name: string;
  Email: string;
  Phone: string;
  Password: string;
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
          // User is already in PascalCase from storage
          const existingUser = await userService.getById(storedUser.Id);
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
      // Backend returns PascalCase: Token, User
      const response = await userService.login(credentials.Email, credentials.Password);
      const token = response.Token;
      const user = response.User;

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
      Name: data.Name,
      Email: data.Email,
      Role: 'Client' as any,
      Password: data.Password,
      Phone: data.Phone,
    });

    // After creation, perform login to get the valid JWT
    const response = await userService.login(data.Email, data.Password);
    const token = response.Token;
    const user = response.User;
    
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
