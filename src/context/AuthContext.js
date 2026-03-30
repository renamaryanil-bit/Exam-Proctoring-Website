import { createContext, useContext, useState, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Restore session from localStorage on page reload
    try {
      const stored = localStorage.getItem('proctorosUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (username, password, role) => {
    const data = await authAPI.login(username, password, role);
    // data = { _id, username, name, role, token }
    const u = {
      id:       data._id,
      username: data.username,
      name:     data.name,
      role:     data.role,
      token:    data.token,
      // Derived fields used by existing UI components
      initials: (data.name || data.username)
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      email: `${data.username}@proctoios.edu`, // friendly display value
    };
    localStorage.setItem('proctorosToken', data.token);
    localStorage.setItem('proctorosUser',  JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('proctorosToken');
    localStorage.removeItem('proctorosUser');
    setUser(null);
  }, []);

  const updateUserName = useCallback((name) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        name,
        initials: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      };
      localStorage.setItem('proctorosUser', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserName, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
