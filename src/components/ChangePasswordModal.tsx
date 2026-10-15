import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Lock, KeyRound, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";

/**
 * Forced password change modal — shown when isTemporaryPassword === true.
 * Now requires the user to enter their CURRENT (temporary) password
 * for Firebase Auth reauthentication before updating.
 */
export const ChangePasswordModal: React.FC = () => {
  const { currentUser, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!currentUser?.isTemporaryPassword) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError("Debe ingresar su contraseña actual (provisoria) para continuar.");
      return;
    }
    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden. Por favor verifique.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("La nueva contraseña no puede ser igual a la contraseña actual.");
      return;
    }

    setLoading(true);
    const res = await changePassword(currentPassword, newPassword);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Ocurrió un error al actualizar la contraseña.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
        <div className="flex items-center gap-3 text-amber-600 mb-5 bg-amber-50 p-3.5 rounded-xl border border-amber-200">
          <KeyRound className="w-6 h-6 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-slate-800 text-base">Cambio de Contraseña Obligatorio</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Está usando una contraseña provisoria. Por seguridad institucional, debe definir su clave personal antes de continuar.
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
          {/* Current (temporary) password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Contraseña Actual (Provisoria)
            </label>
            <div className="relative">
              <input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Contraseña que le fue entregada"
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
                placeholder="Mínimo 8 caracteres"
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
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita su nueva contraseña"
                className="w-full px-3 py-2.5 pl-9 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm transition-all shadow-md disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {loading ? "Actualizando en Firebase Auth..." : "Guardar Contraseña Definitiva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
