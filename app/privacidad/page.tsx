import Header from '@/components/Header';
import Link from 'next/link';

export default function PrivacidadPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-black uppercase tracking-wider mb-8">
            Política de Privacidad
          </h1>
          
          <div className="prose prose-lg max-w-none space-y-6 text-zinc-800">
            <p className="text-sm text-zinc-600">
              Última actualización: {new Date().toLocaleDateString('es-AR')}
            </p>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">1. Introducción</h2>
              <p>
                En <strong>CABRÓN STORE</strong>, respetamos tu privacidad y nos comprometemos a proteger
                tus datos personales. Esta política explica qué información recopilamos, cómo la usamos y
                cuáles son tus derechos según la <strong>Ley 25.326 de Protección de Datos Personales de Argentina</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">2. Información que Recopilamos</h2>
              
              <h3 className="text-xl font-semibold mb-2">2.1 Información que nos proporcionás:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Datos de contacto:</strong> Nombre completo, email, teléfono</li>
                <li><strong>Datos de envío:</strong> Dirección, ciudad, provincia, código postal</li>
                <li><strong>Datos de pago:</strong> Procesados por MercadoPago (no almacenamos datos de tarjetas)</li>
                <li><strong>Cuenta de usuario:</strong> Contraseña encriptada, preferencias</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">2.2 Información que recopilamos automáticamente:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Datos de navegación:</strong> IP, navegador, dispositivo, páginas visitadas</li>
                <li><strong>Cookies:</strong> Para mejorar tu experiencia y recordar tu carrito</li>
                <li><strong>Historial de compras:</strong> Productos adquiridos, fechas, montos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">3. Cómo Usamos tu Información</h2>
              <p>
                Utilizamos tus datos personales para:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>✅ <strong>Procesar tus pedidos</strong> y gestionar envíos</li>
                <li>✅ <strong>Comunicarnos contigo</strong> sobre el estado de tu compra</li>
                <li>✅ <strong>Brindarte soporte</strong> y responder consultas</li>
                <li>✅ <strong>Enviarte promociones</strong> (solo si aceptaste recibirlas)</li>
                <li>✅ <strong>Mejorar nuestro servicio</strong> mediante análisis de compras</li>
                <li>✅ <strong>Prevenir fraudes</strong> y garantizar la seguridad del sitio</li>
                <li>✅ <strong>Cumplir obligaciones legales</strong> (AFIP, protección al consumidor)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">4. Compartir tu Información</h2>
              <p>
                <strong>NO</strong> vendemos ni alquilamos tus datos personales. Solo compartimos información con:
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">Terceros autorizados:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>MercadoPago:</strong> Procesamiento seguro de pagos</li>
                <li><strong>Correos (OCA/Andreani):</strong> Entrega de pedidos</li>
                <li><strong>Hosting (Vercel/Supabase):</strong> Almacenamiento seguro de datos</li>
                <li><strong>Autoridades:</strong> Si la ley lo requiere (orden judicial, AFIP)</li>
              </ul>

              <p className="mt-4">
                Todos estos servicios están obligados a mantener la confidencialidad de tu información.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">5. Cookies y Tecnologías Similares</h2>
              <p>
                Usamos cookies para:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>🍪 Recordar tu carrito de compras</li>
                <li>🍪 Mantener tu sesión iniciada</li>
                <li>🍪 Analizar el tráfico del sitio (Google Analytics)</li>
                <li>🍪 Personalizar tu experiencia</li>
              </ul>

              <p className="mt-4">
                Podés configurar tu navegador para rechazar cookies, pero esto puede afectar la funcionalidad del sitio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">6. Tus Derechos</h2>
              <p>
                Según la Ley 25.326, tenés derecho a:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Acceso:</strong> Solicitar una copia de tus datos personales</li>
                <li><strong>Rectificación:</strong> Corregir información incorrecta o desactualizada</li>
                <li><strong>Supresión:</strong> Eliminar tus datos (excepto los requeridos legalmente)</li>
                <li><strong>Oposición:</strong> Rechazar el envío de publicidad o marketing</li>
                <li><strong>Portabilidad:</strong> Recibir tus datos en formato estructurado</li>
              </ul>

              <p className="mt-4">
                Para ejercer estos derechos, contactanos a: <strong>hola@cabronstore.com</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">7. Seguridad de la Información</h2>
              <p>
                Implementamos medidas de seguridad para proteger tus datos:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>🔒 <strong>Encriptación SSL:</strong> Conexión segura (HTTPS)</li>
                <li>🔒 <strong>Contraseñas hasheadas:</strong> Nunca almacenamos contraseñas en texto plano</li>
                <li>🔒 <strong>Servidores seguros:</strong> Infraestructura con certificaciones de seguridad</li>
                <li>🔒 <strong>Acceso restringido:</strong> Solo personal autorizado puede ver tus datos</li>
                <li>🔒 <strong>Backups regulares:</strong> Para prevenir pérdida de información</li>
              </ul>

              <p className="mt-4 bg-yellow-50 p-4 rounded-lg">
                ⚠️ <strong>Importante:</strong> Ningún método de transmisión por Internet es 100% seguro.
                Hacemos nuestro mejor esfuerzo, pero no podemos garantizar seguridad absoluta.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">8. Retención de Datos</h2>
              <p>
                Conservamos tu información personal mientras:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Tengas una cuenta activa en nuestro sitio</li>
                <li>Sea necesario para cumplir obligaciones legales (10 años según AFIP)</li>
                <li>Existan reclamos, disputas o investigaciones pendientes</li>
              </ul>

              <p className="mt-4">
                Si solicitás la eliminación de tu cuenta, borraremos tus datos no sujetos a requisitos legales
                en un plazo máximo de 30 días.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">9. Marketing y Publicidad</h2>
              <p>
                Si te suscribiste a nuestro newsletter:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Recibirás emails sobre nuevos productos, ofertas y noticias</li>
                <li>Podés darte de baja en cualquier momento haciendo clic en "Cancelar suscripción"</li>
                <li>No compartimos tu email con terceros para fines publicitarios</li>
                <li>Respetamos tu casilla: máximo 2 emails por semana</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">10. Menores de Edad</h2>
              <p>
                Nuestro sitio NO está dirigido a menores de 18 años. Si descubrimos que recopilamos datos
                de un menor sin consentimiento parental, los eliminaremos inmediatamente.
              </p>
              <p className="mt-4">
                Si sos padre/madre/tutor y creés que tu hijo proporcionó información, contactanos de inmediato.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">11. Enlaces a Sitios Externos</h2>
              <p>
                Nuestro sitio puede contener enlaces a páginas de terceros (MercadoPago, redes sociales).
                <strong> No somos responsables de las prácticas de privacidad de estos sitios</strong>.
                Te recomendamos leer sus políticas antes de proporcionar información.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">12. Cambios en esta Política</h2>
              <p>
                Nos reservamos el derecho de actualizar esta política en cualquier momento.
                Los cambios serán efectivos al publicarse en esta página con una nueva "fecha de actualización".
              </p>
              <p className="mt-4">
                <strong>Te recomendamos revisar esta página periódicamente.</strong> El uso continuado del
                sitio después de cambios constituye tu aceptación.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">13. Legislación Aplicable</h2>
              <p>
                Esta política se rige por:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Ley 25.326 - Protección de Datos Personales (Argentina)</li>
                <li>Ley 24.240 - Defensa del Consumidor</li>
                <li>Disposición 10/2008 - Dirección Nacional de Protección de Datos Personales</li>
              </ul>

              <p className="mt-4">
                <strong>Autoridad de Aplicación:</strong> Agencia de Acceso a la Información Pública (AAIP)
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">14. Contacto</h2>
              <p>
                Para consultas sobre privacidad o ejercer tus derechos:
              </p>
              <ul className="list-none space-y-2 mt-4">
                <li>📧 Email: <strong>hola@cabronstore.com</strong></li>
                <li>📧 Responsable de Datos: <strong>privacidad@cabronstore.com</strong></li>
                <li>📱 WhatsApp: <strong>+54 11 1234-5678</strong></li>
                <li>📍 Dirección: Buenos Aires, Argentina</li>
              </ul>

              <p className="mt-4">
                Responderemos tu consulta en un plazo máximo de <strong>10 días hábiles</strong>.
              </p>
            </section>

            <section className="mt-12 p-6 bg-blue-50 rounded-lg">
              <h3 className="text-xl font-bold uppercase mb-4">¿Preguntas?</h3>
              <p className="mb-4">
                Si tenés dudas sobre cómo manejamos tu información, no dudes en contactarnos.
                Tu privacidad es nuestra prioridad.
              </p>
              <div className="flex gap-4">
                <Link
                  href="/terminos"
                  className="inline-block bg-black text-white px-6 py-3 rounded-lg font-bold uppercase hover:bg-zinc-800"
                >
                  Ver Términos
                </Link>
                <Link
                  href="/arrepentimiento"
                  className="inline-block border-2 border-black px-6 py-3 rounded-lg font-bold uppercase hover:bg-zinc-100"
                >
                  Botón Arrepentimiento
                </Link>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t">
              <p className="text-sm text-zinc-600">
                Al usar Cabrón Store, aceptás esta Política de Privacidad y el tratamiento de tus datos
                según lo descrito.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
