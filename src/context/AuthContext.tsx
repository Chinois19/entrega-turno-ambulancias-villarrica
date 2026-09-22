import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser, UserRole } from '../types';
import { getUsuarios, updateUsuarioPassword } from '../firebase/firestoreService';
import { sha256Hash } from '../utils/authUtils';

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  login: (rutOEmail: string, contrasena: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_KEY = 'villarrica_active_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Restore session
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AppUser;
        setCurrentUser(parsed);
      } catch (e) {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (rutOEmail: string, contrasena: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const users = await getUsuarios();
      const cleanInput = rutOEmail.trim().toLowerCase();
      
      // Look up user by email or RUT
      const user = users.find(u => 
        u.email.toLowerCase() === cleanInput || 
        u.rut.replace(/[^0-9kK]/g, '').toLowerCase() === cleanInput.replace(/[^0-9kK]/g, '').toLowerCase()
      );

      if (!user) {
        return { success: false, error: "Usuario o RUT no encontrado en el sistema." };
      }

      if (!user.activo) {
        return { success: false, error: "Esta cuenta se encuentra inactiva. Contacte al encargado de calidad o transporte." };
      }

      // Hash input password with SHA-256
      const hash = await sha256Hash(contrasena);
      if (hash !== user.passwordHash) {
        return { success: false, error: "Contraseña incorrecta." };
      }

      // Successful login
      user.ultimoAcceso = new Date().toISOString();
      setCurrentUser(user);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Error al autenticar." };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: "No hay sesión activa." };
    if (newPassword.length < 6) {
      return { success: false, error: "La nueva contraseña debe tener al menos 6 caracteres." };
    }

    try {
      const newHash = await sha256Hash(newPassword);
      await updateUsuarioPassword(currentUser.id, newHash);
      
      const updatedUser: AppUser = {
        ...currentUser,
        passwordHash: newHash,
        isTemporaryPassword: false
      };
      
      setCurrentUser(updatedUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Error al actualizar contraseña." };
    }
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!currentUser) return false;
    if (currentUser.rol === 'admin') return true;
    return roles.includes(currentUser.rol);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout, changePassword, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider");
  }
  return context;
};
