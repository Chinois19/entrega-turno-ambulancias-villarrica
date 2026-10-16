import emailjs from '@emailjs/browser';

// Credenciales de EmailJS — cargadas desde variables de entorno con fallbacks configurables
export const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_im2qekb';
export const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_4p9r25o';
export const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'v2svsM5nsHTcTf-0a';

export interface WelcomeEmailParams {
  to_name: string;
  to_email: string;
  to_rut: string;
  temp_password: string;
  role_name?: string;
}

/**
 * Envía correo oficial de bienvenida con credenciales provisorias vía EmailJS
 */
export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
  const serviceId = EMAILJS_SERVICE_ID;
  const templateId = EMAILJS_TEMPLATE_ID;
  const publicKey = EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn('[EmailJS] Faltan credenciales VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID o VITE_EMAILJS_PUBLIC_KEY');
    return {
      success: false,
      error: 'EmailJS no está configurado aún con las credenciales de servicio.'
    };
  }

  try {
    const templateParams = {
      to_name: params.to_name,
      to_email: params.to_email,
      to_rut: params.to_rut,
      temp_password: params.temp_password,
      role_name: params.role_name || 'Funcionario',
      app_url: 'https://entrega-turno-ambulancias.pages.dev',
      system_name: 'Sistema de Entrega de Turno de Ambulancias - Hospital de Villarrica'
    };

    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.log('[EmailJS] Correo enviado exitosamente:', response.status, response.text);
    return { success: true };
  } catch (err: any) {
    console.error('[EmailJS] Error al enviar correo:', err);
    return {
      success: false,
      error: err?.text || err?.message || 'Error al despachar correo vía EmailJS'
    };
  }
}
