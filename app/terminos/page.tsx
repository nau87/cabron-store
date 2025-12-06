import Header from '@/components/Header';
import Link from 'next/link';

export default function TerminosPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-black uppercase tracking-wider mb-8">
            Términos y Condiciones
          </h1>
          
          <div className="prose prose-lg max-w-none space-y-6 text-zinc-800">
            <p className="text-sm text-zinc-600">
              Última actualización: {new Date().toLocaleDateString('es-AR')}
            </p>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">1. Información General</h2>
              <p>
                Bienvenido a <strong>CABRÓN STORE</strong>. Al acceder y realizar compras en nuestro sitio web,
                aceptás los siguientes términos y condiciones. Te recomendamos leerlos atentamente antes de
                realizar cualquier transacción.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">2. Productos y Precios</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Todos los productos están sujetos a disponibilidad de stock.</li>
                <li>Los precios publicados son en <strong>pesos argentinos (ARS)</strong> e incluyen IVA.</li>
                <li>Nos reservamos el derecho de modificar precios sin previo aviso.</li>
                <li>Las imágenes de los productos son ilustrativas. Los colores pueden variar según tu pantalla.</li>
                <li>Los talles disponibles se especifican en cada producto.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">3. Métodos de Pago</h2>
              <h3 className="text-xl font-semibold mb-2">Aceptamos:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Transferencia Bancaria:</strong> 30% de descuento. Confirmación en 24-48 horas hábiles.</li>
                <li><strong>MercadoPago:</strong> Tarjeta de crédito/débito. Hasta 12 cuotas sin interés.</li>
                <li><strong>Efectivo:</strong> Solo en punto de venta físico (si aplica).</li>
              </ul>
              <p className="mt-4">
                Una vez confirmado el pago, procesamos tu pedido en un plazo máximo de 48 horas hábiles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">4. Envíos</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Envío Gratis:</strong> Compras superiores a $150.000</li>
                <li><strong>Zonas de envío:</strong> Todo Argentina via OCA/Andreani</li>
                <li><strong>Tiempo de entrega:</strong> 5-10 días hábiles (según destino)</li>
                <li><strong>Retiro en punto:</strong> Disponible en CABA (acordar por WhatsApp)</li>
              </ul>
              <p className="mt-4">
                <strong>Importante:</strong> Los plazos de entrega comienzan a contar desde la confirmación del pago.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">5. Cambios y Devoluciones</h2>
              <h3 className="text-xl font-semibold mb-2">Derecho de Arrepentimiento (Ley 24.240)</h3>
              <p>
                Tenés <strong>10 días corridos</strong> desde que recibís el producto para arrepentirte de la compra,
                sin necesidad de justificar tu decisión.
              </p>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">Condiciones para cambios:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>El producto debe estar sin uso, con etiquetas originales</li>
                <li>En su embalaje original</li>
                <li>Sin lavado ni alteraciones</li>
                <li>Presentar factura o comprobante de compra</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">Productos defectuosos:</h3>
              <p>
                Si recibís un producto con fallas de fabricación, lo cambiamos sin cargo o te devolvemos el 100% del dinero.
                Contactanos dentro de las 72 horas de recibido.
              </p>

              <p className="mt-4">
                <strong>Costo de envío de devolución:</strong> A cargo del comprador (excepto productos defectuosos).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">6. Garantía</h2>
              <p>
                Todos nuestros productos cuentan con <strong>garantía de 30 días</strong> por fallas de fabricación.
                No cubre:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Mal uso o descuido</li>
                <li>Lavado incorrecto</li>
                <li>Daños por accidentes</li>
                <li>Desgaste normal por uso</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">7. Privacidad y Datos Personales</h2>
              <p>
                Tu información personal está protegida según nuestra{' '}
                <Link href="/privacidad" className="text-blue-600 underline hover:text-blue-800">
                  Política de Privacidad
                </Link>.
                No compartimos tus datos con terceros sin tu consentimiento, excepto para procesar pagos
                (MercadoPago) y envíos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">8. Cupones y Promociones</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Los cupones de descuento son de <strong>un solo uso</strong></li>
                <li>No son acumulables con otras promociones (excepto que se indique lo contrario)</li>
                <li>Tienen fecha de vencimiento específica</li>
                <li>No se pueden canjear por dinero</li>
                <li>Cabrón Store se reserva el derecho de anular cupones fraudulentos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">9. Cuenta de Usuario</h2>
              <p>
                Si creás una cuenta en nuestro sitio:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Sos responsable de mantener la confidencialidad de tu contraseña</li>
                <li>No podés compartir tu cuenta con terceros</li>
                <li>Debés notificarnos inmediatamente de cualquier uso no autorizado</li>
                <li>Nos reservamos el derecho de suspender cuentas sospechosas de fraude</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">10. Limitación de Responsabilidad</h2>
              <p>
                Cabrón Store no se hace responsable por:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Demoras en entregas por causas de fuerza mayor</li>
                <li>Direcciones de envío incorrectas proporcionadas por el cliente</li>
                <li>Paquetes robados después de ser entregados según tracking</li>
                <li>Problemas con métodos de pago de terceros (MercadoPago, bancos)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">11. Jurisdicción</h2>
              <p>
                Estos términos se rigen por las leyes de la <strong>República Argentina</strong>.
                Cualquier disputa será resuelta en los tribunales de la Ciudad Autónoma de Buenos Aires.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold uppercase mb-4">12. Contacto</h2>
              <p>
                Para consultas sobre estos términos, contactanos:
              </p>
              <ul className="list-none space-y-2 mt-4">
                <li>📧 Email: <strong>hola@cabronstore.com</strong></li>
                <li>📱 WhatsApp: <strong>+54 11 1234-5678</strong></li>
                <li>📍 Dirección: Buenos Aires, Argentina</li>
              </ul>
            </section>

            <section className="mt-12 p-6 bg-zinc-100 rounded-lg">
              <h3 className="text-xl font-bold uppercase mb-4">Botón de Arrepentimiento</h3>
              <p className="mb-4">
                Según la Ley de Defensa del Consumidor (Ley 24.240), tenés derecho a arrepentirte
                de tu compra dentro de los 10 días corridos.
              </p>
              <Link
                href="/arrepentimiento"
                className="inline-block bg-black text-white px-6 py-3 rounded-lg font-bold uppercase hover:bg-zinc-800"
              >
                Solicitar Arrepentimiento
              </Link>
            </section>

            <div className="mt-12 pt-8 border-t">
              <p className="text-sm text-zinc-600">
                Al realizar una compra en Cabrón Store, declarás haber leído y aceptado estos términos y condiciones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
