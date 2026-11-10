import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Lock, KeyRound, AlertCircle, CheckCircle, Eye, EyeOff, X } from "lucide-react";

interface ChangePasswordModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * Password change modal — shown automatically when isTemporaryPassword === true,
 * or opened manually by any user from the top navigation bar.
 */
export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen = false, onClose }) => {
  const { currentUser, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isForced = Boolean(currentUser?.isTemporaryPassword);
  const visible = isForced || isOpen;

  if (!visible) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError("Debe ingresar su contraseña actual para continuar.");
      return;
    }
    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("La nueva contraseña y su confirmación no coinciden. Verifique ambos campos.");
      return;
    }

    setLoading(true);
    const res = await changePassword(currentPassword, newPassword);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Ocurrió un error al actualizar la contraseña.");
    } else {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if (onClose) onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 relative">
        {!isForced && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-3 text-amber-600 mb-5 bg-amber-50 p-3.5 rounded-xl border border-amber-200">
          <KeyRound className="w-6 h-6 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              {isForced ? "Definir Contraseña de Acceso" : "Cambiar Mi Contraseña"}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {isForced
                ? "Está ingresando con una clave asignada por Administración. Ingrese su nueva contraseña o confirme la misma para continuar."
                : "Actualice su contraseña personal de ingreso al sistema."}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Contraseña Actual {isForced ? "(Provisoria)" : ""}
            </label>
            <div className="relative">
              <input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Contraseña con la que acaba de ingresar"
                className="w-full px-3 py-2.5 pl-9 pr-9 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNew ? "text" : "password"}
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2.5 pl-9 pr-9 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita exactamente su nueva contraseña"
                className="w-full px-3 py-2.5 pl-9 pr-9 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-1 flex gap-2">
            {!isForced && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm transition-all shadow-md disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {loading ? "Guardando..." : "Guardar Contraseña Definitiva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
