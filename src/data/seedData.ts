import { AppUser, Ambulancia } from '../types';

// Listas de personal gestionadas oficialmente por la Encargada de Transporte en el sistema
export const CONDUCTORES_DEFAULT: { rut: string; nombre: string; email: string }[] = [];

export const TENS_DEFAULT: { rut: string; nombre: string; email: string }[] = [];

export const DEFAULT_HASH_123456 = "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92";

export const USUARIOS_INICIALES: AppUser[] = [];

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
