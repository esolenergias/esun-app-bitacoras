export const generarFolioCentralizado = (
  prefix: 'COT' | 'POL' | 'BIT' | 'PRE' | 'PER',
  clienteFinal?: string | null,
  idOrConsecutivo?: string | number | null,
  createdAt?: string | null
): string => {
  // Utilizamos la fecha de creación original (o la actual si no existe) para congelar el folio en el tiempo
  const d = createdAt ? new Date(createdAt) : new Date();
  const yy = d.getFullYear().toString().slice(-2);
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dateCode = `${yy}${mm}`;

  const sourceText = ((clienteFinal || '').trim() || 'ESOL');
  const stopWords = ['de', 'del', 'la', 'las', 'los', 'el', 'en', 'y', 'sa', 'cv', 's.a.', 'c.v.'];
  const words = sourceText
    .split(/\s+/)
    .filter(w => w.length > 0 && !stopWords.includes(w.toLowerCase()));

  let iniciales = '';
  if (words.length >= 2) {
    iniciales = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    iniciales = words[0].substring(0, 2).toUpperCase();
  } else if (words.length === 1 && words[0].length === 1) {
    iniciales = (words[0] + 'X').toUpperCase();
  } else {
    iniciales = 'ES';
  }

  iniciales = iniciales.replace(/[^A-Z]/g, 'X').padEnd(2, 'X');

  let consecutivo = '001';
  if (typeof idOrConsecutivo === 'number') {
    consecutivo = idOrConsecutivo.toString().padStart(3, '0');
  } else if (typeof idOrConsecutivo === 'string' && idOrConsecutivo.length > 0) {
    // Si es un ID alfanumérico (ej. Supabase UUID o nanoid), tomamos los primeros 3
    consecutivo = idOrConsecutivo.substring(0, 3).toUpperCase();
  }

  return `${prefix}-${dateCode}-${iniciales}-${consecutivo}`;
};
