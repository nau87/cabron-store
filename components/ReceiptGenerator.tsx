'use client';

import { useRef } from 'react';

interface ReceiptData {
  type: 'sale' | 'payment';
  // Para ventas POS
  saleNumber?: string;
  customerName: string;
  items?: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
  subtotal?: number;
  discount?: number;
  total: number;
  paymentMethod: string;
  date: Date;
  // Para pagos de cuenta corriente
  description?: string;
}

export default function ReceiptGenerator({ 
  data, 
  onGenerated 
}: { 
  data: ReceiptData | null;
  onGenerated?: (url: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateReceipt = () => {
    if (!data || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas
    canvas.width = 400;
    canvas.height = data.type === 'sale' ? 600 + (data.items?.length || 0) * 30 : 400;

    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Configuración de texto
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';

    let yPos = 30;

    // Header
    ctx.font = 'bold 24px Arial';
    ctx.fillText('CABRÓN STORE', canvas.width / 2, yPos);
    yPos += 30;

    ctx.font = '14px Arial';
    ctx.fillText('Comprobante de ' + (data.type === 'sale' ? 'Venta' : 'Pago'), canvas.width / 2, yPos);
    yPos += 40;

    // Línea separadora
    ctx.strokeStyle = '#cccccc';
    ctx.beginPath();
    ctx.moveTo(20, yPos);
    ctx.lineTo(canvas.width - 20, yPos);
    ctx.stroke();
    yPos += 30;

    // Información
    ctx.textAlign = 'left';
    ctx.font = '12px Arial';

    if (data.type === 'sale' && data.saleNumber) {
      ctx.fillText(`Nº Ticket: ${data.saleNumber}`, 20, yPos);
      yPos += 20;
    }

    ctx.fillText(`Cliente: ${data.customerName}`, 20, yPos);
    yPos += 20;

    ctx.fillText(`Fecha: ${data.date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 20, yPos);
    yPos += 30;

    if (data.type === 'sale' && data.items) {
      // Productos vendidos
      ctx.font = 'bold 12px Arial';
      ctx.fillText('PRODUCTOS', 20, yPos);
      yPos += 20;

      ctx.font = '11px Arial';
      data.items.forEach(item => {
        const itemText = `${item.quantity}x ${item.product_name}`;
        const priceText = `$${item.subtotal.toFixed(2)}`;
        
        ctx.textAlign = 'left';
        ctx.fillText(itemText, 20, yPos);
        ctx.textAlign = 'right';
        ctx.fillText(priceText, canvas.width - 20, yPos);
        yPos += 25;
      });

      yPos += 10;

      // Línea separadora
      ctx.strokeStyle = '#cccccc';
      ctx.beginPath();
      ctx.moveTo(20, yPos);
      ctx.lineTo(canvas.width - 20, yPos);
      ctx.stroke();
      yPos += 20;

      // Totales
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Subtotal:', 20, yPos);
      ctx.textAlign = 'right';
      ctx.fillText(`$${data.subtotal?.toFixed(2)}`, canvas.width - 20, yPos);
      yPos += 20;

      if (data.discount && data.discount > 0) {
        ctx.textAlign = 'left';
        ctx.fillText('Descuento:', 20, yPos);
        ctx.textAlign = 'right';
        ctx.fillText(`-$${data.discount.toFixed(2)}`, canvas.width - 20, yPos);
        yPos += 20;
      }

      // Total
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('TOTAL:', 20, yPos);
      ctx.textAlign = 'right';
      ctx.fillText(`$${data.total.toFixed(2)}`, canvas.width - 20, yPos);
      yPos += 30;

      // Método de pago
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Método de pago: ${data.paymentMethod}`, 20, yPos);
      yPos += 30;
    } else if (data.type === 'payment') {
      // Para pagos de cuenta corriente
      ctx.font = 'bold 16px Arial';
      ctx.fillText('PAGO RECIBIDO', 20, yPos);
      yPos += 30;

      ctx.font = '12px Arial';
      if (data.description) {
        ctx.fillText(`Concepto: ${data.description}`, 20, yPos);
        yPos += 20;
      }

      ctx.fillText(`Método: ${data.paymentMethod}`, 20, yPos);
      yPos += 30;

      ctx.font = 'bold 20px Arial';
      ctx.fillText(`Monto: $${data.total.toFixed(2)}`, 20, yPos);
      yPos += 30;
    }

    // Footer
    yPos += 20;
    ctx.strokeStyle = '#cccccc';
    ctx.beginPath();
    ctx.moveTo(20, yPos);
    ctx.lineTo(canvas.width - 20, yPos);
    ctx.stroke();
    yPos += 20;

    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('¡Gracias por su compra!', canvas.width / 2, yPos);
    yPos += 15;
    ctx.fillText('www.cabronstore.com', canvas.width / 2, yPos);

    // Generar imagen
    const imageUrl = canvas.toDataURL('image/png');
    if (onGenerated) {
      onGenerated(imageUrl);
    }

    return imageUrl;
  };

  const downloadReceipt = () => {
    const imageUrl = generateReceipt();
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.download = `comprobante-${data?.saleNumber || Date.now()}.png`;
    link.href = imageUrl;
    link.click();
  };

  return (
    <div className="hidden">
      <canvas ref={canvasRef} />
    </div>
  );
}

export function useReceiptGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateAndDownload = (data: ReceiptData) => {
    // Crear canvas temporal
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas
    canvas.width = 400;
    const baseHeight = data.type === 'sale' ? 600 : 400;
    const itemsHeight = (data.items?.length || 0) * 30;
    canvas.height = baseHeight + itemsHeight;

    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Configuración de texto
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';

    let yPos = 30;

    // Header
    ctx.font = 'bold 24px Arial';
    ctx.fillText('CABRÓN STORE', canvas.width / 2, yPos);
    yPos += 30;

    ctx.font = '14px Arial';
    ctx.fillText('Comprobante de ' + (data.type === 'sale' ? 'Venta' : 'Pago'), canvas.width / 2, yPos);
    yPos += 40;

    // Línea separadora
    ctx.strokeStyle = '#cccccc';
    ctx.beginPath();
    ctx.moveTo(20, yPos);
    ctx.lineTo(canvas.width - 20, yPos);
    ctx.stroke();
    yPos += 30;

    // Información
    ctx.textAlign = 'left';
    ctx.font = '12px Arial';

    if (data.type === 'sale' && data.saleNumber) {
      ctx.fillText(`Nº Ticket: ${data.saleNumber}`, 20, yPos);
      yPos += 20;
    }

    ctx.fillText(`Cliente: ${data.customerName}`, 20, yPos);
    yPos += 20;

    ctx.fillText(`Fecha: ${data.date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 20, yPos);
    yPos += 30;

    if (data.type === 'sale' && data.items) {
      // Productos vendidos
      ctx.font = 'bold 12px Arial';
      ctx.fillText('PRODUCTOS', 20, yPos);
      yPos += 20;

      ctx.font = '11px Arial';
      data.items.forEach(item => {
        const itemText = `${item.quantity}x ${item.product_name}`;
        const priceText = `$${item.subtotal.toFixed(2)}`;
        
        ctx.textAlign = 'left';
        ctx.fillText(itemText, 20, yPos);
        ctx.textAlign = 'right';
        ctx.fillText(priceText, canvas.width - 20, yPos);
        yPos += 25;
      });

      yPos += 10;

      // Línea separadora
      ctx.strokeStyle = '#cccccc';
      ctx.beginPath();
      ctx.moveTo(20, yPos);
      ctx.lineTo(canvas.width - 20, yPos);
      ctx.stroke();
      yPos += 20;

      // Totales
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Subtotal:', 20, yPos);
      ctx.textAlign = 'right';
      ctx.fillText(`$${data.subtotal?.toFixed(2)}`, canvas.width - 20, yPos);
      yPos += 20;

      if (data.discount && data.discount > 0) {
        ctx.textAlign = 'left';
        ctx.fillText('Descuento:', 20, yPos);
        ctx.textAlign = 'right';
        ctx.fillText(`-$${data.discount.toFixed(2)}`, canvas.width - 20, yPos);
        yPos += 20;
      }

      // Total
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('TOTAL:', 20, yPos);
      ctx.textAlign = 'right';
      ctx.fillText(`$${data.total.toFixed(2)}`, canvas.width - 20, yPos);
      yPos += 30;

      // Método de pago
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Método de pago: ${data.paymentMethod}`, 20, yPos);
      yPos += 30;
    } else if (data.type === 'payment') {
      // Para pagos de cuenta corriente
      ctx.font = 'bold 16px Arial';
      ctx.fillText('PAGO RECIBIDO', 20, yPos);
      yPos += 30;

      ctx.font = '12px Arial';
      if (data.description) {
        ctx.fillText(`Concepto: ${data.description}`, 20, yPos);
        yPos += 20;
      }

      ctx.fillText(`Método: ${data.paymentMethod}`, 20, yPos);
      yPos += 30;

      ctx.font = 'bold 20px Arial';
      ctx.fillText(`Monto: $${data.total.toFixed(2)}`, 20, yPos);
      yPos += 30;
    }

    // Footer
    yPos += 20;
    ctx.strokeStyle = '#cccccc';
    ctx.beginPath();
    ctx.moveTo(20, yPos);
    ctx.lineTo(canvas.width - 20, yPos);
    ctx.stroke();
    yPos += 20;

    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('¡Gracias por su compra!', canvas.width / 2, yPos);
    yPos += 15;
    ctx.fillText('www.cabronstore.com', canvas.width / 2, yPos);

    // Descargar imagen
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `comprobante-${data.saleNumber || Date.now()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  return { generateAndDownload };
}
