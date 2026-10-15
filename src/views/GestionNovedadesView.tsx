import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Novedad, EstadoNovedad } from '../types';
import { subscribeNovedades, saveNovedad, addAccionNovedad } from '../firebase/firestoreService';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  ShieldAlert, 
  Search, 
  Filter, 
  MessageSquare,
  ArrowRight,
  Sparkles,
  Check
} from 'lucide-react';

export const GestionNovedadesView: React.FC = () => {
  const { currentUser } = useAuth();
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroCriticidad, setFiltroCriticidad] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal para gestionar o cambiar estado de la novedad
  const [novedadSeleccionada, setNovedadSeleccionada] = useState<Novedad | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<EstadoNovedad>('en_evaluacion');
  const [comentarioAccion, setComentarioAccion] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Real-time subscription — auto-refreshes when any user saves a novedad
    const unsub = subscribeNovedades(setNovedades);
    return () => unsub();
  }, []);

  const handleOpenModal = (nov: Novedad) => {
    setNovedadSeleccionada(nov);
    setNuevoEstado(nov.estado);
    setComentarioAccion('');
  };

  const handleSaveGestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novedadSeleccionada || !comentarioAccion.trim()) return;

    setIsUpdating(true);
    try {
      const now = new Date().toISOString();

      // 1. Update main novedad document (state + resolution fields)
      const updatedNovedad: Novedad = {
        ...novedadSeleccionada,
        estado: nuevoEstado,
        resueltoPor: nuevoEstado === 'resuelta' ? currentUser?.nombre : novedadSeleccionada.resueltoPor,
        resueltoEn: nuevoEstado === 'resuelta' ? now : novedadSeleccionada.resueltoEn,
        resolucionFinal: nuevoEstado === 'resuelta' ? comentarioAccion : novedadSeleccionada.resolucionFinal
      };
      await saveNovedad(updatedNovedad);

      // 2. Write action to subcolecction — non-destructive trazabilidad
      await addAccionNovedad(novedadSeleccionada.id, {
        usuario: currentUser?.nombre || 'Encargado',
        comentario: comentarioAccion.trim(),
        nuevoEstado
      });

      setNovedadSeleccionada(null);
      setComentarioAccion('');
    } catch (err) {
      console.error('Error al actualizar novedad:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredNovedades = novedades.filter(n => {
    if (filtroEstado !== 'todos' && n.estado !== filtroEstado) return false;
    if (filtroCriticidad !== 'todos' && n.criticidad !== filtroCriticidad) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        n.patente.toLowerCase().includes(term) ||
        n.itemAfectado.toLowerCase().includes(term) ||
        n.descripcion.toLowerCase().includes(term) ||
        n.folioTurno.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const getCriticidadBadge = (c: string) => {
    switch (c) {
      case 'critica':
        return <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-700">Crítica</span>;
      case 'alta':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Alta</span>;
      case 'media':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Media</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">Baja</span>;
    }
  };

  const getEstadoBadge = (st: EstadoNovedad) => {
    switch (st) {
      case 'pendiente':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Pendiente</span>;
      case 'en_evaluacion':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">En Evaluación</span>;
      case 'en_taller':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">En Taller / Reparación</span>;
      case 'resuelta':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Resuelta</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Rechazada</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2">
            <ShieldAlert className="w-4 h-4" /> Expediente de Acreditación de Calidad
          </div>
          <h2 className="text-2xl font-black">Gestión y Trazabilidad de Novedades</h2>
          <p className="text-sm text-sky-200/80 mt-1">
            Seguimiento de eventos anómalos detectados en turnos por Conductores y TENS
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white/10 rounded-xl px-4 py-2 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-sky-300">Pendientes</span>
            <p className="text-xl font-black text-rose-400">
              {novedades.filter(n => n.estado === 'pendiente').length}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-2 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-sky-300">En Taller</span>
            <p className="text-xl font-black text-amber-300">
              {novedades.filter(n => n.estado === 'en_taller').length}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-2 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-sky-300">Resueltas</span>
            <p className="text-xl font-black text-emerald-300">
              {novedades.filter(n => n.estado === 'resuelta').length}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por patente, ítem o folio..."
            className="w-full px-3.5 py-2 pl-9 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
            <Filter className="w-4 h-4" /> Estado:
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white"
            >
              <option value="todos">Todos los Estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="en_evaluacion">En Evaluación</option>
              <option value="en_taller">En Taller</option>
              <option value="resuelta">Resueltas</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
            Criticidad:
            <select
              value={filtroCriticidad}
              onChange={e => setFiltroCriticidad(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white"
            >
              <option value="todos">Todas</option>
              <option value="critica">Crítica</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Novedades */}
      <div className="space-y-3">
        {filteredNovedades.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-slate-700">No hay novedades registradas con estos filtros</p>
            <p className="text-xs text-slate-400">Todos los móviles e ítems reportados están conformes.</p>
          </div>
        ) : (
          filteredNovedades.map(nov => (
            <div
              key={nov.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {nov.patente}
                  </span>
                  {getCriticidadBadge(nov.criticidad)}
                  {getEstadoBadge(nov.estado)}
                  <span className="text-xs text-slate-400 font-medium">
                    Folio: {nov.folioTurno} • Origen: {nov.tipoOrigen.toUpperCase()}
                  </span>
                </div>

                <h4 className="font-bold text-slate-800 text-sm">{nov.itemAfectado}</h4>
                <p className="text-xs text-slate-600 line-clamp-2">{nov.descripcion}</p>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span>Reportado por: <strong>{nov.reportadoPor}</strong></span>
                  <span>Fecha: {new Date(nov.reportadoEn).toLocaleString('es-CL')}</span>
                  {nov.accionesRealizadas && nov.accionesRealizadas.length > 0 && (
                    <span className="text-sky-600 font-semibold">
                      {nov.accionesRealizadas.length} gestiones registradas
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenModal(nov)}
                  className="w-full md:w-auto px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-xl text-xs border border-sky-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Gestionar Novedad</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Gestión de Novedad */}
      {novedadSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                  Módulo de Gestión de Novedades
                </span>
                <h3 className="text-lg font-black text-slate-800">
                  {novedadSeleccionada.itemAfectado} ({novedadSeleccionada.patente})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNovedadSeleccionada(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 mb-4 space-y-1">
              <p><strong>Descripción:</strong> {novedadSeleccionada.descripcion}</p>
              <p><strong>Reportó:</strong> {novedadSeleccionada.reportadoPor} ({new Date(novedadSeleccionada.reportadoEn).toLocaleString('es-CL')})</p>
              <p><strong>Turno Folio:</strong> {novedadSeleccionada.folioTurno}</p>
            </div>

            {/* Historial de Trazabilidad */}
            {novedadSeleccionada.accionesRealizadas && novedadSeleccionada.accionesRealizadas.length > 0 && (
              <div className="mb-4">
                <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Historial de Intervenciones y Trazabilidad
                </span>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {novedadSeleccionada.accionesRealizadas.map((acc, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-sky-50 border border-sky-100 text-xs">
                      <div className="flex items-center justify-between text-slate-500 text-[10px] mb-1">
                        <strong>{acc.usuario}</strong>
                        <span>{new Date(acc.fecha).toLocaleString('es-CL')}</span>
                      </div>
                      <p className="text-slate-700">{acc.comentario}</p>
                      <span className="text-[10px] font-bold text-sky-700 mt-1 inline-block">
                        Nuevo Estado: {acc.nuevoEstado.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formulario de Nueva Intervención */}
            <form onSubmit={handleSaveGestion} className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Actualizar Estado de la Novedad
                </label>
                <select
                  value={nuevoEstado}
                  onChange={e => setNuevoEstado(e.target.value as EstadoNovedad)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                >
                  <option value="pendiente">Pendiente (Sin intervenir)</option>
                  <option value="en_evaluacion">En Evaluación (Por Calidad/Transporte)</option>
                  <option value="en_taller">En Taller / En Reparación</option>
                  <option value="resuelta">Resuelta (Reparado y Conforme)</option>
                  <option value="rechazada">Rechazada (No procede)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Comentario / Acción de Gestión Realizada
                </label>
                <textarea
                  required
                  rows={3}
                  value={comentarioAccion}
                  onChange={e => setComentarioAccion(e.target.value)}
                  placeholder="Detallar orden de compra, derivación a taller, repuesto cambiado o verificación efectuada..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNovedadSeleccionada(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isUpdating ? "Guardando..." : "Guardar Gestión y Trazabilidad"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
