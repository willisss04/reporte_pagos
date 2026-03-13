import html2canvas from 'html2canvas';

export const downloadReceiptAsJPG = async (payment) => {
  // Create container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '600px';
  container.style.padding = '40px';
  container.style.background = 'white';
  container.style.fontFamily = 'Inter, sans-serif';
  container.style.color = '#1e293b';
  
  const formattedDate = new Date(payment.created_at).toLocaleString();
  const tower = payment.tower || payment.apartment_id.split('-')[0].replace('T', '');

  container.innerHTML = `
    <h1 style="text-align: center; margin: 0 0 10px 0; font-size: 28px; color: #0f172a;">Condominio Torres Petapa</h1>
    <h2 style="text-align: center; margin: 0 0 30px 0; font-size: 18px; color: #64748b;">Recibo de Pago - Cuota de Servicios</h2>
    
    <div style="margin-bottom: 30px; line-height: 1.6;">
      <p style="margin: 0;"><strong>Número de Recibo:</strong> #${payment.id}</p>
      <p style="margin: 0;"><strong>Fecha de Reporte:</strong> ${formattedDate}</p>
      <p style="margin: 0;"><strong>Estado:</strong> APROBADO</p>
    </div>

    <div style="border: 2px solid #cbd5e1; padding: 25px; border-radius: 8px; margin-bottom: 40px; background-color: #f8fafc;">
      <p style="margin: 5px 0;"><strong>Residente:</strong> ${payment.resident_name}</p>
      <p style="margin: 5px 0;"><strong>Torre:</strong> ${tower}</p>
      <p style="margin: 5px 0;"><strong>Apartamento:</strong> ${payment.apartment_id}</p>
      <p style="margin: 5px 0;"><strong>Concepto:</strong> Cuota de Servicios Mensual</p>
      <p style="margin: 5px 0;"><strong>Mes de Pago:</strong> ${payment.payment_month || 'N/A'}</p>
      <p style="margin: 20px 0 5px 0; font-size: 20px; color: #0f172a;"><strong>Total Pagado: <span style="text-decoration: underline;">Q. 270.00</span></strong></p>
    </div>

    <div style="margin-bottom: 40px; line-height: 1.6;">
      <h3 style="margin: 0 0 10px 0; font-size: 16px;">Información Bancaria de Referencia:</h3>
      <p style="margin: 0;">Banco: Banco Industrial (BI)</p>
      <p style="margin: 0;">Cuenta Monetaria: 1270823435</p>
      <p style="margin: 0;">A nombre de: <strong>Asociación Vecinos Torres Petapa</strong></p>
    </div>

    <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 60px;">
      Este es un recibo generado automáticamente y es comprobante de que la administración ha validado su transferencia.
    </p>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2, // High resolution for better print quality
      backgroundColor: '#ffffff',
    });
    
    canvas.toBlob((blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Recibo_Torres_Petapa_${payment.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.95);
  } catch (error) {
    console.error('Error generating image:', error);
    alert('Hubo un error generando la imagen del recibo.');
  } finally {
    document.body.removeChild(container);
  }
};
