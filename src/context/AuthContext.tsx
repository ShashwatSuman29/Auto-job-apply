import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  title?: string;
  skills?: string[];
  profilePhoto?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, title?: string, skills?: string[]) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<string | null>;
  error: string | null;
  updateProfilePhoto: (photoUrl: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const API_URL = 'http://localhost:5000/api';

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in on initial load
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await axios.get(`${API_URL}/auth/me`, {
            headers: {
              'x-auth-token': token
            }
          });
          setUser(res.data);
        } catch (err) {
          console.error('Error loading user:', err);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, [token]);

  // Register user
  const register = async (name: string, email: string, password: string, title?: string, skills?: string[]) => {
    try {
      setError(null);
      const res = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
        title,
        skills
      });

      // Save token to local storage
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
      throw new Error(err.response?.data?.error || 'Registration failed');
    }
  };

  // Login user
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      // Save token to local storage
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
      throw new Error(err.response?.data?.error || 'Login failed');
    }
  };

  // Refresh token - can be called when token validation fails
  const refreshToken = async (): Promise<string | null> => {
    if (!token) return null;
    
    try {
      // For now, we'll just validate the existing token
      // In a real app, you might want to implement a proper token refresh mechanism
      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          'x-auth-token': token
        }
      });
      
      if (res.status === 200) {
        return token;
      }
      return null;
    } catch (err) {
      console.error('Token refresh failed:', err);
      logout();
      return null;
    }
  };

  // Update profile photo
  const updateProfilePhoto = async (photoUrl: string) => {
    if (!token || !user) throw new Error('Not authenticated');
    
    try {
      const res = await axios.put(
        `${API_URL}/auth/profile-photo`,
        { photoUrl },
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
      
      setUser({ ...user, profilePhoto: photoUrl });
    } catch (err: any) {
      console.error('Error updating profile photo:', err);
      setError(err.response?.data?.error || 'Failed to update profile photo');
      throw new Error(err.response?.data?.error || 'Failed to update profile photo');
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshToken,
        error,
        updateProfilePhoto
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
