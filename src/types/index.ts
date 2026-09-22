export type UserRole = 'conductor' | 'tens' | 'calidad' | 'transporte' | 'admin';

export interface AppUser {
  id: string; // rut or uid
  nombre: string;
  rut: string;
  email: string;
  rol: UserRole;
  cargo?: string;
  passwordHash: string;
  isTemporaryPassword?: boolean;
  activo: boolean;
  creadoEn: string;
  ultimoAcceso?: string;
}

export interface Ambulancia {
  id: string; // Patente
  patente: string;
  nombreMovil: string; // ej: Móvil 1 - SAMU Avanzada
  modelo: string; // ej: Mercedes Benz Sprinter 415 CDI
  marca: string;
  anio: number;
  fechaEnrolamiento: string;
  kilometrajeActual: number;
  estado: 'operativa' | 'en_mantencion' | 'fuera_servicio';
  proximoMantenimientoKm: number;
  proximoMantenimientoFecha: string;
  tallerAsignado?: string;
  observaciones?: string;
}

export interface SignatureData {
  nombre: string;
  rut: string;
  firmaUrl: string; // Base64 data URL
  fechaHora: string;
}

// Conductores: REDCap + Pauta Preventiva
export interface ChecklistConductor {
  // Documentación (REDCap)
  permisoCirculacion: boolean;
  revisionTecnica: boolean;
  tarjetaCombustible: 'Si' | 'No';
  bitacoraMovil: 'Si' | 'No';

  // Niveles & Fluidos (REDCap + Pauta)
  nivelAceite: 'Normal' | 'Bajo' | 'Critico';
  nivelAguaRefrigerante: 'Normal' | 'Bajo' | 'Critico';
  nivelLiquidoFrenos: 'Normal' | 'Bajo' | 'Critico';
  nivelLiquidoDireccion: 'Normal' | 'Bajo' | 'Critico';
  nivelCombustible: '1/4' | '1/2' | '3/4' | 'Lleno';

  // Exterior & Mecánica (REDCap + Pauta)
  estadoNeumaticos: 'Bueno' | 'Regular' | 'Malo';
  presionNeumaticos: boolean; // Pauta
  estadoPlumillas: 'Bueno' | 'Regular' | 'Malo';
  limpiaparabrisasLuneta: boolean; // Pauta
  exteriorLimpioSinDano: boolean;
  pastillasDiscosFrenos: 'Bueno' | 'Regular' | 'Malo';

  // Sistema Eléctrico & Luces (Pauta)
  lucesBalizasSirena: 'Operativo' | 'No Operativo';
  testigosTablero: 'Normal' | 'Alerta';
  sistemaCargaBaterias: 'Bueno' | 'Regular' | 'Malo';

  // Herramientas & Seguridad (REDCap)
  gataElevadora: boolean;
  juegoLlaves: boolean;
  juegoTriangulos: boolean;
  chalecoReflectante: boolean;
  ruedaRepuesto: boolean;

  // Pruebas y Generales (Pauta)
  pruebaRutaOk: boolean;
  lubricacionPuertasOk: boolean;
}

// TENS: Hoja Fijaciones Cabina Sanitaria + Equipos
export interface ChecklistTens {
  // Cabina delantera
  cinturonConductor: 'Operativo' | 'No Operativo';
  cinturonCopiloto: 'Operativo' | 'No Operativo';

  // Camilla y Sujeción
  camillaSujecionSuperior: 'Operativo' | 'No Operativo';
  camillaSujecionMedio: 'Operativo' | 'No Operativo';
  camillaSujecionInferior: 'Operativo' | 'No Operativo';
  camillaAnclajePiso: 'Operativo' | 'No Operativo';

  // Asientos Cabina Sanitaria
  cinturonAsientoCabecera: 'Operativo' | 'No Operativo';
  cinturonAsientosLaterales: 'Operativo' | 'No Operativo';

  // Equipamiento Especial
  sillaRuedasAnclaje: 'Operativo' | 'No Operativo' | 'No Aplica';
  incubadoraAnclaje: 'Operativo' | 'No Operativo' | 'No Aplica';

  // Sistemas de Fijación Equipos Médicos Críticos
  fijacionBombaInfusion: 'Operativo' | 'No Operativo' | 'No Aplica';
  fijacionDesfibrilador: 'Operativo' | 'No Operativo' | 'No Aplica';
  fijacionMonitorSignos: 'Operativo' | 'No Operativo' | 'No Aplica';
  fijacionBombaAspiracion: 'Operativo' | 'No Operativo' | 'No Aplica';

  // Estado Sanitario
  gavetasAlmacenamiento: 'Operativo' | 'No Operativo';
  cabinaLimpiaDesinfectada: boolean;
  oxigenoCilindroLleno: boolean;
}

export interface TurnoEntrega {
  id: string;
  codigoFolio: string;
  patente: string;
  fecha: string;
  turnoTipo: 'Día (08:00 - 20:00)' | 'Noche (20:00 - 08:00)';
  kilometraje: number;
  
  // Estado global de la entrega
  estado: 'pendiente_tens' | 'pendiente_conductor' | 'completo' | 'con_novedades';

  // Módulo Conductor
  conductorSaliente?: SignatureData;
  conductorEntrante?: SignatureData;
  observacionesConductorSaliente?: string;
  observacionesConductorEntrante?: string;
  checklistConductor?: ChecklistConductor;

  // Módulo TENS
  tensSaliente?: SignatureData;
  tensEntrante?: SignatureData;
  observacionesTensSaliente?: string;
  observacionesTensEntrante?: string;
  checklistTens?: ChecklistTens;

  // Metadatos
  creadoEn: string;
  actualizadoEn: string;
  creadoPor: string;
}

export type CriticidadNovedad = 'baja' | 'media' | 'alta' | 'critica';
export type EstadoNovedad = 'pendiente' | 'en_evaluacion' | 'en_taller' | 'resuelta' | 'rechazada';
export type CategoriaNovedad = 'mecanica' | 'cabina_sanitaria' | 'equipamiento_biomedico' | 'documentacion' | 'carroceria';

export interface Novedad {
  id: string;
  turnoId: string;
  folioTurno: string;
  patente: string;
  tipoOrigen: 'conductor' | 'tens';
  categoria: CategoriaNovedad;
  itemAfectado: string;
  descripcion: string;
  criticidad: CriticidadNovedad;
  estado: EstadoNovedad;
  reportadoPor: string;
  reportadoEn: string;
  asignadoA?: 'calidad' | 'transporte';
  accionesRealizadas?: {
    fecha: string;
    usuario: string;
    comentario: string;
    nuevoEstado: EstadoNovedad;
  }[];
  resueltoPor?: string;
  resueltoEn?: string;
  resolucionFinal?: string;
}
