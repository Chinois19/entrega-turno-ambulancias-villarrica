import { AppUser, Ambulancia } from '../types';

// Conductores oficiales obtenidos del REDCap oficial del Hospital de Villarrica
export const CONDUCTORES_DEFAULT: { rut: string; nombre: string; email: string }[] = [
  { rut: "11.111.111-1", nombre: "Víctor Lazo Esparza", email: "vlazo@hospitalvillarrica.cl" },
  { rut: "12.222.222-2", nombre: "Gerard Gatica Bustos", email: "ggatica@hospitalvillarrica.cl" },
  { rut: "13.333.333-3", nombre: "Aldo Balladares Gonzales", email: "aballadares@hospitalvillarrica.cl" },
  { rut: "14.444.444-4", nombre: "Franklin Molina Berrios", email: "fmolina@hospitalvillarrica.cl" },
  { rut: "15.555.555-5", nombre: "Rony Vera Villagran", email: "rvera@hospitalvillarrica.cl" },
  { rut: "16.666.666-6", nombre: "Daniel San Martín San Martin", email: "dsanmartin@hospitalvillarrica.cl" },
  { rut: "17.777.777-7", nombre: "Jonathan Cabezas Lagos", email: "jcabezas@hospitalvillarrica.cl" },
  { rut: "18.888.888-8", nombre: "Javier Manosalva Barbett", email: "jmanosalva@hospitalvillarrica.cl" },
  { rut: "19.999.999-9", nombre: "José San Martín Calderón", email: "jsanmartin@hospitalvillarrica.cl" },
  { rut: "10.123.456-7", nombre: "Mario Garrido Albarran", email: "mgarrido@hospitalvillarrica.cl" },
  { rut: "11.234.567-8", nombre: "Manuel Cabezas Lagos", email: "mcabezas@hospitalvillarrica.cl" },
  { rut: "12.345.678-9", nombre: "Pablo Ulloa Mansilla", email: "pulloa@hospitalvillarrica.cl" },
  { rut: "13.456.789-0", nombre: "Miguel Mendoza Burgos", email: "mmendoza@hospitalvillarrica.cl" },
  { rut: "14.567.890-1", nombre: "Luis Carter Lillo", email: "lcarter@hospitalvillarrica.cl" },
  { rut: "15.678.901-2", nombre: "Bladimir Salas Frey", email: "bsalas@hospitalvillarrica.cl" },
  { rut: "16.789.012-3", nombre: "Andrés Cartagena Roa", email: "acartagena@hospitalvillarrica.cl" },
  { rut: "17.890.123-4", nombre: "Cesar Iluffi Olivares", email: "ciluffi@hospitalvillarrica.cl" },
  { rut: "18.901.234-5", nombre: "Francisco Molina Valenzuela", email: "fmolinav@hospitalvillarrica.cl" },
  { rut: "19.012.345-6", nombre: "Luis Cava Carinao", email: "lcava@hospitalvillarrica.cl" },
];

export const TENS_DEFAULT: { rut: string; nombre: string; email: string }[] = [
  { rut: "12.876.543-2", nombre: "Camila Andrea Soto Morales", email: "csoto@hospitalvillarrica.cl" },
  { rut: "14.987.654-3", nombre: "Rodrigo Ignacio Palma Reyes", email: "rpalma@hospitalvillarrica.cl" },
  { rut: "16.543.210-9", nombre: "Valentina Paz Riquelme Sepúlveda", email: "vriquelme@hospitalvillarrica.cl" },
  { rut: "17.654.321-8", nombre: "Esteban Gonzalo Carrillo Vera", email: "ecarrillo@hospitalvillarrica.cl" },
  { rut: "15.321.654-7", nombre: "Margarita Elena Fuentes Torres", email: "mfuentes@hospitalvillarrica.cl" },
];

// Hash SHA-256 de "123456" para entorno inicial demo/provisorio
// echo -n "123456" | sha256sum -> 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92
export const DEFAULT_HASH_123456 = "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92";

export const USUARIOS_INICIALES: AppUser[] = [
  // Administrador / Calidad
  {
    id: "calidad-1",
    rut: "9.999.999-9",
    nombre: "Dra. Marcela Lagos (Encargada de Calidad)",
    email: "calidad@hospitalvillarrica.cl",
    rol: "calidad",
    cargo: "Encargada de Calidad y Acreditación",
    passwordHash: DEFAULT_HASH_123456,
    isTemporaryPassword: false,
    activo: true,
    creadoEn: "2026-01-01T00:00:00Z"
  },
  // Encargado de Transporte
  {
    id: "transporte-1",
    rut: "8.888.888-8",
    nombre: "Roberto Zambrano (Jefe de Movilización)",
    email: "transporte@hospitalvillarrica.cl",
    rol: "transporte",
    cargo: "Jefe Unidad de Transporte y Parque Automotriz",
    passwordHash: DEFAULT_HASH_123456,
    isTemporaryPassword: false,
    activo: true,
    creadoEn: "2026-01-01T00:00:00Z"
  },
  // Conductor Demo
  {
    id: "cond-1",
    rut: "11.111.111-1",
    nombre: "Víctor Lazo Esparza",
    email: "vlazo@hospitalvillarrica.cl",
    rol: "conductor",
    cargo: "Conductor de Ambulancia SAMU / Traslado",
    passwordHash: DEFAULT_HASH_123456,
    isTemporaryPassword: true, // Demostración de skill de cambio de clave obligatoria
    activo: true,
    creadoEn: "2026-01-01T00:00:00Z"
  },
  // TENS Demo
  {
    id: "tens-1",
    rut: "12.876.543-2",
    nombre: "Camila Andrea Soto Morales",
    email: "csoto@hospitalvillarrica.cl",
    rol: "tens",
    cargo: "TENS Clínico de Móvil de Traslado",
    passwordHash: DEFAULT_HASH_123456,
    isTemporaryPassword: false,
    activo: true,
    creadoEn: "2026-01-01T00:00:00Z"
  }
];

// Flota de ambulancias del Hospital de Villarrica (del REDCap oficial)
export const AMBULANCIAS_INICIALES: Ambulancia[] = [
  {
    id: "HKRC-84",
    patente: "HKRC-84",
    nombreMovil: "Móvil 1 - SAMU Avanzada",
    marca: "Mercedes-Benz",
    modelo: "Sprinter 415 CDI",
    anio: 2021,
    fechaEnrolamiento: "2021-03-15",
    kilometrajeActual: 118450,
    estado: "operativa",
    proximoMantenimientoKm: 120000,
    proximoMantenimientoFecha: "2026-10-15",
    tallerAsignado: "Kaufmann Temuco"
  },
  {
    id: "HXRP-19",
    patente: "HXRP-19",
    nombreMovil: "Móvil 2 - SAMU Básica",
    marca: "Peugeot",
    modelo: "Boxer 2.2 HDi",
    anio: 2020,
    fechaEnrolamiento: "2020-08-10",
    kilometrajeActual: 149800,
    estado: "operativa",
    proximoMantenimientoKm: 150000, // Cerca del mantenimiento (Alerta preventiva!)
    proximoMantenimientoFecha: "2026-09-28",
    tallerAsignado: "Taller Central SSASUR"
  },
  {
    id: "PHGS-31",
    patente: "PHGS-31",
    nombreMovil: "Móvil 3 - Respaldo Urgencia",
    marca: "Ford",
    modelo: "Transit 350L",
    anio: 2022,
    fechaEnrolamiento: "2022-05-20",
    kilometrajeActual: 72300,
    estado: "operativa",
    proximoMantenimientoKm: 80000,
    proximoMantenimientoFecha: "2026-12-01",
    tallerAsignado: "Gildemeister"
  },
  {
    id: "FLJW-90",
    patente: "FLJW-90",
    nombreMovil: "Móvil 4 - Transporte Pacientes",
    marca: "Mercedes-Benz",
    modelo: "Sprinter 314",
    anio: 2019,
    fechaEnrolamiento: "2019-11-05",
    kilometrajeActual: 215300,
    estado: "en_mantencion",
    proximoMantenimientoKm: 215000,
    proximoMantenimientoFecha: "2026-09-20",
    tallerAsignado: "Taller Automotriz Villarrica",
    observaciones: "En cambio de pastillas y discos de frenos"
  },
  {
    id: "HZGX-65",
    patente: "HZGX-65",
    nombreMovil: "Móvil 5 - SAMU Avanzada II",
    marca: "Mercedes-Benz",
    modelo: "Sprinter 516 CDI",
    anio: 2023,
    fechaEnrolamiento: "2023-01-18",
    kilometrajeActual: 45200,
    estado: "operativa",
    proximoMantenimientoKm: 50000,
    proximoMantenimientoFecha: "2026-11-10"
  },
  {
    id: "LPCT-53",
    patente: "LPCT-53",
    nombreMovil: "Móvil 6 - Traslado Crítico",
    marca: "Iveco",
    modelo: "Daily 50C17",
    anio: 2021,
    fechaEnrolamiento: "2021-09-02",
    kilometrajeActual: 89600,
    estado: "operativa",
    proximoMantenimientoKm: 90000,
    proximoMantenimientoFecha: "2026-10-05"
  },
  {
    id: "LWDD-19",
    patente: "LWDD-19",
    nombreMovil: "Móvil 7 - Diálisis / Ambulatorio",
    marca: "Peugeot",
    modelo: "Expert Combi",
    anio: 2022,
    fechaEnrolamiento: "2022-04-12",
    kilometrajeActual: 61400,
    estado: "operativa",
    proximoMantenimientoKm: 70000,
    proximoMantenimientoFecha: "2026-11-30"
  },
  {
    id: "TDPR-33",
    patente: "TDPR-33",
    nombreMovil: "Móvil 8 - SAMU Avanzada III",
    marca: "Mercedes-Benz",
    modelo: "Sprinter 416",
    anio: 2024,
    fechaEnrolamiento: "2024-02-14",
    kilometrajeActual: 28900,
    estado: "operativa",
    proximoMantenimientoKm: 30000,
    proximoMantenimientoFecha: "2026-10-22"
  },
  {
    id: "VDHP-32",
    patente: "VDHP-32",
    nombreMovil: "Móvil 9 - Respaldo Rural",
    marca: "Toyota",
    modelo: "Hiace 2.8 TD",
    anio: 2024,
    fechaEnrolamiento: "2024-06-01",
    kilometrajeActual: 14200,
    estado: "operativa",
    proximoMantenimientoKm: 20000,
    proximoMantenimientoFecha: "2026-12-15"
  },
  {
    id: "VDHP-33",
    patente: "VDHP-33",
    nombreMovil: "Móvil 10 - Red Araucanía Sur",
    marca: "Toyota",
    modelo: "Hiace 2.8 TD",
    anio: 2024,
    fechaEnrolamiento: "2024-06-01",
    kilometrajeActual: 15100,
    estado: "operativa",
    proximoMantenimientoKm: 20000,
    proximoMantenimientoFecha: "2026-12-15"
  }
];
