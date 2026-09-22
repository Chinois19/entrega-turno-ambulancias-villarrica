import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { AppUser, Ambulancia, TurnoEntrega, Novedad } from '../types';
import { USUARIOS_INICIALES, AMBULANCIAS_INICIALES } from '../data/seedData';

// Local storage keys for hybrid offline/development fallback
const USERS_STORAGE_KEY = 'villarrica_users_db';
const AMBULANCIAS_STORAGE_KEY = 'villarrica_ambulancias_db';
const TURNOS_STORAGE_KEY = 'villarrica_turnos_db';
const NOVEDADES_STORAGE_KEY = 'villarrica_novedades_db';

// Initialize local store if empty
function initializeLocalFallback() {
  if (!localStorage.getItem(USERS_STORAGE_KEY)) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(USUARIOS_INICIALES));
  }
  if (!localStorage.getItem(AMBULANCIAS_STORAGE_KEY)) {
    localStorage.setItem(AMBULANCIAS_STORAGE_KEY, JSON.stringify(AMBULANCIAS_INICIALES));
  }
  if (!localStorage.getItem(TURNOS_STORAGE_KEY)) {
    localStorage.setItem(TURNOS_STORAGE_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(NOVEDADES_STORAGE_KEY)) {
    localStorage.setItem(NOVEDADES_STORAGE_KEY, JSON.stringify([]));
  }
}

// ---------------- USER MANAGEMENT ---------------- //

export async function getUsuarios(): Promise<AppUser[]> {
  initializeLocalFallback();
  if (isFirebaseConfigured) {
    try {
      const q = query(collection(db, 'app_users'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(d => d.data() as AppUser);
      }
    } catch (err) {
      console.warn("Error leyendo Firestore, usando fallback local:", err);
    }
  }
  return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
}

export async function saveUsuario(usuario: AppUser): Promise<void> {
  initializeLocalFallback();
  // Update local storage
  const users = await getUsuarios();
  const existingIdx = users.findIndex(u => u.id === usuario.id || u.rut === usuario.rut || u.email === usuario.email);
  if (existingIdx >= 0) {
    users[existingIdx] = usuario;
  } else {
    users.push(usuario);
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

  // Sync to Firestore if configured
  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'app_users', usuario.id), usuario);
    } catch (err) {
      console.warn("Error escribiendo en Firestore app_users:", err);
    }
  }
}

export async function updateUsuarioPassword(userId: string, newHash: string): Promise<void> {
  const users = await getUsuarios();
  const user = users.find(u => u.id === userId);
  if (user) {
    user.passwordHash = newHash;
    user.isTemporaryPassword = false;
    await saveUsuario(user);
  }
}

// ---------------- AMBULANCIAS MANAGEMENT ---------------- //

export async function getAmbulancias(): Promise<Ambulancia[]> {
  initializeLocalFallback();
  if (isFirebaseConfigured) {
    try {
      const snapshot = await getDocs(collection(db, 'ambulancias'));
      if (!snapshot.empty) {
        return snapshot.docs.map(d => d.data() as Ambulancia);
      }
    } catch (err) {
      console.warn("Error leyendo Firestore ambulancias:", err);
    }
  }
  return JSON.parse(localStorage.getItem(AMBULANCIAS_STORAGE_KEY) || '[]');
}

export async function saveAmbulancia(ambulancia: Ambulancia): Promise<void> {
  initializeLocalFallback();
  const ambulancias = await getAmbulancias();
  const idx = ambulancias.findIndex(a => a.id === ambulancia.id || a.patente === ambulancia.patente);
  if (idx >= 0) {
    ambulancias[idx] = ambulancia;
  } else {
    ambulancias.push(ambulancia);
  }
  localStorage.setItem(AMBULANCIAS_STORAGE_KEY, JSON.stringify(ambulancias));

  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'ambulancias', ambulancia.id), ambulancia);
    } catch (err) {
      console.warn("Error guardando ambulancia en Firestore:", err);
    }
  }
}

// ---------------- TURNOS DE ENTREGA ---------------- //

export async function getTurnos(): Promise<TurnoEntrega[]> {
  initializeLocalFallback();
  if (isFirebaseConfigured) {
    try {
      const q = query(collection(db, 'entregas_turno'), orderBy('fecha', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(d => d.data() as TurnoEntrega);
      }
    } catch (err) {
      console.warn("Error leyendo Firestore entregas_turno:", err);
    }
  }
  const turnos: TurnoEntrega[] = JSON.parse(localStorage.getItem(TURNOS_STORAGE_KEY) || '[]');
  return turnos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

export async function saveTurno(turno: TurnoEntrega): Promise<void> {
  initializeLocalFallback();
  const turnos = await getTurnos();
  const idx = turnos.findIndex(t => t.id === turno.id);
  if (idx >= 0) {
    turnos[idx] = turno;
  } else {
    turnos.unshift(turno);
  }
  localStorage.setItem(TURNOS_STORAGE_KEY, JSON.stringify(turnos));

  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'entregas_turno', turno.id), turno);
    } catch (err) {
      console.warn("Error guardando turno en Firestore:", err);
    }
  }
}

// ---------------- NOVEDADES / EVENTOS ANOMALOS (ACREDITACION) ---------------- //

export async function getNovedades(): Promise<Novedad[]> {
  initializeLocalFallback();
  if (isFirebaseConfigured) {
    try {
      const q = query(collection(db, 'novedades'), orderBy('reportadoEn', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(d => d.data() as Novedad);
      }
    } catch (err) {
      console.warn("Error leyendo Firestore novedades:", err);
    }
  }
  const novedades: Novedad[] = JSON.parse(localStorage.getItem(NOVEDADES_STORAGE_KEY) || '[]');
  return novedades.sort((a, b) => new Date(b.reportadoEn).getTime() - new Date(a.reportadoEn).getTime());
}

export async function saveNovedad(novedad: Novedad): Promise<void> {
  initializeLocalFallback();
  const novedades = await getNovedades();
  const idx = novedades.findIndex(n => n.id === novedad.id);
  if (idx >= 0) {
    novedades[idx] = novedad;
  } else {
    novedades.unshift(novedad);
  }
  localStorage.setItem(NOVEDADES_STORAGE_KEY, JSON.stringify(novedades));

  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'novedades', novedad.id), novedad);
    } catch (err) {
      console.warn("Error guardando novedad en Firestore:", err);
    }
  }
}
