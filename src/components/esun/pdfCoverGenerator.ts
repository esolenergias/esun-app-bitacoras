import html2pdf from 'html2pdf.js';
import type { ObraApp } from './types';

export const generateCoverPDF = async (obra: ObraApp) => {
    // 816px x 1056px is standard Letter size at 96 DPI
    const html = `
<div style="width: 816px; height: 1056px; position: relative; overflow: hidden; background-color: #FFFFFF; color: #141410; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  
  <!-- Fondo de marca de agua muy sutil -->
  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;">
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #FFFFFF;"></div>
  </div>

  <!-- Contenido -->
  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 2; display: flex; flex-direction: column; padding: 60px;">
    
    <!-- Logo y Cabecera -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; margin-bottom: 30px;">
      <img src="${window.location.origin}/Logo_esol_b.png" style="height: 80px; object-fit: contain;" crossorigin="anonymous" onerror="this.style.display='none'" />
      <div style="text-align: right; color: #C49825; font-family: 'Times New Roman', serif;">
        <div style="font-size: 20px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">Ingeniería Solar Industrial</div>
        <div style="font-size: 14px; margin-top: 8px; letter-spacing: 1px; color: #666666;">EPC & Gestión Energética</div>
      </div>
    </div>

    <!-- Línea Dorada (Padding removido abajo) -->
    <div style="width: 100%; height: 3px; background: linear-gradient(to right, #C49825, transparent); margin-bottom: 24px;"></div>

    <!-- Título Principal -->
    <div>
      <h1 style="font-size: 56px; font-weight: 900; margin: 0; line-height: 1.1; color: #141410; font-family: 'Times New Roman', serif; text-transform: uppercase; letter-spacing: 1px;">DOCUMENTACIÓN<br>OFICIAL DE PROYECTO</h1>
      <div style="font-size: 18px; color: #C49825; letter-spacing: 4px; margin-top: 15px; font-weight: bold; text-transform: uppercase;">EXPEDIENTE TÉCNICO</div>
    </div>

    <!-- Nueva Imagen Profesional -->
    <div style="width: 100%; height: 320px; margin-top: 40px; margin-bottom: 40px; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #EEEEEE; background-image: url('${window.location.origin}/crosssection_16x9.jpg'); background-size: cover; background-position: center center; background-repeat: no-repeat;">
    </div>

    <!-- Datos del Cliente (Empujado hacia abajo) -->
    <div style="margin-top: auto; background: #F9F9F9; border-left: 6px solid #C49825; padding: 35px; margin-bottom: 40px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding-bottom: 25px; width: 40%;">
            <div style="font-size: 14px; color: #666666; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">Cliente</div>
            <div style="font-size: 28px; color: #141410; font-weight: bold; line-height: 1.2;">${obra.cliente || 'ESOL Energías'}</div>
          </td>
          <td style="padding-bottom: 25px; width: 60%;">
            <div style="font-size: 14px; color: #666666; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">Proyecto</div>
            <div style="font-size: 28px; color: #C49825; font-weight: bold; line-height: 1.2;">${obra.nombre}</div>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding-bottom: 25px;">
            <div style="font-size: 14px; color: #666666; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">Ubicación de Instalación</div>
            <div style="font-size: 20px; color: #141410; line-height: 1.4;">${obra.ubicacion || 'No especificada'}</div>
          </td>
        </tr>
        <tr>
          <td style="width: 40%;">
            <div style="font-size: 14px; color: #666666; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">Fecha de Expediente</div>
            <div style="font-size: 18px; color: #141410;">${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </td>
          <td style="width: 60%;">
            <div style="font-size: 14px; color: #666666; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">Residente a Cargo</div>
            <div style="font-size: 18px; color: #141410;">${obra.residente || 'Equipo de Ingeniería ESOL'}</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Pie de página -->
    <div style="border-top: 1px solid #EEEEEE; padding-top: 25px; display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: #666666; letter-spacing: 1px; text-transform: uppercase;">
      <div>CONFIDENCIAL - PROPIEDAD EXCLUSIVA</div>
      <div>www.esolenergias.com</div>
    </div>
  </div>
</div>
`;

    const container = document.createElement('div');
    container.innerHTML = html;
    
    // Pass the element directly to avoid clipping
    const element = container.firstElementChild;

    const opt = {
      margin:       [0, 0, 0, 0], 
      filename:     `Portada_Proyecto_${obra.nombre.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 1.0 },
      html2canvas:  { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#FFFFFF' },
      jsPDF:        { unit: 'px', format: [816, 1056], orientation: 'portrait', hotfixes: ["px_scaling"] }
    };

    const win = window.open('about:blank', '_blank');

    try {
      const pdfBlob: Blob = await new Promise((resolve, reject) => {
        html2pdf()
          .set(opt)
          .from(element)
          .toPdf()
          .get('pdf')
          .then((pdf: any) => {
            resolve(pdf.output('blob'));
          })
          .catch(reject);
      });
      
      const blobUrl = URL.createObjectURL(pdfBlob);
      if (win) {
        win.location.replace(blobUrl);
      } else {
        window.open(blobUrl, '_blank');
      }
    } catch (err) {
      console.error(err);
      if (win) win.close();
      alert('Hubo un error al generar la portada. Revisa la consola.');
    }
};
