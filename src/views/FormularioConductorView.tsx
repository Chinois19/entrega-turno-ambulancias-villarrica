import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Ambulancia, ChecklistConductor, TurnoEntrega, Novedad } from '../types';
import { getAmbulancias, getTurnos, saveTurno, saveNovedad, uploadSignature, getUsuarios } from '../firebase/firestoreService';
import { SignaturePad } from '../components/SignaturePad';
import { 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Wrench, 
  Gauge, 
  Shield, 
  ShieldCheck,
  Check, 
  AlertCircle,
  Truck,
  RotateCcw
} from 'lucide-react';

export const FormularioConductorView: React.FC = () => {
  const { currentUser } = useAuth();
  const [ambulancias, setAmbulancias] = useState<Ambulancia[]>([]);
  const [conductores, setConductores] = useState<{ rut: string; nombre: string }[]>([]);
  const [turnosExistentes, setTurnosExistentes] = useState<TurnoEntrega[]>([]);
  const [selectedPatente, setSelectedPatente] = useState('');
  const [kilometraje, setKilometraje] = useState<number>(0);
  const [turnoTipo, setTurnoTipo] = useState<'Día (08:00 - 20:00)' | 'Noche (20:00 - 08:00)'>('Día (08:00 - 20:00)');

  // Conductor saliente y entrante
  const [rutSaliente, setRutSaliente] = useState(currentUser?.rut || '');
  const [nombreSaliente, setNombreSaliente] = useState(currentUser?.nombre || '');
  const [firmaSaliente, setFirmaSaliente] = useState('');
  const [obsSaliente, setObsSaliente] = useState('');

  const [rutEntrante, setRutEntrante] = useState('');
  const [nombreEntrante, setNombreEntrante] = useState('');
  const [firmaEntrante, setFirmaEntrante] = useState('');
  const [obsEntrante, setObsEntrante] = useState('');

  // Checklist Conductor
  const [checklist, setChecklist] = useState<ChecklistConductor>({
    cinturonConductor: 'Operativo',
    cinturonCopiloto: 'Operativo',
    permisoCirculacion: true,
    revisionTecnica: true,
    tarjetaCombustible: 'Si',
    bitacoraMovil: 'Si',
    nivelAceite: 'Normal',
    nivelAguaRefrigerante: 'Normal',
    nivelLiquidoFrenos: 'Normal',
    nivelLiquidoDireccion: 'Normal',
    nivelCombustible: 'Lleno',
    estadoNeumaticos: 'Bueno',
    presionNeumaticos: true,
    estadoPlumillas: 'Bueno',
    limpiaparabrisasLuneta: true,
    exteriorLimpioSinDano: true,
    pastillasDiscosFrenos: 'Bueno',
    lucesBalizasSirena: 'Operativo',
    testigosTablero: 'Normal',
    sistemaCargaBaterias: 'Bueno',
    gataElevadora: true,
    juegoLlaves: true,
    juegoTriangulos: true,
    chalecoReflectante: true,
    ruedaRepuesto: true,
    pruebaRutaOk: true,
    lubricacionPuertasOk: true,
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
      setKilometraje(ambs[0].kilometrajeActual);
    }
    const t = await getTurnos();
    setTurnosExistentes(t);

    const users = await getUsuarios();
    const condList = users
      .filter(u => u.rol === 'conductor' && u.activo && !u.eliminado)
      .map(u => ({ rut: u.rut, nombre: u.nombre }));
    setConductores(condList);
  };

  const handlePatenteChange = (pat: string) => {
    setSelectedPatente(pat);
    const amb = ambulancias.find(a => a.patente === pat);
    if (amb) {
      setKilometraje(amb.kilometrajeActual);
    }
  };

  const handleSalienteSelect = (nombre: string) => {
    setNombreSaliente(nombre);
    const found = conductores.find(c => c.nombre === nombre);
    if (found) setRutSaliente(found.rut);
  };

  const handleEntranteSelect = (nombre: string) => {
    setNombreEntrante(nombre);
    const found = conductores.find(c => c.nombre === nombre);
    if (found) setRutEntrante(found.rut);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedPatente) {
      setErrorMessage("Debe seleccionar una ambulancia.");
      return;
    }

    if (!nombreSaliente || !nombreEntrante) {
      setErrorMessage("Debe indicar tanto el conductor saliente como el entrante.");
      return;
    }

    if (!firmaSaliente || !firmaEntrante) {
      setErrorMessage("Es obligatorio que ambos conductores firmen en pantalla digital para validez de Acreditación.");
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const folio = `ENT-COND-${Date.now().toString().slice(-8)}`;
      
      // Upload signatures to Firebase Storage (not embedded in Firestore)
      const [urlSaliente, urlEntrante] = await Promise.all([
        firmaSaliente ? uploadSignature(folio, 'conductor_saliente', firmaSaliente) : Promise.resolve(''),
        firmaEntrante ? uploadSignature(folio, 'conductor_entrante', firmaEntrante) : Promise.resolve(''),
      ]);
      
      // Evaluar si se deben generar novedades automáticas para Calidad / Transporte
      const novedadesParaCrear: Novedad[] = [];

      if (checklist.cinturonConductor === 'No Operativo' || checklist.cinturonCopiloto === 'No Operativo') {
        novedadesParaCrear.push({
          id: `nov-${Date.now()}-cinturon`,
          turnoId: folio,
          folioTurno: folio,
          patente: selectedPatente,
          tipoOrigen: 'conductor',
          categoria: 'mecanica',
          itemAfectado: 'Cinturones de Seguridad Cabina Conductor',
          descripcion: `Cinturón no operativo: Conductor (${checklist.cinturonConductor}), Copiloto (${checklist.cinturonCopiloto}).`,
          criticidad: 'alta',
          estado: 'pendiente',
          reportadoPor: nombreSaliente,
          reportadoEn: now,
          asignadoA: 'transporte'
        });
      }

      if (checklist.nivelAceite === 'Critico' || checklist.nivelAceite === 'Bajo') {
        novedadesParaCrear.push({
          id: `nov-${Date.now()}-1`,
          turnoId: folio,
          folioTurno: folio,
          patente: selectedPatente,
          tipoOrigen: 'conductor',
          categoria: 'mecanica',
          itemAfectado: 'Nivel de Aceite de Motor',
          descripcion: `Nivel de aceite detectado en estado: ${checklist.nivelAceite}. Requiere inspección/relleno inmediato.`,
          criticidad: checklist.nivelAceite === 'Critico' ? 'critica' : 'media',
          estado: 'pendiente',
          reportadoPor: nombreSaliente,
          reportadoEn: now,
          asignadoA: 'transporte'
        });
      }

      if (checklist.estadoNeumaticos === 'Malo') {
        novedadesParaCrear.push({
          id: `nov-${Date.now()}-2`,
          turnoId: folio,
          folioTurno: folio,
          patente: selectedPatente,
          tipoOrigen: 'conductor',
          categoria: 'mecanica',
          itemAfectado: 'Neumáticos',
          descripcion: 'Estado de neumáticos reportado en estado Malo. Riesgo en traslados de urgencia.',
          criticidad: 'alta',
          estado: 'pendiente',
          reportadoPor: nombreSaliente,
          reportadoEn: now,
          asignadoA: 'transporte'
        });
      }

      if (checklist.lucesBalizasSirena === 'No Operativo') {
        novedadesParaCrear.push({
          id: `nov-${Date.now()}-3`,
          turnoId: folio,
          folioTurno: folio,
          patente: selectedPatente,
          tipoOrigen: 'conductor',
          categoria: 'mecanica',
          itemAfectado: 'Luces de Emergencia / Balizas / Sirena',
          descripcion: 'Sistema de señales sonoras o luminosas no operativo.',
          criticidad: 'alta',
          estado: 'pendiente',
          reportadoPor: nombreSaliente,
          reportadoEn: now,
          asignadoA: 'transporte'
        });
      }

      if (!checklist.exteriorLimpioSinDano && obsSaliente) {
        novedadesParaCrear.push({
          id: `nov-${Date.now()}-4`,
          turnoId: folio,
          folioTurno: folio,
          patente: selectedPatente,
          tipoOrigen: 'conductor',
          categoria: 'carroceria',
          itemAfectado: 'Carrocería / Daño exterior',
          descripcion: `Daño reportado: ${obsSaliente}`,
          criticidad: 'media',
          estado: 'pendiente',
          reportadoPor: nombreSaliente,
          reportadoEn: now,
          asignadoA: 'transporte'
        });
      }

      // Guardar Novedades generadas
      for (const nov of novedadesParaCrear) {
        await saveNovedad(nov);
      }

      // Guardar el turno consolidado
      const nuevoTurno: TurnoEntrega = {
        id: folio,
        codigoFolio: folio,
        patente: selectedPatente,
        fecha: now,
        turnoTipo: turnoTipo,
        kilometraje: Number(kilometraje),
        estado: novedadesParaCrear.length > 0 ? 'con_novedades' : 'pendiente_tens',
        conductorSaliente: {
          nombre: nombreSaliente,
          rut: rutSaliente,
          firmaUrl: urlSaliente,
          fechaHora: now
        },
        conductorEntrante: {
          nombre: nombreEntrante,
          rut: rutEntrante,
          firmaUrl: urlEntrante,
          fechaHora: now
        },
        observacionesConductorSaliente: obsSaliente,
        observacionesConductorEntrante: obsEntrante,
        checklistConductor: checklist,
        creadoEn: now,
        actualizadoEn: now,
        creadoPor: currentUser?.nombre || nombreSaliente
      };

      await saveTurno(nuevoTurno);
      setSuccessMessage(`Turno ${folio} registrado con éxito. Se guardó el check mecánico y las firmas digitales.`);
      
      // Reset firmas y observaciones
      setFirmaSaliente('');
      setFirmaEntrante('');
      setObsSaliente('');
      setObsEntrante('');
    } catch (err: any) {
      setErrorMessage(err.message || "Error al registrar la entrega de turno.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-200 text-xs font-semibold mb-2">
            <Truck className="w-4 h-4" /> Módulo Exclusivo Conductores
          </div>
          <h2 className="text-2xl font-black">Entrega y Recepción de Turno - Conductor</h2>
          <p className="text-sm text-sky-200/80 mt-1">
            Pauta de Mantenimiento Preventivo (Hospital de Villarrica)
          </p>
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
        {/* Identificación del Móvil y Turno */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Gauge className="w-5 h-5 text-sky-600" />
            1. Identificación del Móvil y Horario
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Placa Patente del Móvil
              </label>
              <select
                value={selectedPatente}
                onChange={e => handlePatenteChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-sm font-bold bg-white text-slate-800"
              >
                {ambulancias.map(a => (
                  <option key={a.patente} value={a.patente}>
                    {a.patente} - {a.nombreMovil} ({a.modelo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kilometraje de Recepción
              </label>
              <input
                type="number"
                required
                value={kilometraje}
                onChange={e => setKilometraje(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-sm font-semibold bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tipo de Turno
              </label>
              <select
                value={turnoTipo}
                onChange={e => setTurnoTipo(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-sm font-semibold bg-white text-slate-800"
              >
                <option value="Día (08:00 - 20:00)">Día (08:00 - 20:00)</option>
                <option value="Noche (20:00 - 08:00)">Noche (20:00 - 08:00)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sección: Lista de Chequeo de Fijaciones */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-sky-600" />
            2. Lista de Chequeo de Fijaciones
          </h3>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-sky-800">
              Cinturones de Seguridad Asientos Cabina Conductor
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200">
                <span>Cinturón Asiento Conductor:</span>
                <select
                  value={checklist.cinturonConductor}
                  onChange={e => setChecklist({ ...checklist, cinturonConductor: e.target.value as any })}
                  className="px-2.5 py-1 rounded border border-slate-300 bg-white font-medium text-slate-800"
                >
                  <option value="Operativo">Operativo</option>
                  <option value="No Operativo">No Operativo</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200">
                <span>Cinturón Asiento Copiloto:</span>
                <select
                  value={checklist.cinturonCopiloto}
                  onChange={e => setChecklist({ ...checklist, cinturonCopiloto: e.target.value as any })}
                  className="px-2.5 py-1 rounded border border-slate-300 bg-white font-medium text-slate-800"
                >
                  <option value="Operativo">Operativo</option>
                  <option value="No Operativo">No Operativo</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Documentación y Bitácora */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-sky-600" />
            3. Documentación y Verificaciones Administrativas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.permisoCirculacion}
                onChange={e => setChecklist({ ...checklist, permisoCirculacion: e.target.checked })}
                className="w-5 h-5 text-sky-600 rounded"
              />
              <span className="text-xs font-semibold text-slate-700">Permiso de Circulación Vigente</span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.revisionTecnica}
                onChange={e => setChecklist({ ...checklist, revisionTecnica: e.target.checked })}
                className="w-5 h-5 text-sky-600 rounded"
              />
              <span className="text-xs font-semibold text-slate-700">Revisión Técnica al Día</span>
            </label>

            <div className="p-3 rounded-xl border border-slate-200">
              <span className="block text-xs font-bold text-slate-600 mb-1">Tarjeta de Combustible</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="tarjetaCombustible"
                    value="Si"
                    checked={checklist.tarjetaCombustible === 'Si'}
                    onChange={() => setChecklist({ ...checklist, tarjetaCombustible: 'Si' })}
                  /> Sí
                </label>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="tarjetaCombustible"
                    value="No"
                    checked={checklist.tarjetaCombustible === 'No'}
                    onChange={() => setChecklist({ ...checklist, tarjetaCombustible: 'No' })}
                  /> No
                </label>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200">
              <span className="block text-xs font-bold text-slate-600 mb-1">Bitácora del Móvil al Día</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="bitacoraMovil"
                    value="Si"
                    checked={checklist.bitacoraMovil === 'Si'}
                    onChange={() => setChecklist({ ...checklist, bitacoraMovil: 'Si' })}
                  /> Sí
                </label>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="bitacoraMovil"
                    value="No"
                    checked={checklist.bitacoraMovil === 'No'}
                    onChange={() => setChecklist({ ...checklist, bitacoraMovil: 'No' })}
                  /> No
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Niveles y Fluidos */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Wrench className="w-5 h-5 text-sky-600" />
            4. Control de Fluidos y Niveles Técnico-Mecánicos
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Nivel de Aceite de Motor</label>
              <select
                value={checklist.nivelAceite}
                onChange={e => setChecklist({ ...checklist, nivelAceite: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="Normal">Normal (Entre Min y Max)</option>
                <option value="Bajo">Bajo (Requiere Relleno)</option>
                <option value="Critico">Crítico (Bajo el Mínimo)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Nivel de Agua / Refrigerante</label>
              <select
                value={checklist.nivelAguaRefrigerante}
                onChange={e => setChecklist({ ...checklist, nivelAguaRefrigerante: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="Normal">Normal</option>
                <option value="Bajo">Bajo</option>
                <option value="Critico">Crítico</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Nivel Combustible</label>
              <select
                value={checklist.nivelCombustible}
                onChange={e => setChecklist({ ...checklist, nivelCombustible: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="Lleno">Lleno (Óptimo)</option>
                <option value="3/4">3/4 de Estanque</option>
                <option value="1/2">1/2 de Estanque</option>
                <option value="1/4">1/4 (Requiere Carga Inmediata)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Líquido de Frenos</label>
              <select
                value={checklist.nivelLiquidoFrenos}
                onChange={e => setChecklist({ ...checklist, nivelLiquidoFrenos: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="Normal">Normal</option>
                <option value="Bajo">Bajo</option>
                <option value="Critico">Crítico</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Líquido Dirección Hidráulica</label>
              <select
                value={checklist.nivelLiquidoDireccion}
                onChange={e => setChecklist({ ...checklist, nivelLiquidoDireccion: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="Normal">Normal</option>
                <option value="Bajo">Bajo</option>
                <option value="Critico">Crítico</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Estado de Baterías / Carga</label>
              <select
                value={checklist.sistemaCargaBaterias}
                onChange={e => setChecklist({ ...checklist, sistemaCargaBaterias: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="Bueno">Bueno (Carga y arranque OK)</option>
                <option value="Regular">Regular</option>
                <option value="Malo">Malo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sección: Neumáticos, Luces y Seguridad */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-sky-600" />
            5. Estado Mecánico Exterior, Luces, Neumáticos y Herramientas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Estado de Neumáticos</label>
              <select
                value={checklist.estadoNeumaticos}
                onChange={e => setChecklist({ ...checklist, estadoNeumaticos: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="Bueno">Bueno</option>
                <option value="Regular">Regular</option>
                <option value="Malo">Malo (Genera Novedad Inmediata)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Luces, Balizas y Sirenas</label>
              <select
                value={checklist.lucesBalizasSirena}
                onChange={e => setChecklist({ ...checklist, lucesBalizasSirena: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="Operativo">Operativo (Todo Conforme)</option>
                <option value="No Operativo">No Operativo (Falla)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Testigos en Tablero</label>
              <select
                value={checklist.testigosTablero}
                onChange={e => setChecklist({ ...checklist, testigosTablero: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="Normal">Normal (Sin alertas encendidas)</option>
                <option value="Alerta">Alerta Encendida (Check Engine/ABS/etc)</option>
              </select>
            </div>
          </div>

          {/* Checklist de Herramientas Obligatorias */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.gataElevadora}
                onChange={e => setChecklist({ ...checklist, gataElevadora: e.target.checked })}
                className="w-4 h-4 text-sky-600 rounded"
              /> Gata Elevadora
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.juegoLlaves}
                onChange={e => setChecklist({ ...checklist, juegoLlaves: e.target.checked })}
                className="w-4 h-4 text-sky-600 rounded"
              /> Juego de Llaves
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.juegoTriangulos}
                onChange={e => setChecklist({ ...checklist, juegoTriangulos: e.target.checked })}
                className="w-4 h-4 text-sky-600 rounded"
              /> Triángulos
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.chalecoReflectante}
                onChange={e => setChecklist({ ...checklist, chalecoReflectante: e.target.checked })}
                className="w-4 h-4 text-sky-600 rounded"
              /> Chaleco Reflectante
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.exteriorLimpioSinDano}
                onChange={e => setChecklist({ ...checklist, exteriorLimpioSinDano: e.target.checked })}
                className="w-4 h-4 text-sky-600 rounded"
              /> Exterior Limpio y sin Daño
            </label>
          </div>
        </div>

        {/* Sección: Firmas y Observaciones (Doble Validación Saliente y Entrante) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            6. Validación Formal y Firmas Digitales de Ambos Conductores
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Conductor Saliente */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Conductor que Entrega el Turno (Saliente)
                </label>
                <select
                  value={nombreSaliente}
                  onChange={e => handleSalienteSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold bg-white"
                >
                  <option value="">Seleccione conductor saliente...</option>
                  {conductores.map(c => (
                    <option key={c.rut} value={c.nombre}>
                      {c.nombre} ({c.rut})
                    </option>
                  ))}
                  {conductores.length === 0 && (
                    <option value="" disabled>No hay conductores registrados aún por Transporte</option>
                  )}
                </select>
                {conductores.length === 0 && (
                  <div className="mt-2 space-y-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <label className="block text-[11px] font-semibold text-slate-600">O ingrese nombre y RUT manualmente:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nombre completo"
                        value={nombreSaliente}
                        onChange={e => setNombreSaliente(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="RUT (ej: 12.345.678-9)"
                        value={rutSaliente}
                        onChange={e => setRutSaliente(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Observaciones Turno Saliente</label>
                <textarea
                  rows={2}
                  value={obsSaliente}
                  onChange={e => setObsSaliente(e.target.value)}
                  placeholder="Detallar cualquier observación mecánica, novedades de ruta o carrocería..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <SignaturePad
                label="Firma Conductor Saliente"
                funcionarioNombre={nombreSaliente}
                funcionarioRut={rutSaliente}
                onSave={setFirmaSaliente}
                savedSignature={firmaSaliente}
              />
            </div>

            {/* Conductor Entrante */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Conductor que Recibe el Turno (Entrante)
                </label>
                <select
                  value={nombreEntrante}
                  onChange={e => handleEntranteSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold bg-white"
                >
                  <option value="">Seleccione conductor entrante...</option>
                  {conductores.map(c => (
                    <option key={c.rut} value={c.nombre}>
                      {c.nombre} ({c.rut})
                    </option>
                  ))}
                  {conductores.length === 0 && (
                    <option value="" disabled>No hay conductores registrados aún por Transporte</option>
                  )}
                </select>
                {conductores.length === 0 && (
                  <div className="mt-2 space-y-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <label className="block text-[11px] font-semibold text-slate-600">O ingrese nombre y RUT manualmente:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nombre completo"
                        value={nombreEntrante}
                        onChange={e => setNombreEntrante(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="RUT (ej: 12.345.678-9)"
                        value={rutEntrante}
                        onChange={e => setRutEntrante(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Observaciones Turno Entrante</label>
                <textarea
                  rows={2}
                  value={obsEntrante}
                  onChange={e => setObsEntrante(e.target.value)}
                  placeholder="Observaciones de recepción o conformidad..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <SignaturePad
                label="Firma Conductor Entrante"
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
            className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-bold rounded-xl shadow-lg shadow-sky-600/25 transition-all text-sm disabled:opacity-50"
          >
            <Check className="w-5 h-5" />
            <span>{isSubmitting ? "Registrando Entrega..." : "Registrar Entrega de Turno Conductor"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
