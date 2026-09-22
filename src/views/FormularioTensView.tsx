import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Ambulancia, ChecklistTens, TurnoEntrega, Novedad } from '../types';
import { getAmbulancias, getTurnos, saveTurno, saveNovedad } from '../firebase/firestoreService';
import { TENS_DEFAULT } from '../data/seedData';
import { SignaturePad } from '../components/SignaturePad';
import { 
  HeartPulse, 
  CheckCircle, 
  AlertCircle, 
  ShieldCheck, 
  Check, 
  Sparkles,
  Activity,
  Layers
} from 'lucide-react';

export const FormularioTensView: React.FC = () => {
  const { currentUser } = useAuth();
  const [ambulancias, setAmbulancias] = useState<Ambulancia[]>([]);
  const [selectedPatente, setSelectedPatente] = useState('');
  const [turnoTipo, setTurnoTipo] = useState<'Día (08:00 - 20:00)' | 'Noche (20:00 - 08:00)'>('Día (08:00 - 20:00)');
  const [turnosAbiertos, setTurnosAbiertos] = useState<TurnoEntrega[]>([]);
  const [turnoSeleccionadoId, setTurnoSeleccionadoId] = useState<string>('nuevo');

  // TENS Saliente y Entrante
  const [nombreSaliente, setNombreSaliente] = useState(currentUser?.nombre || '');
  const [rutSaliente, setRutSaliente] = useState(currentUser?.rut || '');
  const [firmaSaliente, setFirmaSaliente] = useState('');
  const [obsSaliente, setObsSaliente] = useState('');

  const [nombreEntrante, setNombreEntrante] = useState('');
  const [rutEntrante, setRutEntrante] = useState('');
  const [firmaEntrante, setFirmaEntrante] = useState('');
  const [obsEntrante, setObsEntrante] = useState('');

  // Checklist Cabina Sanitaria (Hoja Fijaciones del Hospital Villarrica)
  const [checklist, setChecklist] = useState<ChecklistTens>({
    // Cabina delantera
    cinturonConductor: 'Operativo',
    cinturonCopiloto: 'Operativo',

    // Camilla
    camillaSujecionSuperior: 'Operativo',
    camillaSujecionMedio: 'Operativo',
    camillaSujecionInferior: 'Operativo',
    camillaAnclajePiso: 'Operativo',

    // Asientos Sanitarios
    cinturonAsientoCabecera: 'Operativo',
    cinturonAsientosLaterales: 'Operativo',

    // Equipamiento Especial
    sillaRuedasAnclaje: 'Operativo',
    incubadoraAnclaje: 'No Aplica',

    // Fijaciones Equipos Médicos Críticos
    fijacionBombaInfusion: 'Operativo',
    fijacionDesfibrilador: 'Operativo',
    fijacionMonitorSignos: 'Operativo',
    fijacionBombaAspiracion: 'Operativo',

    // Estado Sanitario
    gavetasAlmacenamiento: 'Operativo',
    cabinaLimpiaDesinfectada: true,
    oxigenoCilindroLleno: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const ambs = await getAmbulancias();
    setAmbulancias(ambs);
    if (ambs.length > 0 && !selectedPatente) {
      setSelectedPatente(ambs[0].patente);
    }
    const t = await getTurnos();
    // Turnos de hoy o pendientes de TENS
    const pendientes = t.filter(x => x.estado === 'pendiente_tens' || !x.tensSaliente);
    setTurnosAbiertos(pendientes);
  };

  const handleSalienteSelect = (nombre: string) => {
    setNombreSaliente(nombre);
    const found = TENS_DEFAULT.find(t => t.nombre === nombre);
    if (found) setRutSaliente(found.rut);
  };

  const handleEntranteSelect = (nombre: string) => {
    setNombreEntrante(nombre);
    const found = TENS_DEFAULT.find(t => t.nombre === nombre);
    if (found) setRutEntrante(found.rut);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedPatente) {
      setErrorMessage("Debe seleccionar la ambulancia a inspeccionar.");
      return;
    }

    if (!nombreSaliente || !nombreEntrante) {
      setErrorMessage("Debe seleccionar tanto al TENS saliente como al entrante.");
      return;
    }

    if (!firmaSaliente || !firmaEntrante) {
      setErrorMessage("Es obligatorio que ambos TENS firmen digitalmente en la pantalla para validar la acreditación del turno.");
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const folio = turnoSeleccionadoId !== 'nuevo' ? turnoSeleccionadoId : `ENT-TENS-${Date.now().toString().slice(-6)}`;

      // Novedades para Acreditación y Calidad asistencial
      const novedades: Novedad[] = [];

      // Evaluación de anclaje de camilla
      if (checklist.camillaSujecionSuperior === 'No Operativo' || 
          checklist.camillaSujecionMedio === 'No Operativo' || 
          checklist.camillaSujecionInferior === 'No Operativo' ||
          checklist.camillaAnclajePiso === 'No Operativo') {
        novedades.push({
          id: `nov-tens-${Date.now()}-1`,
          turnoId: folio,
          folioTurno: folio,
          patente: selectedPatente,
          tipoOrigen: 'tens',
          categoria: 'cabina_sanitaria',
          itemAfectado: 'Sistema de Sujeción / Anclaje de Camilla',
          descripcion: 'Falla detectada en sujeción de paciente o anclaje de camilla al piso de la cabina sanitaria.',
          criticidad: 'critica',
          estado: 'pendiente',
          reportadoPor: nombreSaliente,
          reportadoEn: now,
          asignadoA: 'calidad'
        });
      }

      // Evaluación de fijación desfibrilador y monitor
      if (checklist.fijacionDesfibrilador === 'No Operativo' || checklist.fijacionMonitorSignos === 'No Operativo') {
        novedades.push({
          id: `nov-tens-${Date.now()}-2`,
          turnoId: folio,
          folioTurno: folio,
          patente: selectedPatente,
          tipoOrigen: 'tens',
          categoria: 'equipamiento_biomedico',
          itemAfectado: 'Fijación Desfibrilador / Monitor Cardiaco',
          descripcion: 'Soporte o anclaje de desfibrilador/monitor suelto o no operativo en cabina sanitaria.',
          criticidad: 'alta',
          estado: 'pendiente',
          reportadoPor: nombreSaliente,
          reportadoEn: now,
          asignadoA: 'calidad'
        });
      }

      // Evaluación bomba de infusión o aspiración
      if (checklist.fijacionBombaAspiracion === 'No Operativo' || checklist.fijacionBombaInfusion === 'No Operativo') {
        novedades.push({
          id: `nov-tens-${Date.now()}-3`,
          turnoId: folio,
          folioTurno: folio,
          patente: selectedPatente,
          tipoOrigen: 'tens',
          categoria: 'equipamiento_biomedico',
          itemAfectado: 'Fijación Bomba de Aspiración / Infusión',
          descripcion: 'Sistema de fijación de bombas biomédicas presenta anomalía.',
          criticidad: 'media',
          estado: 'pendiente',
          reportadoPor: nombreSaliente,
          reportadoEn: now,
          asignadoA: 'calidad'
        });
      }

      // Guardar Novedades
      for (const nov of novedades) {
        await saveNovedad(nov);
      }

      // Si se está complementando un turno existente iniciado por un conductor
      let turnoAGuardar: TurnoEntrega;
      const turnoExistente = turnosAbiertos.find(t => t.id === turnoSeleccionadoId);

      if (turnoExistente) {
        turnoAGuardar = {
          ...turnoExistente,
          tensSaliente: {
            nombre: nombreSaliente,
            rut: rutSaliente,
            firmaUrl: firmaSaliente,
            fechaHora: now
          },
          tensEntrante: {
            nombre: nombreEntrante,
            rut: rutEntrante,
            firmaUrl: firmaEntrante,
            fechaHora: now
          },
          observacionesTensSaliente: obsSaliente,
          observacionesTensEntrante: obsEntrante,
          checklistTens: checklist,
          estado: novedades.length > 0 ? 'con_novedades' : 'completo',
          actualizadoEn: now
        };
      } else {
        turnoAGuardar = {
          id: folio,
          codigoFolio: folio,
          patente: selectedPatente,
          fecha: now,
          turnoTipo: turnoTipo,
          kilometraje: 0,
          estado: novedades.length > 0 ? 'con_novedades' : 'pendiente_conductor',
          tensSaliente: {
            nombre: nombreSaliente,
            rut: rutSaliente,
            firmaUrl: firmaSaliente,
            fechaHora: now
          },
          tensEntrante: {
            nombre: nombreEntrante,
            rut: rutEntrante,
            firmaUrl: firmaEntrante,
            fechaHora: now
          },
          observacionesTensSaliente: obsSaliente,
          observacionesTensEntrante: obsEntrante,
          checklistTens: checklist,
          creadoEn: now,
          actualizadoEn: now,
          creadoPor: currentUser?.nombre || nombreSaliente
        };
      }

      await saveTurno(turnoAGuardar);
      setSuccessMessage(`Checklist de Cabina Sanitaria ${folio} guardado exitosamente. Se integró a la acreditación de Calidad.`);

      setFirmaSaliente('');
      setFirmaEntrante('');
      setObsSaliente('');
      setObsEntrante('');
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || "Error al registrar la entrega de TENS.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-200 text-xs font-semibold mb-2">
            <HeartPulse className="w-4 h-4" /> Módulo Exclusivo TENS
          </div>
          <h2 className="text-2xl font-black">Entrega y Recepción Cabina Sanitaria (TENS)</h2>
          <p className="text-sm text-teal-200/80 mt-1">
            Pauta Oficial de Fijaciones, Equipamiento Biomédico y Bioseguridad Hospitalaria
          </p>
        </div>
        <div className="text-right hidden md:block">
          <span className="text-xs text-slate-300">Pauta Hospitalaria:</span>
          <p className="text-sm font-bold text-teal-300">Acreditación • Calidad y Seguridad</p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vinculación o Selección de Móvil */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-teal-600" />
            1. Ambulancia y Vinculación de Turno
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Placa Patente
              </label>
              <select
                value={selectedPatente}
                onChange={e => setSelectedPatente(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm font-bold bg-white text-slate-800"
              >
                {ambulancias.map(a => (
                  <option key={a.patente} value={a.patente}>
                    {a.patente} - {a.nombreMovil}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Vincular a Turno Abierto (Opcional)
              </label>
              <select
                value={turnoSeleccionadoId}
                onChange={e => {
                  setTurnoSeleccionadoId(e.target.value);
                  const sel = turnosAbiertos.find(x => x.id === e.target.value);
                  if (sel) {
                    setSelectedPatente(sel.patente);
                    setTurnoTipo(sel.turnoTipo);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm font-semibold bg-white text-slate-800"
              >
                <option value="nuevo">+ Crear Nuevo Registro Independiente</option>
                {turnosAbiertos.map(t => (
                  <option key={t.id} value={t.id}>
                    Folio {t.codigoFolio} ({t.patente} - {t.conductorSaliente?.nombre || 'Conductor'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Horario de Turno
              </label>
              <select
                value={turnoTipo}
                onChange={e => setTurnoTipo(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm font-semibold bg-white text-slate-800"
              >
                <option value="Día (08:00 - 20:00)">Día (08:00 - 20:00)</option>
                <option value="Noche (20:00 - 08:00)">Noche (20:00 - 08:00)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sección: Fijaciones Camilla y Asientos (Hoja Fijaciones) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            2. Lista de Chequeo de Fijaciones (Pauta Institucional)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Camilla */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-teal-800">
                Sujeciones y Anclaje de Camilla
              </h4>
              
              <div className="space-y-2 text-xs font-semibold text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Sistema Sujeción Superior:</span>
                  <select
                    value={checklist.camillaSujecionSuperior}
                    onChange={e => setChecklist({ ...checklist, camillaSujecionSuperior: e.target.value as any })}
                    className="px-2 py-1 rounded border border-slate-300 bg-white"
                  >
                    <option value="Operativo">Operativo</option>
                    <option value="No Operativo">No Operativo</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span>Sistema Sujeción Medio:</span>
                  <select
                    value={checklist.camillaSujecionMedio}
                    onChange={e => setChecklist({ ...checklist, camillaSujecionMedio: e.target.value as any })}
                    className="px-2 py-1 rounded border border-slate-300 bg-white"
                  >
                    <option value="Operativo">Operativo</option>
                    <option value="No Operativo">No Operativo</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span>Sistema Sujeción Inferior:</span>
                  <select
                    value={checklist.camillaSujecionInferior}
                    onChange={e => setChecklist({ ...checklist, camillaSujecionInferior: e.target.value as any })}
                    className="px-2 py-1 rounded border border-slate-300 bg-white"
                  >
                    <option value="Operativo">Operativo</option>
                    <option value="No Operativo">No Operativo</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span>Anclaje de Camilla a Piso:</span>
                  <select
                    value={checklist.camillaAnclajePiso}
                    onChange={e => setChecklist({ ...checklist, camillaAnclajePiso: e.target.value as any })}
                    className="px-2 py-1 rounded border border-slate-300 bg-white"
                  >
                    <option value="Operativo">Operativo</option>
                    <option value="No Operativo">No Operativo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Asientos y Cinturones */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-teal-800">
                Cinturones de Seguridad Asientos Cabina
              </h4>

              <div className="space-y-2 text-xs font-semibold text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Asiento Cabecera Sanitaria:</span>
                  <select
                    value={checklist.cinturonAsientoCabecera}
                    onChange={e => setChecklist({ ...checklist, cinturonAsientoCabecera: e.target.value as any })}
                    className="px-2 py-1 rounded border border-slate-300 bg-white"
                  >
                    <option value="Operativo">Operativo</option>
                    <option value="No Operativo">No Operativo</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span>Asientos Laterales Acompañante:</span>
                  <select
                    value={checklist.cinturonAsientosLaterales}
                    onChange={e => setChecklist({ ...checklist, cinturonAsientosLaterales: e.target.value as any })}
                    className="px-2 py-1 rounded border border-slate-300 bg-white"
                  >
                    <option value="Operativo">Operativo</option>
                    <option value="No Operativo">No Operativo</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span>Cinturón Asiento Conductor:</span>
                  <select
                    value={checklist.cinturonConductor}
                    onChange={e => setChecklist({ ...checklist, cinturonConductor: e.target.value as any })}
                    className="px-2 py-1 rounded border border-slate-300 bg-white"
                  >
                    <option value="Operativo">Operativo</option>
                    <option value="No Operativo">No Operativo</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span>Cinturón Asiento Copiloto:</span>
                  <select
                    value={checklist.cinturonCopiloto}
                    onChange={e => setChecklist({ ...checklist, cinturonCopiloto: e.target.value as any })}
                    className="px-2 py-1 rounded border border-slate-300 bg-white"
                  >
                    <option value="Operativo">Operativo</option>
                    <option value="No Operativo">No Operativo</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Fijación Equipos Biomédicos Críticos (Pauta Fijaciones) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-teal-600" />
            3. Sistemas de Fijación de Equipos Médicos Críticos
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl border border-slate-200">
              <span className="block text-xs font-bold text-slate-700 mb-1">Desfibrilador</span>
              <select
                value={checklist.fijacionDesfibrilador}
                onChange={e => setChecklist({ ...checklist, fijacionDesfibrilador: e.target.value as any })}
                className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="Operativo">Operativo</option>
                <option value="No Operativo">No Operativo</option>
                <option value="No Aplica">No Aplica</option>
              </select>
            </div>

            <div className="p-3 rounded-xl border border-slate-200">
              <span className="block text-xs font-bold text-slate-700 mb-1">Monitor Multiparámetro</span>
              <select
                value={checklist.fijacionMonitorSignos}
                onChange={e => setChecklist({ ...checklist, fijacionMonitorSignos: e.target.value as any })}
                className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="Operativo">Operativo</option>
                <option value="No Operativo">No Operativo</option>
                <option value="No Aplica">No Aplica</option>
              </select>
            </div>

            <div className="p-3 rounded-xl border border-slate-200">
              <span className="block text-xs font-bold text-slate-700 mb-1">Bomba de Infusión</span>
              <select
                value={checklist.fijacionBombaInfusion}
                onChange={e => setChecklist({ ...checklist, fijacionBombaInfusion: e.target.value as any })}
                className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="Operativo">Operativo</option>
                <option value="No Operativo">No Operativo</option>
                <option value="No Aplica">No Aplica</option>
              </select>
            </div>

            <div className="p-3 rounded-xl border border-slate-200">
              <span className="block text-xs font-bold text-slate-700 mb-1">Bomba de Aspiración</span>
              <select
                value={checklist.fijacionBombaAspiracion}
                onChange={e => setChecklist({ ...checklist, fijacionBombaAspiracion: e.target.value as any })}
                className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="Operativo">Operativo</option>
                <option value="No Operativo">No Operativo</option>
                <option value="No Aplica">No Aplica</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="p-3 rounded-xl border border-slate-200">
              <span className="block text-xs font-bold text-slate-700 mb-1">Anclaje Silla de Ruedas</span>
              <select
                value={checklist.sillaRuedasAnclaje}
                onChange={e => setChecklist({ ...checklist, sillaRuedasAnclaje: e.target.value as any })}
                className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="Operativo">Operativo</option>
                <option value="No Operativo">No Operativo</option>
                <option value="No Aplica">No Aplica</option>
              </select>
            </div>

            <div className="p-3 rounded-xl border border-slate-200">
              <span className="block text-xs font-bold text-slate-700 mb-1">Anclaje Incubadora</span>
              <select
                value={checklist.incubadoraAnclaje}
                onChange={e => setChecklist({ ...checklist, incubadoraAnclaje: e.target.value as any })}
                className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="No Aplica">No Aplica</option>
                <option value="Operativo">Operativo</option>
                <option value="No Operativo">No Operativo</option>
              </select>
            </div>

            <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.cabinaLimpiaDesinfectada}
                onChange={e => setChecklist({ ...checklist, cabinaLimpiaDesinfectada: e.target.checked })}
                className="w-5 h-5 text-teal-600 rounded"
              />
              <span className="text-xs font-bold text-slate-700">Cabina Limpia y Desinfectada</span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.oxigenoCilindroLleno}
                onChange={e => setChecklist({ ...checklist, oxigenoCilindroLleno: e.target.checked })}
                className="w-5 h-5 text-teal-600 rounded"
              />
              <span className="text-xs font-bold text-slate-700">Cilindro Oxígeno Conforme</span>
            </label>
          </div>
        </div>

        {/* Sección: Firmas y Observaciones TENS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            4. Firmas Digitales de Entrega y Recepción (TENS)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TENS Saliente */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  TENS que Entrega (Saliente)
                </label>
                <select
                  value={nombreSaliente}
                  onChange={e => handleSalienteSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold bg-white"
                >
                  <option value="">Seleccione TENS saliente...</option>
                  {TENS_DEFAULT.map(t => (
                    <option key={t.rut} value={t.nombre}>
                      {t.nombre} ({t.rut})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Observaciones Cabina Saliente</label>
                <textarea
                  rows={2}
                  value={obsSaliente}
                  onChange={e => setObsSaliente(e.target.value)}
                  placeholder="Detalles de insumos, aseo o estado de equipos..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <SignaturePad
                label="Firma TENS Saliente"
                funcionarioNombre={nombreSaliente}
                funcionarioRut={rutSaliente}
                onSave={setFirmaSaliente}
                savedSignature={firmaSaliente}
              />
            </div>

            {/* TENS Entrante */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  TENS que Recibe (Entrante)
                </label>
                <select
                  value={nombreEntrante}
                  onChange={e => handleEntranteSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold bg-white"
                >
                  <option value="">Seleccione TENS entrante...</option>
                  {TENS_DEFAULT.map(t => (
                    <option key={t.rut} value={t.nombre}>
                      {t.nombre} ({t.rut})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Observaciones Cabina Entrante</label>
                <textarea
                  rows={2}
                  value={obsEntrante}
                  onChange={e => setObsEntrante(e.target.value)}
                  placeholder="Conformidad de recepción de cabina sanitaria..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <SignaturePad
                label="Firma TENS Entrante"
                funcionarioNombre={nombreEntrante}
                funcionarioRut={rutEntrante}
                onSave={setFirmaEntrante}
                savedSignature={firmaEntrante}
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold rounded-xl shadow-lg shadow-teal-600/25 transition-all text-sm disabled:opacity-50"
          >
            <Check className="w-5 h-5" />
            <span>{isSubmitting ? "Registrando Cabina Sanitaria..." : "Guardar Entrega de Turno TENS"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
