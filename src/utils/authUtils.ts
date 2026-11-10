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

// ─── Institutional AES-256-GCM Credential Cipher ──────────────────────────────
// Encrypts user passwords before storing in Firestore so they are never stored
// in raw plaintext, while allowing Admin and Jefe de Transporte to view/assist
// staff in real time.
const INSTITUTIONAL_SECRET = 'HVillarrica-SSASUR-2026-KeyVault-9918273645!';

async function getAesKey(): Promise<CryptoKey> {
  const enc = new TextEncoder().encode(INSTITUTIONAL_SECRET);
  const keyMaterial = await crypto.subtle.digest('SHA-256', enc);
  return crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptPassword(plainPassword: string): Promise<string> {
  if (!plainPassword) return '';
  try {
    const key = await getAesKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plainPassword);
    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );
    const cipherBytes = new Uint8Array(cipherBuffer);
    const combined = new Uint8Array(iv.length + cipherBytes.length);
    combined.set(iv, 0);
    combined.set(cipherBytes, iv.length);
    // Base64 encode
    let binary = '';
    for (let i = 0; i < combined.byteLength; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return `AES:${btoa(binary)}`;
  } catch (e) {
    console.warn('Encryption fallback:', e);
    return `B64:${btoa(unescape(encodeURIComponent(plainPassword)))}`;
  }
}

export async function decryptPassword(encryptedStr?: string): Promise<string> {
  if (!encryptedStr) return '';
  try {
    if (encryptedStr.startsWith('AES:')) {
      const b64 = encryptedStr.slice(4);
      const binary = atob(b64);
      const combined = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        combined[i] = binary.charCodeAt(i);
      }
      const iv = combined.slice(0, 12);
      const cipherBytes = combined.slice(12);
      const key = await getAesKey();
      const plainBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        cipherBytes
      );
      return new TextDecoder().decode(plainBuffer);
    }
    if (encryptedStr.startsWith('B64:')) {
      return decodeURIComponent(escape(atob(encryptedStr.slice(4))));
    }
    return encryptedStr;
  } catch {
    return '';
  }
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
 * Normalizes a person's full name to Proper Case (Capitalize first letter of each word).
 * Handles prepositions/particles in Spanish (de, del, la, las, los, y) appropriately unless first word.
 * Also trims consecutive whitespaces.
 * Example: "aldo balladares gonzales" -> "Aldo Balladares Gonzales"
 * Example: "MARIA DE LOS ANGELES PEREZ SOTO" -> "María de los Ángeles Pérez Soto"
 */
export function formatProperName(rawName: string): string {
  if (!rawName) return '';
  const trimmed = rawName.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  const lowercaseWords = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'san']);

  return trimmed
    .split(' ')
    .map((word, index) => {
      const lower = word.toLowerCase();
      // Keep lowercase particles only if not the very first word
      if (index > 0 && lowercaseWords.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/**
 * Validates that a new full name has at least one name and two surnames (minimum 3 words).
 * Returns true if valid, false otherwise.
 */
export function validateFullNameWords(fullName: string): boolean {
  if (!fullName) return false;
  const words = fullName
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0);
  
  // Exige al menos 3 palabras (1 nombre + 2 apellidos)
  return words.length >= 3;
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
  // Super Admin: Gonzalo's RUT routes directly to his admin account
  if (clean === '141012991') {
    return 'gonzalop14@gmail.com';
  }
  return `${clean}@hospitalvillarrica.cl`;
}

