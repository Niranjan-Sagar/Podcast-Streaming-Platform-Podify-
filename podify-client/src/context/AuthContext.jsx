import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [authLoading, setAuthLoading] = useState(true); // NEW: Tells the app we are checking login status

  // NEW: Check login status when the app first loads or refreshes
  useEffect(() => {
    const verifyUser = async () => {
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          // Token is invalid/expired
          localStorage.removeItem('token');
          setToken(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setAuthLoading(false);
      }
    };

    verifyUser();
  }, [token]);
  const login = async (email, password) => {
    console.log("1. Attempting login with:", email, password); // Check what is being sent

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      console.log("2. Server Response Status:", res.status, res.ok); // Is it a 401 or a 200?

      const data = await res.json();
      console.log("3. Server Data:", data); // What data did it actually send back?
      
      if (!res.ok) {
        console.log("4. BLOCKING: Login Rejected by Server!");
        return { success: false, error: data.message || 'Invalid credentials' };
      }
      
      console.log("5. ALLOWING: Login Approved!");
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      return { success: true };
    } catch (error) {
      console.error("Fetch Error:", error);
      return { success: false, error: 'Network error: Could not reach the server' };
    }
  };

  const signup = async (name, email, password, role, country, ageGroup) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role, country, ageGroup }),
    });
      
      const data = await res.json();
      
      // STRICT CHECK
      if (!res.ok) {
        return { success: false, error: data.message || 'Signup failed' };
      }
      
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error: Could not reach the server' };
    }
  };

  const googleLogin = async (credential, role = 'listener') => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Google login failed');
      
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const updateUser = (updatedFields) => {
    setUser(prev => ({ ...prev, ...updatedFields }));
  };

  return (
    <AuthContext.Provider value={{ user, token, authLoading, login, signup, googleLogin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);