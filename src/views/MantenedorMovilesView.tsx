import React, { useState, useEffect } from 'react';
import { Ambulancia } from '../types';
import { getAmbulancias, saveAmbulancia } from '../firebase/firestoreService';
import { 
  Truck, 
  Plus, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Wrench, 
  Search, 
  Edit3,
  Check,
  ShieldCheck,
  Clock
} from 'lucide-react';

export const MantenedorMovilesView: React.FC = () => {
  const [ambulancias, setAmbulancias] = useState<Ambulancia[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAmbulancia, setEditingAmbulancia] = useState<Ambulancia | null>(null);

  // Form fields
  const [patente, setPatente] = useState('');
  const [nombreMovil, setNombreMovil] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [fechaEnrolamiento, setFechaEnrolamiento] = useState(new Date().toISOString().split('T')[0]);
  const [kilometrajeActual, setKilometrajeActual] = useState(0);
  const [estado, setEstado] = useState<'operativa' | 'en_mantencion' | 'fuera_servicio'>('operativa');
  const [proximoMantenimientoKm, setProximoMantenimientoKm] = useState(10000);
  const [proximoMantenimientoFecha, setProximoMantenimientoFecha] = useState('');
  const [tallerAsignado, setTallerAsignado] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAmbulancias();
  }, []);

  const loadAmbulancias = async () => {
    const list = await getAmbulancias();
    setAmbulancias(list);
  };

  const handleOpenCreate = () => {
    setEditingAmbulancia(null);
    setPatente('');
    setNombreMovil('');
    setMarca('Mercedes-Benz');
    setModelo('');
    setAnio(2023);
    setFechaEnrolamiento(new Date().toISOString().split('T')[0]);
    setKilometrajeActual(0);
    setEstado('operativa');
    setProximoMantenimientoKm(10000);
    setProximoMantenimientoFecha('');
    setTallerAsignado('');
    setObservaciones('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: Ambulancia) => {
    setEditingAmbulancia(a);
    setPatente(a.patente);
    setNombreMovil(a.nombreMovil);
    setMarca(a.marca);
    setModelo(a.modelo);
    setAnio(a.anio);
    setFechaEnrolamiento(a.fechaEnrolamiento);
    setKilometrajeActual(a.kilometrajeActual);
    setEstado(a.estado);
    setProximoMantenimientoKm(a.proximoMantenimientoKm);
    setProximoMantenimientoFecha(a.proximoMantenimientoFecha);
    setTallerAsignado(a.tallerAsignado || '');
    setObservaciones(a.observaciones || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSave: Ambulancia = {
        id: patente.trim().toUpperCase(),
        patente: patente.trim().toUpperCase(),
        nombreMovil: nombreMovil.trim(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        anio: Number(anio),
        fechaEnrolamiento,
        kilometrajeActual: Number(kilometrajeActual),
        estado,
        proximoMantenimientoKm: Number(proximoMantenimientoKm),
        proximoMantenimientoFecha,
        tallerAsignado: tallerAsignado.trim(),
        observaciones: observaciones.trim()
      };

      await saveAmbulancia(dataToSave);
      await loadAmbulancias();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error guardando ambulancia:", err);
    } finally {
      setSaving(false);
    }
  };

  // Cálculo de alerta de mantención
  const getAlertaMantencion = (a: Ambulancia) => {
    const kmRestantes = a.proximoMantenimientoKm - a.kilometrajeActual;
    const proximaFecha = a.proximoMantenimientoFecha ? new Date(a.proximoMantenimientoFecha) : null;
    const hoy = new Date();
    
    // Alerta de kilometraje vencido o a menos de 500 km
    if (kmRestantes <= 0) {
      return { tipo: 'vencida', texto: `¡Mantenimiento vencido por ${Math.abs(kmRestantes)} km!`, color: 'text-red-700 bg-red-100 border-red-200' };
    }
    if (kmRestantes <= 1000) {
      return { tipo: 'urgente', texto: `Próximo mantenimiento en ${kmRestantes} km`, color: 'text-amber-700 bg-amber-100 border-amber-200' };
    }
    
    // Alerta de fecha próxima
    if (proximaFecha) {
      const diffDias = Math.ceil((proximaFecha.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
      if (diffDias <= 7 && diffDias >= 0) {
        return { tipo: 'fecha', texto: `Fecha comprometida en ${diffDias} días`, color: 'text-amber-700 bg-amber-100 border-amber-200' };
      }
    }

    return null;
  };

  const filteredAmbulancias = ambulancias.filter(a => {
    const term = searchTerm.toLowerCase();
    return (
      a.patente.toLowerCase().includes(term) ||
      a.nombreMovil.toLowerCase().includes(term) ||
      a.modelo.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold mb-2">
            <Truck className="w-4 h-4" /> Parque Automotriz • Hospital de Villarrica
          </div>
          <h2 className="text-2xl font-black">Mantenedor de Ambulancias y Flota</h2>
          <p className="text-sm text-blue-200/80 mt-1">
            Gestión técnica, control de kilometraje y alertas preventivas de mantención programada
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl shadow-lg transition-all text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Ingresar Nueva Ambulancia</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por patente, móvil o modelo..."
            className="w-full px-3.5 py-2 pl-9 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
        <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
          Total: {filteredAmbulancias.length} móviles registrados
        </span>
      </div>

      {/* Grid de Ambulancias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAmbulancias.map(amb => {
          const alerta = getAlertaMantencion(amb);

          return (
            <div
              key={amb.patente}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-sm font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg tracking-wider border border-slate-300">
                      {amb.patente}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm mt-2">{amb.nombreMovil}</h3>
                    <p className="text-xs text-slate-500">{amb.marca} {amb.modelo} ({amb.anio})</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    amb.estado === 'operativa' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : amb.estado === 'en_mantencion'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {amb.estado === 'operativa' ? 'Operativa' : amb.estado === 'en_mantencion' ? 'En Taller' : 'Fuera Serv.'}
                  </span>
                </div>

                {/* Alerta de Mantenimiento Preventivo */}
                {alerta && (
                  <div className={`p-2.5 rounded-xl border mb-3 flex items-center gap-2 text-xs font-bold ${alerta.color}`}>
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{alerta.texto}</span>
                  </div>
                )}

                {/* Métricas clave */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Km Actual</span>
                    <strong className="text-slate-800">{amb.kilometrajeActual.toLocaleString('es-CL')} km</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Próx. Mantención</span>
                    <strong className="text-slate-800">{amb.proximoMantenimientoKm.toLocaleString('es-CL')} km</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha Comprometida</span>
                    <span>{amb.proximoMantenimientoFecha || "S/F"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Taller</span>
                    <span className="truncate">{amb.tallerAsignado || "Interno"}</span>
                  </div>
                </div>

                {amb.observaciones && (
                  <p className="text-[11px] text-slate-500 italic mb-2">"{amb.observaciones}"</p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(amb)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Móvil</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Crear / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                  Parque Automotriz Villarrica
                </span>
                <h3 className="text-lg font-black text-slate-800">
                  {editingAmbulancia ? `Editar Móvil ${editingAmbulancia.patente}` : "Ingresar Nueva Ambulancia"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Placa Patente
                  </label>
                  <input
                    type="text"
                    required
                    value={patente}
                    onChange={e => setPatente(e.target.value.toUpperCase())}
                    placeholder="Ej: HKRC-84"
                    disabled={Boolean(editingAmbulancia)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold uppercase disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre del Móvil
                  </label>
                  <input
                    type="text"
                    required
                    value={nombreMovil}
                    onChange={e => setNombreMovil(e.target.value)}
                    placeholder="Ej: Móvil 1 - SAMU Avanzada"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    required
                    value={marca}
                    onChange={e => setMarca(e.target.value)}
                    placeholder="Mercedes-Benz / Peugeot"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Modelo
                  </label>
                  <input
                    type="text"
                    required
                    value={modelo}
                    onChange={e => setModelo(e.target.value)}
                    placeholder="Sprinter 415 CDI"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Año
                  </label>
                  <input
                    type="number"
                    required
                    value={anio}
                    onChange={e => setAnio(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kilometraje Actual
                  </label>
                  <input
                    type="number"
                    required
                    value={kilometrajeActual}
                    onChange={e => setKilometrajeActual(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Estado Operativo
                  </label>
                  <select
                    value={estado}
                    onChange={e => setEstado(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="operativa">Operativa</option>
                    <option value="en_mantencion">En Mantención / Taller</option>
                    <option value="fuera_servicio">Fuera de Servicio</option>
                  </select>
                </div>
              </div>

              {/* Parámetros de Mantención Programada */}
              <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200 space-y-3">
                <span className="block text-xs font-bold text-sky-900 uppercase tracking-wider">
                  Mantenimiento Preventivo Comprometido (Acreditación)
                </span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Próxima Mantención (Km Límite)
                    </label>
                    <input
                      type="number"
                      required
                      value={proximoMantenimientoKm}
                      onChange={e => setProximoMantenimientoKm(Number(e.target.value))}
                      placeholder="Ej: 120000"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Fecha Comprometida
                    </label>
                    <input
                      type="date"
                      value={proximoMantenimientoFecha}
                      onChange={e => setProximoMantenimientoFecha(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Taller o Concesionario Asignado
                  </label>
                  <input
                    type="text"
                    value={tallerAsignado}
                    onChange={e => setTallerAsignado(e.target.value)}
                    placeholder="Ej: Kaufmann Temuco / Taller SSASUR"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Observaciones Técnicas
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  placeholder="Detalles sobre equipamiento o estado..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? "Guardando..." : "Guardar Ambulancia"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
