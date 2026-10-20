import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
  deleteDoc,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadString,
  getDownloadURL,
} from "firebase/storage";
import { db, storage } from "./config";
import { AppUser, Ambulancia, TurnoEntrega, Novedad } from "../types";
import { AMBULANCIAS_INICIALES } from "../data/seedData";

// ─── Type guard ───────────────────────────────────────────────────────────────
function isNonEmpty(val: unknown): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === "string") return val.trim().length > 0;
  return true;
}

// ─── Signature upload to Firebase Storage ─────────────────────────────────────
// Stores the base64 PNG in Storage and returns the public download URL.
// This keeps Firestore documents lean (no embedded large strings).
export async function uploadSignature(
  folioId: string,
  role: "conductor_saliente" | "conductor_entrante" | "tens_saliente" | "tens_entrante",
  base64DataUrl: string
): Promise<string> {
  if (!base64DataUrl || base64DataUrl.length < 50) return "";
  const path = `firmas/${folioId}/${role}.png`;
  const sRef = storageRef(storage, path);
  await uploadString(sRef, base64DataUrl, "data_url");
  return await getDownloadURL(sRef);
}

// ─── Seed ambulancias if empty ────────────────────────────────────────────────
export async function seedAmbulanciasIfEmpty(): Promise<void> {
  const snap = await getDocs(collection(db, "ambulancias"));
  if (!snap.empty) return;
  const batch = writeBatch(db);
  for (const amb of AMBULANCIAS_INICIALES) {
    batch.set(doc(db, "ambulancias", amb.patente), amb);
  }
  await batch.commit();
}

// ──────────────────────────────────────────────────────────────────────────────
// USUARIOS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Get all users from Firestore.
 * Auth context uses this to load profiles after Firebase Auth login.
 */
export async function getUsuarios(): Promise<AppUser[]> {
  const snap = await getDocs(collection(db, "usuarios"));
  return snap.docs.map((d) => d.data() as AppUser);
}

/**
 * Get a single user profile by Firebase Auth UID.
 */
export async function getUsuarioByUid(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "usuarios", uid));
  if (!snap.exists()) return null;
  return snap.data() as AppUser;
}

/**
 * Get a single user profile by email (for login fallback lookup).
 */
export async function getUsuarioByEmail(email: string): Promise<AppUser | null> {
  const q = query(collection(db, "usuarios"), where("email", "==", email.toLowerCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as AppUser;
}

/**
 * Save (upsert) a user profile in Firestore.
 * ID must be the Firebase Auth UID.
 */
export async function saveUsuario(usuario: AppUser): Promise<void> {
  // Strip passwordHash before writing — credentials live in Firebase Auth only
  const { passwordHash: _stripped, ...safeData } = usuario as AppUser & { passwordHash?: string };
  await setDoc(doc(db, "usuarios", usuario.id), {
    ...safeData,
    actualizadoEn: serverTimestamp(),
  }, { merge: true });
}

/**
 * Delete a user profile permanently from Firestore and clean up rut_lookup.
 */
export async function deleteUsuario(uid: string, rut?: string): Promise<void> {
  await deleteDoc(doc(db, "usuarios", uid));
  if (rut) {
    const cleanRut = rut.replace(/[^0-9kK]/g, "").toLowerCase();
    try {
      await deleteDoc(doc(db, "rut_lookup", cleanRut));
    } catch {
      // Ignore if rut_lookup entry didn't exist
    }
  }
}

/**
 * Elimina una cuenta sacándola del listado activo, bloqueando el acceso futuro
 * pero preservando íntegramente sus registros y firmas históricas por acreditación.
 */
export async function eliminarCuentaUsuario(
  uid: string,
  rut: string,
  motivo?: string,
  eliminadoPor?: string
): Promise<void> {
  const cleanRut = rut.replace(/[^0-9kK]/g, "").toLowerCase();
  const fechaIso = new Date().toISOString();

  // 1. Marcar usuario como eliminado en su documento de Firestore
  await updateDoc(doc(db, "usuarios", uid), {
    activo: false,
    eliminado: true,
    motivoBaja: motivo || "Baja del sistema por Transporte / Administración",
    eliminadoEn: fechaIso,
    eliminadoPor: eliminadoPor || "Administración",
    actualizadoEn: serverTimestamp(),
  });

  // 2. Registrar bloqueo en rut_lookup para impedir inicio de sesión y registro futuro
  if (cleanRut) {
    await setDoc(doc(db, "rut_lookup", cleanRut), {
      bloqueado: true,
      eliminado: true,
      motivoBaja: motivo || "Cuenta dada de baja",
      eliminadoEn: fechaIso,
      actualizadoEn: serverTimestamp(),
    }, { merge: true });
  }
}

/**
 * Reactiva una cuenta dada de baja si la administración así lo requiere.
 */
export async function reactivarCuentaUsuario(uid: string, rut: string): Promise<void> {
  const cleanRut = rut.replace(/[^0-9kK]/g, "").toLowerCase();

  await updateDoc(doc(db, "usuarios", uid), {
    activo: true,
    eliminado: false,
    motivoBaja: null,
    eliminadoEn: null,
    eliminadoPor: null,
    actualizadoEn: serverTimestamp(),
  });

  if (cleanRut) {
    await setDoc(doc(db, "rut_lookup", cleanRut), {
      bloqueado: false,
      eliminado: false,
      actualizadoEn: serverTimestamp(),
    }, { merge: true });
  }
}

/**
 * Verifica si un RUN está registrado como cuenta eliminada / bloqueada para prevenir registros duplicados.
 */
export async function verificarRutBloqueado(rut: string): Promise<{ bloqueado: boolean; motivo?: string; fecha?: string } | null> {
  const clean = rut.replace(/[^0-9kK]/g, "").toLowerCase();
  try {
    const snap = await getDoc(doc(db, "rut_lookup", clean));
    if (snap.exists() && snap.data().bloqueado) {
      return {
        bloqueado: true,
        motivo: snap.data().motivoBaja,
        fecha: snap.data().eliminadoEn,
      };
    }
  } catch {
    // Lookup ignore
  }
  return null;
}

/**
 * Mark user's last access timestamp.
 */
export async function updateUltimoAcceso(uid: string): Promise<void> {
  await updateDoc(doc(db, "usuarios", uid), {
    ultimoAcceso: serverTimestamp(),
  });
}

/**
 * Update isTemporaryPassword flag (after user sets their own password).
 */
export async function updateIsTemporaryPassword(uid: string, value: boolean): Promise<void> {
  await updateDoc(doc(db, "usuarios", uid), {
    isTemporaryPassword: value,
    actualizadoEn: serverTimestamp(),
  });
}

/**
 * Register or update the RUT -> Email mapping in rut_lookup
 */
export async function saveRutLookup(cleanRut: string, email: string, nombre?: string): Promise<void> {
  await setDoc(doc(db, "rut_lookup", cleanRut), {
    email: email.trim().toLowerCase(),
    rut: cleanRut,
    nombre: nombre || '',
    actualizadoEn: serverTimestamp(),
  }, { merge: true });
}

/**
 * Resolve an input (RUT or email) to the actual Firebase Auth login email
 */
export async function resolveAuthEmail(input: string): Promise<string> {
  const trimmed = (input || '').trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  const clean = trimmed.replace(/[^0-9kK]/g, '');
  if (clean === '141012991') {
    return 'gonzalop14@gmail.com';
  }
  try {
    const snap = await getDoc(doc(db, "rut_lookup", clean));
    if (snap.exists() && snap.data().email) {
      return snap.data().email;
    }
  } catch (e) {
    // Fallback if offline or lookup fails
  }
  return `${clean}@hospitalvillarrica.cl`;
}

// ──────────────────────────────────────────────────────────────────────────────
// AMBULANCIAS
// ──────────────────────────────────────────────────────────────────────────────

export async function getAmbulancias(): Promise<Ambulancia[]> {
  const snap = await getDocs(collection(db, "ambulancias"));
  return snap.docs.map((d) => d.data() as Ambulancia);
}

export async function saveAmbulancia(ambulancia: Ambulancia): Promise<void> {
  await setDoc(doc(db, "ambulancias", ambulancia.patente), ambulancia, {
    merge: true,
  });
}

/**
 * Subscribe to real-time ambulancia updates.
 * Returns unsubscribe function for useEffect cleanup.
 */
export function subscribeAmbulancias(
  callback: (data: Ambulancia[]) => void
): () => void {
  return onSnapshot(collection(db, "ambulancias"), (snap) => {
    callback(snap.docs.map((d) => d.data() as Ambulancia));
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// ENTREGAS DE TURNO
// ──────────────────────────────────────────────────────────────────────────────

/**
 * One-time fetch (for forms that need to look up existing open turnos).
 */
export async function getTurnos(): Promise<TurnoEntrega[]> {
  const q = query(collection(db, "entregas_turno"), orderBy("fecha", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as TurnoEntrega);
}

/**
 * Save a turno using merge:true — critical for multi-role workflows.
 * Conductor saves first. TENS later updates the same document without
 * overwriting conductor data. Also validates required fields before saving.
 */
export async function saveTurno(turno: TurnoEntrega): Promise<void> {
  // Guard: reject empty or zero-value submissions that could corrupt data
  if (!isNonEmpty(turno.patente)) throw new Error("Patente no puede estar vacía.");
  if (!isNonEmpty(turno.id)) throw new Error("ID de turno no puede estar vacío.");
  if (!isNonEmpty(turno.creadoPor)) throw new Error("Debe identificarse el creador del turno.");

  await setDoc(
    doc(db, "entregas_turno", turno.id),
    {
      ...turno,
      actualizadoEn: serverTimestamp(),
    },
    { merge: true }  // ← CRITICAL: prevents overwriting existing conductor/TENS data
  );
}

/**
 * Real-time listener for the Dashboard — updates automatically when any user
 * saves a turno from any device.
 */
export function subscribeTurnos(
  callback: (data: TurnoEntrega[]) => void
): () => void {
  const q = query(collection(db, "entregas_turno"), orderBy("fecha", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as TurnoEntrega));
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// NOVEDADES
// ──────────────────────────────────────────────────────────────────────────────

export async function getNovedades(): Promise<Novedad[]> {
  const q = query(collection(db, "novedades"), orderBy("reportadoEn", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Novedad));
}

export async function saveNovedad(novedad: Novedad): Promise<void> {
  if (!isNonEmpty(novedad.patente)) throw new Error("Novedad debe tener patente.");
  if (!isNonEmpty(novedad.itemAfectado)) throw new Error("Novedad debe identificar el ítem afectado.");

  await setDoc(
    doc(db, "novedades", novedad.id),
    {
      ...novedad,
      actualizadoEn: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Append a trazabilidad action to the novedades/{id}/acciones subcollection.
 * This keeps the history granular and never overwrites previous actions.
 */
export async function addAccionNovedad(
  novedadId: string,
  accion: { usuario: string; comentario: string; nuevoEstado: string }
): Promise<void> {
  await addDoc(collection(db, "novedades", novedadId, "acciones"), {
    ...accion,
    fecha: serverTimestamp(),
  });
}

/**
 * Real-time listener for the Novedades view.
 */
export function subscribeNovedades(
  callback: (data: Novedad[]) => void
): () => void {
  const q = query(collection(db, "novedades"), orderBy("reportadoEn", "desc"));
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() } as Novedad))
    );
  });
}

// Legacy compat stub — kept for MantenedorUsuariosView which still uses it
export async function updateUsuarioPassword(_userId: string, _newHash: string): Promise<void> {
  // Password changes are now handled exclusively through Firebase Auth
  // (updatePassword from firebase/auth). This stub is a no-op.
  console.warn("updateUsuarioPassword: password management is now done via Firebase Auth.");
}
