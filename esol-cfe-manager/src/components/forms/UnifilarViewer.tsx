import React, { useState, useRef, useEffect } from 'react';
import { CFERequest } from '../../types';

interface UnifilarViewerProps {
  formData: Partial<CFERequest>;
}

export function UnifilarViewer({ formData }: UnifilarViewerProps) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSensitivity = 0.002;
      setScale(s => Math.min(Math.max(0.2, s - e.deltaY * zoomSensitivity), 5));
    };
    const overlay = svgRef.current?.querySelector('#diagram-overlay');
    if (overlay) {
      overlay.addEventListener('wheel', handleWheelNative, { passive: false });
    }
    return () => {
      if (overlay) {
        overlay.removeEventListener('wheel', handleWheelNative);
      }
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !svgRef.current) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    // Convert screen dx/dy to SVG viewBox coordinates
    const rect = svgRef.current.getBoundingClientRect();
    const ratioX = 1800 / rect.width;
    const ratioY = 1200 / rect.height;

    setPan(prev => ({
      x: prev.x + dx * ratioX,
      y: prev.y + dy * ratioY
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const uf = formData.unifilar || {} as any;
  const client = formData.client || {} as any;
  const location = formData.location || {} as any;

  const totalKw = (((uf.panelsPerString || 0) * (uf.numberOfStrings || 0) * (uf.panelPower || 0)) / 1000).toFixed(2);
  const numStrings = uf.numberOfStrings || 1;
  const strings = Array.from({ length: numStrings });

  const startY_min = 350;
  const startY_step = 200;
  const startY_max = 350 + (numStrings - 1) * startY_step;
  const invCenterY = (startY_min + startY_max) / 2;
  const invHeight = Math.max(200, (startY_max - startY_min) + 100);

  const safeText = (text: string | number | null | undefined, max: number) => {
    if (!text && text !== 0) return '-';
    const str = String(text);
    return str.length > max ? str.substring(0, max) + '...' : str;
  };

  return (
    <div className="w-full relative overflow-hidden bg-[#e5e5e5] border border-gray-400 p-2 shadow-inner" style={{ aspectRatio: '3/2', minWidth: '800px' }}>
      <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 1800 1200" className="bg-[#f0f0f0] font-sans" style={{ fontFamily: 'Arial, sans-serif' }}>
          {/* Page Margin */}
          <defs>
            <clipPath id="diagramClip">
              <rect x="60" y="150" width="1380" height="815" />
            </clipPath>
          </defs>
          <rect x="40" y="40" width="1720" height="1120" fill="#fcfcfc" stroke="none" />
          <rect x="50" y="50" width="1700" height="1100" fill="none" stroke="black" strokeWidth="4" />
          <rect x="60" y="60" width="1680" height="1080" fill="none" stroke="black" strokeWidth="2" />
          
          {/* Título Principal */}
          <text x="800" y="130" fontSize="32" fontWeight="bold" textAnchor="middle" fill="black">SISTEMA FOTOVOLTAICO INTERCONECTADO A LA RED DE {totalKw} kW</text>

          {/* ======== SOLAPA DERECHA ======== */}
          <line x1="1440" y1="60" x2="1440" y2="1140" stroke="black" strokeWidth="2" />
          
          <text x="1590" y="100" fontSize="18" fontWeight="bold" textAnchor="middle">MACROLOCALIZACIÓN</text>
          {location.mapScreenshot ? (
              <image href={location.mapScreenshot} x="1465" y="120" width="250" height="180" preserveAspectRatio="xMidYMid slice" />
          ) : (
              <rect x="1465" y="120" width="250" height="180" fill="#e5e5e5" />
          )}
          <rect x="1465" y="120" width="250" height="180" fill="none" stroke="black" strokeWidth="2" />

          <line x1="1440" y1="330" x2="1740" y2="330" stroke="black" strokeWidth="2" />
          <text x="1590" y="360" fontSize="18" fontWeight="bold" textAnchor="middle">UBICACIÓN</text>
          <text x="1460" y="395" fontSize="14">LATITUD: <tspan fontWeight="bold">{safeText(location.lat, 20)}</tspan></text>
          <text x="1460" y="425" fontSize="14">LONGITUD: <tspan fontWeight="bold">{safeText(location.lng, 20)}</tspan></text>
          <text x="1590" y="465" fontSize="18" fontWeight="bold" textAnchor="middle">DIRECCIÓN</text>
          <text x="1460" y="495" fontSize="13">CALLE: {safeText(client.address, 35)}</text>
          <text x="1460" y="520" fontSize="13">LOCALIDAD: {safeText(`${client.municipality || ''}, ${client.state || ''}`, 35)}</text>
          <text x="1460" y="545" fontSize="13">CÓDIGO POSTAL: {safeText(client.zipCode, 15)}</text>

          <line x1="1440" y1="570" x2="1740" y2="570" stroke="black" strokeWidth="2" />
          <text x="1590" y="600" fontSize="18" fontWeight="bold" textAnchor="middle">INTEGRADOR</text>
          <text x="1460" y="630" fontSize="14">NOMBRE:</text>
          <text x="1460" y="655" fontSize="16" fontWeight="bold">{safeText(formData.cartaPoder?.grantedTo || 'ESOL - ENERGY SOLARES', 25)}</text>
          <text x="1460" y="685" fontSize="14">E-MAIL:</text>
          <text x="1460" y="705" fontSize="16" fontWeight="bold">contacto@esol.com.mx</text>

          <line x1="1440" y1="730" x2="1740" y2="730" stroke="black" strokeWidth="2" />
          <text x="1590" y="760" fontSize="15" fontWeight="bold" textAnchor="middle">CARACTERÍSTICAS DEL SISTEMA</text>
          <text x="1460" y="795" fontSize="14">CAPACIDAD: {totalKw} kW</text>
          <text x="1460" y="825" fontSize="14">NÚMERO DE MFV: {(uf.panelsPerString || 0) * (uf.numberOfStrings || 0)}</text>
          <text x="1460" y="855" fontSize="14">NÚMERO DE INVERSORES: {uf.inverterQuantity || 1}</text>
          <text x="1460" y="885" fontSize="14">SOLUCIÓN DE MONTAJE:</text>
          <text x="1460" y="910" fontSize="14" fontWeight="bold">{safeText(uf.mountingSolution, 25)}</text>
          <text x="1460" y="940" fontSize="14">FECHA OPERACIÓN: {formData.cartaPoder?.date ? new Date(formData.cartaPoder.date).toLocaleDateString('es-MX') : '-'}</text>

          <line x1="1440" y1="965" x2="1740" y2="965" stroke="black" strokeWidth="2" />
          <text x="1590" y="985" fontSize="16" fontWeight="bold" textAnchor="middle" fill="black" style={{ letterSpacing: '1px' }}>CÉDULA DE CABLEADOS</text>
          
          {/* Cédula Box 1 */}
          <rect x="1450" y="1000" width="135" height="130" fill="none" stroke="black" strokeWidth="1" />
          <text x="1517" y="1015" fontSize="9" fontWeight="bold" textAnchor="middle" fill="black">CANALIZACIONES</text>
          
          <circle cx="1517" cy="1040" r="14" fill="none" stroke="red" strokeWidth="2" />
          <text x="1517" y="1045" fontSize="13" fill="red" fontWeight="bold" textAnchor="middle">C1</text>
          
          <text x="1517" y="1070" fontSize="9" fill="black" fontWeight="bold" textAnchor="middle">1 CANALIZACIÓN</text>
          <text x="1517" y="1085" fontSize="9" fill="black" fontWeight="bold" textAnchor="middle">TUBO CONDUIT</text>
          <text x="1517" y="1100" fontSize="9" fill="black" textAnchor="middle">AISLAMIENTO 90°C</text>
          <text x="1517" y="1115" fontSize="9" fill="black" textAnchor="middle">CALIBRE CA: {safeText(uf.acWireGauge, 10)}</text>

          {/* Cédula Box 2 */}
          <rect x="1595" y="1000" width="135" height="130" fill="none" stroke="black" strokeWidth="1" />
          <text x="1662" y="1015" fontSize="9" fontWeight="bold" textAnchor="middle" fill="black">CARACT. CIRCUITOS</text>
          
          <circle cx="1662" cy="1040" r="14" fill="none" stroke="black" strokeWidth="2" />
          <text x="1662" y="1045" fontSize="14" fill="black" fontWeight="bold" textAnchor="middle">1</text>
          
          <text x="1662" y="1070" fontSize="9" fill="black" fontWeight="bold" textAnchor="middle">CADENAS FV</text>
          <text x="1662" y="1085" fontSize="8" fill="black" textAnchor="middle">POS/NEG CD: {safeText(uf.dcWireGauge, 10)}</text>
          <text x="1662" y="1100" fontSize="8" fill="black" textAnchor="middle">Vmp: {safeText(((uf.panelsPerString||0)*(uf.panelVmp||0)).toFixed(1), 6)}V</text>
          <text x="1662" y="1115" fontSize="8" fill="black" textAnchor="middle">Imp: {safeText(uf.panelImp, 6)}A</text>


          {/* ======== BOTTOM BANNER ======== */}
          <line x1="60" y1="965" x2="1440" y2="965" stroke="black" strokeWidth="2" />
          
          {/* Abreviaturas */}
          <line x1="280" y1="965" x2="280" y2="1140" stroke="black" strokeWidth="2" />
          <text x="170" y="990" fontSize="16" fontWeight="bold" textAnchor="middle">ABREVIATURAS</text>
          <text x="70" y="1015" fontSize="11">V: VOLTS</text>
          <text x="70" y="1035" fontSize="11">A: AMPERES</text>
          <text x="70" y="1055" fontSize="11">W: WATTS</text>
          <text x="70" y="1075" fontSize="11">CPT: COND. PUESTA A TIERRA</text>
          <text x="70" y="1095" fontSize="11">CA: CORRIENTE ALTERNA</text>
          <text x="70" y="1115" fontSize="11">CD: CORRIENTE DIRECTA</text>
          <text x="70" y="1130" fontSize="11">ITM: INT. TERMOMAGNÉTICO</text>

          {/* Simbologia */}
          <line x1="760" y1="965" x2="760" y2="1140" stroke="black" strokeWidth="2" />
          <text x="520" y="990" fontSize="16" fontWeight="bold" textAnchor="middle">SIMBOLOGÍA</text>
          {/* Col 1 */}
          <rect x="300" y="1010" width="30" height="20" fill="none" stroke="black" strokeWidth="2" />
          <text x="340" y="1025" fontSize="14">MÓDULO FOTOVOLTAICO</text>
          
          <line x1="315" y1="1050" x2="315" y2="1075" stroke="black" strokeWidth="2" />
          <line x1="305" y1="1075" x2="325" y2="1075" stroke="black" strokeWidth="2" />
          <line x1="310" y1="1082" x2="320" y2="1082" stroke="black" strokeWidth="2" />
          <line x1="313" y1="1089" x2="317" y2="1089" stroke="black" strokeWidth="2" />
          <text x="340" y="1075" fontSize="14">PUESTA A TIERRA</text>
          
          <circle cx="315" cy="1115" r="8" fill="none" stroke="black" strokeWidth="2" />
          <path d="M 315,1115 L 295,1095 M 295,1115 L 305,1115" stroke="black" strokeWidth="2" fill="none" />
          <text x="340" y="1120" fontSize="14">INTERRUPTOR ITM</text>

          {/* Col 2 */}
          <path d="M 520,1010 L 540,1020 L 520,1030" stroke="black" strokeWidth="2" fill="none" />
          <line x1="540" y1="1020" x2="555" y2="1020" stroke="black" strokeWidth="2" />
          <line x1="555" y1="1010" x2="555" y2="1030" stroke="black" strokeWidth="2" />
          <text x="570" y="1025" fontSize="14">ACOMETIDA</text>
          
          <rect x="520" y="1055" width="25" height="25" fill="none" stroke="black" strokeWidth="2" />
          <line x1="520" y1="1055" x2="545" y2="1080" stroke="black" strokeWidth="2" />
          <text x="570" y="1073" fontSize="14">INVERSOR</text>

          <circle cx="530" cy="1115" r="14" fill="none" stroke="black" strokeWidth="2" />
          <text x="570" y="1120" fontSize="14">EQUIPO DE MEDICIÓN</text>

          {/* Notas */}
          <line x1="1170" y1="965" x2="1170" y2="1140" stroke="black" strokeWidth="2" />
          <line x1="760" y1="990" x2="1170" y2="990" stroke="black" strokeWidth="2" />
          <text x="965" y="983" fontSize="14" fontWeight="bold" textAnchor="middle">NOTAS DESCRIPTIVAS DE LOS EQUIPOS</text>
          <line x1="965" y1="990" x2="965" y2="1140" stroke="black" strokeWidth="2" />
          
          {/* Box A */}
          <circle cx="785" cy="1015" r="12" fill="none" stroke="red" strokeWidth="2" />
          <text x="785" y="1021" fontSize="14" fill="red" fontWeight="bold" textAnchor="middle">A</text>
          <text x="805" y="1010" fontSize="11" fontWeight="bold">CARACTERÍSTICAS DEL</text>
          <text x="805" y="1024" fontSize="11" fontWeight="bold">MÓDULO FV</text>
          <text x="775" y="1050" fontSize="11">MARCA: <tspan fontWeight="bold">{safeText(uf.panelBrand, 20)}</tspan></text>
          <text x="775" y="1070" fontSize="11">MODELO: <tspan fontWeight="bold">{safeText(uf.panelModel, 25)}</tspan></text>
          <text x="775" y="1095" fontSize="11">Voc: {safeText(uf.panelVoc, 10)} V</text>
          <text x="865" y="1095" fontSize="11">Isc: {safeText(uf.panelIsc, 10)} A</text>
          <text x="775" y="1120" fontSize="11">Vmp: {safeText(uf.panelVmp, 10)} V</text>
          <text x="865" y="1120" fontSize="11">Imp: {safeText(uf.panelImp, 10)} A</text>
          
          {/* Box B */}
          <circle cx="985" cy="1015" r="12" fill="none" stroke="blue" strokeWidth="2" />
          <text x="985" y="1021" fontSize="14" fill="blue" fontWeight="bold" textAnchor="middle">B</text>
          <text x="1005" y="1010" fontSize="11" fontWeight="bold">CARACTERÍSTICAS DEL</text>
          <text x="1005" y="1024" fontSize="11" fontWeight="bold">INVERSOR</text>
          <text x="975" y="1050" fontSize="11">MARCA: <tspan fontWeight="bold">{safeText(uf.inverterBrand, 20)}</tspan></text>
          <text x="975" y="1070" fontSize="11">MODELO: <tspan fontWeight="bold">{safeText(uf.inverterModel, 25)}</tspan></text>
          <text x="975" y="1090" fontSize="11">V MÁX IN: {safeText(uf.inverterVmaxIn, 8)} V</text>
          <text x="975" y="1105" fontSize="11">V MIN ARR: {safeText(uf.inverterVminIn, 8)} V</text>
          <text x="975" y="1120" fontSize="11">I MAX IN: {safeText(uf.inverterImaxIn, 8)} A</text>
          <text x="975" y="1135" fontSize="11">I MAX OUT: {safeText(uf.inverterImaxOut, 8)} A</text>

          {/* ESOL LOGO & INFO */}
          <image href="/assets/logos/Logo_esol_b.png" x="1205" y="975" width="200" height="60" preserveAspectRatio="xMidYMid meet" />
          
          <line x1="1170" y1="1040" x2="1440" y2="1040" stroke="black" strokeWidth="2" />
          <text x="1305" y="1060" fontSize="14" fontWeight="bold" textAnchor="middle">DIAGRAMA UNIFILAR USOS MÚLTIPLES</text>
          <line x1="1170" y1="1075" x2="1440" y2="1075" stroke="black" strokeWidth="2" />
          <text x="1180" y="1095" fontSize="12" fontWeight="bold">DISEÑADOR: INGENIERÍA ESOL</text>
          <line x1="1170" y1="1110" x2="1440" y2="1110" stroke="black" strokeWidth="2" />
          <text x="1180" y="1126" fontSize="12" fontWeight="bold">PLANO 1</text>
          <line x1="1300" y1="1110" x2="1300" y2="1140" stroke="black" strokeWidth="2" />
          <text x="1310" y="1126" fontSize="12" fontWeight="bold">{new Date().toLocaleDateString('es-MX')}</text>

          {/* ======== LINEAS Y DIAGRAMA ======== */}
          
          <g clipPath="url(#diagramClip)">
            <g style={{ transformOrigin: '750px 557px', transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}>
              {/* Cadenas (Strings) */}
              {strings.map((_, i) => {
             const startY = startY_min + (i * startY_step);
             return (
               <g key={`string-${i}`}>
                 <circle cx="170" cy={startY - 70} r="16" fill="none" stroke="red" strokeWidth="3" />
                 <text x="170" y={startY - 63} fontSize="18" fontWeight="bold" fill="red" textAnchor="middle">A</text>
                 <text x="210" y={startY - 65} fontSize="16" fill="black">MODELO: <tspan fontWeight="bold">{safeText(uf.panelModel, 20)}</tspan></text>
                 
                 {/* Modulo 1 */}
                 <rect x="170" y={startY - 40} width="60" height="80" fill="none" stroke="black" strokeWidth="3" />
                 <text x="200" y={startY + 10} fontSize="22" textAnchor="middle">1</text>
                 <line x1="230" y1={startY} x2="250" y2={startY} stroke="black" strokeWidth="3" />
                 
                 {/* Modulo 2 */}
                 <rect x="250" y={startY - 40} width="60" height="80" fill="none" stroke="black" strokeWidth="3" />
                 <text x="280" y={startY + 10} fontSize="22" textAnchor="middle">2</text>
                 <line x1="310" y1={startY} x2="330" y2={startY} stroke="black" strokeWidth="3" />

                 {/* Modulo 3 */}
                 <rect x="330" y={startY - 40} width="60" height="80" fill="none" stroke="black" strokeWidth="3" />
                 <text x="360" y={startY + 10} fontSize="22" textAnchor="middle">3</text>
                 <line x1="390" y1={startY} x2="410" y2={startY} stroke="black" strokeWidth="3" />

                 {/* Modulo 4 */}
                 <rect x="410" y={startY - 40} width="60" height="80" fill="none" stroke="black" strokeWidth="3" />
                 <text x="440" y={startY + 10} fontSize="22" textAnchor="middle">4</text>

                 {/* Linea Negativa a Tierra Grupal */}
                 <line x1="200" y1={startY + 40} x2="200" y2={startY + 70} stroke="black" strokeWidth="3" />
                 <line x1="280" y1={startY + 40} x2="280" y2={startY + 70} stroke="black" strokeWidth="3" />
                 <line x1="360" y1={startY + 40} x2="360" y2={startY + 70} stroke="black" strokeWidth="3" />
                 <line x1="440" y1={startY + 40} x2="440" y2={startY + 70} stroke="black" strokeWidth="3" />
                 <line x1="200" y1={startY + 70} x2="480" y2={startY + 70} stroke="black" strokeWidth="3" />
                 
                 {/* Linea Positiva hacia Derecha */}
                 <line x1="470" y1={startY} x2="550" y2={startY} stroke="black" strokeWidth="3" />
                 
                 {/* Circulo C1 Rojo */}
                 <circle cx="510" cy={startY - 30} r="15" fill="none" stroke="red" strokeWidth="3" />
                 <text x="510" y={startY - 24} fontSize="16" fill="red" fontWeight="bold" textAnchor="middle">C1</text>
                 
                 <circle cx="510" cy={startY} r="6" fill="red" />
                 <text x="530" y={startY - 10} fontSize="14" fill="red" fontWeight="bold">(+)</text>
                 
                 {/* Connection Negativa */}
                 <circle cx="510" cy={startY + 40} r="6" fill="black" />
                 <line x1="480" y1={startY + 70} x2="480" y2={startY + 40} stroke="black" strokeWidth="3" />
                 <line x1="480" y1={startY + 40} x2="550" y2={startY + 40} stroke="black" strokeWidth="3" />
                 
                 <line x1="510" y1={startY + 40} x2="510" y2={startY + 80} stroke="black" strokeWidth="3" />
                 <line x1="490" y1={startY + 80} x2="530" y2={startY + 80} stroke="black" strokeWidth="3" />
                 <line x1="500" y1={startY + 90} x2="520" y2={startY + 90} stroke="black" strokeWidth="3" />
                 <line x1="505" y1={startY + 100} x2="515" y2={startY + 100} stroke="black" strokeWidth="3" />

                 {/* Breaker DC (ITM) 2x25 A */}
                 <text x="610" y={startY - 40} fontSize="14" fontWeight="bold" textAnchor="middle">ITM</text>
                 <text x="610" y={startY - 25} fontSize="14" textAnchor="middle">2X25 A</text>
                 <path d="M 550,0 L 590,-25 M 590,0 L 640,0" stroke="black" strokeWidth="3" fill="none" transform={`translate(0, ${startY})`} />
                 <path d="M 550,0 L 590,-25 M 590,0 L 640,0" stroke="black" strokeWidth="3" fill="none" transform={`translate(0, ${startY + 40})`} />
                 <circle cx="590" cy={startY} r="5" fill="white" stroke="black" strokeWidth="3" />
                 <circle cx="590" cy={startY + 40} r="5" fill="white" stroke="black" strokeWidth="3" />

                 {/* SDP */}
                 <line x1="620" y1={startY + 40} x2="620" y2={startY + 70} stroke="black" strokeWidth="3" />
                 <rect x="610" y={startY + 70} width="20" height="30" fill="none" stroke="black" strokeWidth="3" />
                 <text x="620" y={startY + 115} fontSize="14" fontWeight="bold" textAnchor="middle">SDP</text>

                 {/* Conexion de ITM a Inversor */}
                 <line x1="640" y1={startY} x2="880" y2={startY} stroke="black" strokeWidth="3" />
                 <line x1="640" y1={startY + 40} x2="880" y2={startY + 40} stroke="black" strokeWidth="3" />
               </g>
             );
          })}

          {/* INVERSOR */}
          <circle cx="895" cy={invCenterY - invHeight / 2 - 35} r="16" fill="none" stroke="blue" strokeWidth="3" />
          <text x="895" y={invCenterY - invHeight / 2 - 28} fontSize="20" fill="blue" fontWeight="bold" textAnchor="middle">B</text>
          <text x="925" y={invCenterY - invHeight / 2 - 40} fontSize="18" fill="black" fontWeight="bold">INVERSOR {safeText(uf.inverterBrand?.toUpperCase(), 12)}</text>
          <text x="925" y={invCenterY - invHeight / 2 - 20} fontSize="14" fill="gray">MODELO: {safeText(uf.inverterModel, 20)}</text>
          
          <rect x="880" y={invCenterY - invHeight / 2} width="160" height={invHeight} fill="#ebebeb" stroke="black" strokeWidth="3" />
          <line x1="880" y1={invCenterY + invHeight / 2} x2="1040" y2={invCenterY - invHeight / 2} stroke="black" strokeWidth="2" />
          <text x="920" y={invCenterY - 20} fontSize="40" fontWeight="bold" textAnchor="middle" fill="black">=</text>
          <path d={`M 970,${invCenterY + 40} Q 990,${invCenterY + 20} 1010,${invCenterY + 40} T 1050,${invCenterY + 40}`} transform={`translate(-40, -20)`} fill="none" stroke="black" strokeWidth="4" />


          {/* LADO DE ALTERNA (CA) */}
          <line x1="1040" y1={invCenterY} x2="1120" y2={invCenterY} stroke="black" strokeWidth="4" />
          
          <text x="1180" y={invCenterY - 35} fontSize="14" fontWeight="bold" textAnchor="middle">ITM</text>
          <text x="1180" y={invCenterY - 20} fontSize="14" textAnchor="middle">2X40 A</text>
          
          <circle cx="1160" cy={invCenterY} r="7" fill="white" stroke="black" strokeWidth="4" />
          <path d="M 1120,0 L 1160,-30 M 1160,0 L 1220,0" stroke="black" strokeWidth="4" fill="none" transform={`translate(0, ${invCenterY})`} />
          
          <line x1="1220" y1={invCenterY} x2="1320" y2={invCenterY} stroke="black" strokeWidth="4" />
          
          {/* Sube hacia la Acometida */}
          <line x1="1320" y1={invCenterY} x2="1320" y2={280} stroke="black" strokeWidth="4" />
          
          {/* Medidor Dinámico */}
          {(() => {
             const medidorY = (invCenterY + 280) / 2;
             return (
               <g>
                 <circle cx="1320" cy={medidorY} r="25" fill="#fcfcfc" stroke="black" strokeWidth="4" />
                 <text x="1360" y={medidorY + 5} fontSize="14" fontWeight="bold">EQUIPO DE MEDICIÓN</text>
                 <text x="1295" y={medidorY + 60} fontSize="12" fontWeight="bold" transform={`rotate(-90 1295,${medidorY + 60})`}>
                    CAL: {safeText(uf.acWireGauge, 25)} THHW-LS 90°C
                 </text>
               </g>
             );
          })()}

          {/* Acometida CFE y Linea CFE */}
          <path d="M 1300,240 L 1340,260 L 1300,280" fill="none" stroke="black" strokeWidth="4" />
          <line x1="1320" y1="280" x2="1320" y2="280" stroke="black" strokeWidth="4" /> 
          <line x1="1340" y1="260" x2="1365" y2="260" stroke="black" strokeWidth="4" />
          <line x1="1365" y1="235" x2="1365" y2="285" stroke="black" strokeWidth="4" />
          
          <line x1="1320" y1="240" x2="1320" y2="180" stroke="black" strokeWidth="4" />
          
          <line x1="1200" y1="180" x2="1420" y2="180" stroke="black" strokeWidth="6" />
          <text x="1320" y="165" fontSize="20" fontWeight="bold" textAnchor="middle">LÍNEA CFE</text>
            </g>
          </g>

          {/* Interactive Overlay for Pan/Zoom inside the diagram area */}
          <rect id="diagram-overlay" x="60" y="150" width="1380" height="815" fill="transparent"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          />

      </svg>
    </div>
  );
}