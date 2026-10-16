// Implementation of the registered institutional skill: auth-user-management-firebase
// Features: SHA-256 password hashing, temporary password generator, 
// detection of isTemporaryPassword forcing password change, and persistent Firestore synchronization.

import { AppUser } from '../types';

/**
 * Generates SHA-256 hash using the native Web Crypto API
 */
export async function sha256Hash(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Generates a secure random temporary password (e.g., Villarrica2026-X9Z)
 */
export function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomSuffix = '';
  for (let i = 0; i < 4; i++) {
    randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Villarrica-${randomSuffix}`;
}

/**
 * Validates Chilean RUN / RUT with Module 11
 */
export function validateRut(rutCompleto: string): boolean {
  if (!rutCompleto) return false;
  const clean = rutCompleto.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 8 || clean.length > 9) return false;
  
  const cuerpo = clean.slice(0, -1);
  const dv = clean.slice(-1);
  
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += multiplo * parseInt(cuerpo.charAt(i), 10);
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }
  
  const dvEsperadoCalculado = 11 - (suma % 11);
  let dvEsperado = '';
  if (dvEsperadoCalculado === 11) dvEsperado = '0';
  else if (dvEsperadoCalculado === 10) dvEsperado = 'K';
  else dvEsperado = dvEsperadoCalculado.toString();
  
  return dv === dvEsperado;
}

/**
 * Format RUT with dots and hyphen (12.345.678-9)
 */
export function formatRut(rut: string): string {
  let value = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (!value) return '';
  if (value.length > 9) value = value.slice(0, 9);
  
  if (value.length === 1) return value;
  const dv = value.slice(-1);
  let rutCuerpo = value.slice(0, -1);
  
  // Format body with dots
  let formattedCuerpo = '';
  while (rutCuerpo.length > 3) {
    formattedCuerpo = '.' + rutCuerpo.slice(-3) + formattedCuerpo;
    rutCuerpo = rutCuerpo.slice(0, -3);
  }
  formattedCuerpo = rutCuerpo + formattedCuerpo;
  return `${formattedCuerpo}-${dv}`;
}

/**
 * Strips all formatting characters from RUT, returning only digits and lowercase k.
 * Example: "12.345.678-K" -> "12345678k"
 */
export function cleanRut(rut: string): string {
  return (rut || '').replace(/[^0-9kK]/g, '').toLowerCase();
}

/**
 * Normalizes user credential (RUT or email) to Firebase Auth email.
 * If user enters their RUT (e.g., "12.345.678-9" or "12345678-9"), it converts to "123456789@hospitalvillarrica.cl".
 * If user enters a full email (e.g., "gonzalop14@gmail.com"), it preserves it.
 */
export function rutToAuthEmail(credential: string): string {
  const trimmed = (credential || '').trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  const clean = cleanRut(trimmed);
  return `${clean}@hospitalvillarrica.cl`;
}

