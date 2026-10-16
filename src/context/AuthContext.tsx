import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { AppUser, UserRole } from "../types";
import { rutToAuthEmail } from "../utils/authUtils";
import {
  getUsuarioByUid,
  getUsuarioByEmail,
  updateUltimoAcceso,
  updateIsTemporaryPassword,
  seedAmbulanciasIfEmpty,
  saveUsuario,
  resolveAuthEmail,
} from "../firebase/firestoreService";

interface AuthContextType {
  currentUser: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (emailOrRut: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── Subscribe to Firebase Auth state ─────────────────────────────────────
  // This is the ONLY source of truth for authentication.
  // No localStorage session — Firebase manages secure JWT tokens internally.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          let profile = await getUsuarioByUid(fbUser.uid);
          // Auto-provision Super Admin if owner logs in for the first time
          if (!profile && fbUser.email === "gonzalop14@gmail.com") {
            const adminUser: AppUser = {
              id: fbUser.uid,
              email: fbUser.email,
              nombre: "Gonzalo Pérez (Administrador)",
              rut: "14.101.299-1",
              rol: "admin",
              cargo: "Administrador del Sistema y TI",
              activo: true,
              isTemporaryPassword: false,
              creadoEn: new Date().toISOString(),
            };
            await saveUsuario(adminUser);
            profile = adminUser;
          }

          if (profile && profile.activo) {
            setCurrentUser(profile);
            // Async fire-and-forget: update last access timestamp
            updateUltimoAcceso(fbUser.uid).catch(() => {});
            // Seed fleet if empty once authenticated
            seedAmbulanciasIfEmpty().catch(() => {});
          } else {
            // Profile not found or inactive — sign out silently
            await signOut(auth);
            setCurrentUser(null);
          }
        } catch (err) {
          console.error("Error loading user profile:", err);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ─── Login ─────────────────────────────────────────────────────────────────
  // Accepts RUT directly (e.g. 11.111.111-1 or 11111111-1) or email (e.g. gonzalop14@gmail.com).
  const login = async (
    emailOrRut: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const input = (emailOrRut || "").trim();
      if (!input) {
        return { success: false, error: "Por favor ingrese su RUT institucional." };
      }
      const authEmail = await resolveAuthEmail(input);
      await signInWithEmailAndPassword(auth, authEmail, password);
      // onAuthStateChanged will handle loading the profile
      return { success: true };
    } catch (err: any) {
      const code = err.code || "";
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        return { success: false, error: "Credenciales incorrectas. Verifique su RUT y contraseña." };
      }
      if (code === "auth/wrong-password") {
        return { success: false, error: "Contraseña incorrecta." };
      }
      if (code === "auth/too-many-requests") {
        return { success: false, error: "Demasiados intentos fallidos. Intente más tarde." };
      }
      if (code === "auth/user-disabled") {
        return { success: false, error: "Esta cuenta está deshabilitada. Contacte al encargado." };
      }
      return { success: false, error: err.message || "Error al autenticar." };
    }
  };

  // ─── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setFirebaseUser(null);
  };

  // ─── Change Password ───────────────────────────────────────────────────────
  // Requires reauthentication with current password for security.
  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseUser || !currentUser) {
      return { success: false, error: "No hay sesión activa." };
    }
    if (newPassword.length < 8) {
      return { success: false, error: "La nueva contraseña debe tener al menos 8 caracteres." };
    }
    try {
      // Reauthenticate before sensitive operation
      const credential = EmailAuthProvider.credential(
        firebaseUser.email!,
        currentPassword
      );
      await reauthenticateWithCredential(firebaseUser, credential);

      // Update password in Firebase Auth
      await updatePassword(firebaseUser, newPassword);

      // Mark isTemporaryPassword = false in Firestore
      await updateIsTemporaryPassword(currentUser.id, false);

      // Update local state
      setCurrentUser((prev) =>
        prev ? { ...prev, isTemporaryPassword: false } : prev
      );

      return { success: true };
    } catch (err: any) {
      const code = err.code || "";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        return { success: false, error: "La contraseña actual es incorrecta." };
      }
      return { success: false, error: err.message || "Error al cambiar contraseña." };
    }
  };

  // ─── Role check ────────────────────────────────────────────────────────────
  const hasRole = (roles: UserRole[]): boolean => {
    if (!currentUser) return false;
    if (currentUser.rol === "admin") return true;
    return roles.includes(currentUser.rol);
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, firebaseUser, loading, login, logout, changePassword, hasRole }}
    >
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
