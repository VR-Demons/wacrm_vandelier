/**
 * collectionsSimulator.ts
 * Motor de Simulación de Cobranza (WhatsApp y Email)
 * 
 * Replica con precisión matemática la lógica de los flujos de n8n:
 * - EarlyBird (Preventivo: 1 a 5 días de anticipación)
 * - PayDay (Día de Pago: 0 días)
 * - Due (Atrasados WhatsApp: diffInDays < 0)
 * - Due Email (Atrasados Email: días de mora > 7 y correo válido)
 */

export interface ClientRecord {
  Folio?: string | number;
  folio?: string | number;
  Cliente?: string;
  cliente?: string;
  FechaExigibilidad?: string | Date;
  fechaExigibilidad?: string | Date;
  Producto?: string;
  producto?: string;
  Total?: number | string;
  total?: number | string;
  Pagado?: boolean;
  pagado?: boolean;
  Mora?: number;
  mora?: number;
  Telefono?: string;
  telefono?: string;
  Correo?: string;
  correo?: string;
  Email?: string;
  email?: string;
  Contacto?: string;
  contacto?: string;
  RFC?: string;
  Personalidad?: string;
  personalidad?: string;
  [key: string]: any;
}

export interface SimulatorConfig {
  flow_earlybird?: boolean | string;
  flow_payday?: boolean | string;
  flow_due?: boolean | string;
  flow_email?: boolean | string;
  test_mode?: boolean | string;
  test_phone?: string;
  whatsapp_template_media_id?: string;
}

export interface SimulationOptions {
  referenceDate?: Date | string; // Fecha en la que correría el cron (por defecto el próximo cron a las 9:00 AM)
  timeZone?: string;             // 'America/Mexico_City' (por defecto México)
  forceAllFlowsActive?: boolean; // Para simular qué pasaría si todo estuviera en true
  flow?: string;                 // 'ALL' | 'EarlyBird' | 'PayDay' | 'Due' | 'Email' (por defecto 'ALL')
  flows?: string[];              // ['EarlyBird', 'PayDay', ...]
}

export interface WhatsAppMessagePayload {
  flow: 'EarlyBird' | 'PayDay' | 'Due';
  producto: 'ARRENDAMIENTO' | 'PRESTAMO';
  phone: string;
  cliente: string;
  contacto: string;
  personalidad: 'FISICA' | 'MORAL';
  isMultiple: boolean;
  diffInDays: number;
  diasAtraso?: number;
  foliosCount: number;
  folios: (string | number)[];
  totalAmount: number;
  totalFormatted: string;
  template: string;
  variables: Record<string, any>;
  rawGroupItems: ClientRecord[];
}

export interface EmailMessagePayload {
  toEmail: string;
  subject: string;
  html: string;
  cliente: string;
  contacto: string;
  empresa: string;
  producto: string;
  personalidad: 'FISICA' | 'MORAL';
  diasAtraso: number;
  foliosCount: number;
  folios: (string | number)[];
  totalAmount: number;
  totalFormatted: string;
  referencias: string;
  rawGroupItems: ClientRecord[];
}

export interface SimulationSummary {
  referenceDateIso: string;
  referenceDateLocal: string;
  configuredDay: string;
  configuredTimeZone: string;
  configuredFlows: string[];
  totalExigibilidadInBase: number;
  totalAtrasadosInBase: number;
  totalWhatsAppMessages: number;
  totalEmails: number;
  totalAmountWhatsApp: number;
  totalAmountEmails: number;
  filteredWhatsAppMessages: number;
  filteredEmails: number;
  filteredAmountWhatsApp: number;
  filteredAmountEmails: number;
  countsByFlow: {
    earlyBird: number;
    payDay: number;
    dueWhatsApp: number;
    dueEmail: number;
  };
  countsByProduct: {
    arrendamiento: number;
    prestamo: number;
  };
  foliosByFlow: {
    earlyBird: number;
    payDay: number;
    dueWhatsApp: number;
    dueEmail: number;
  };
}

export interface SimulationResult {
  summary: SimulationSummary;
  whatsAppMessages: WhatsAppMessagePayload[];
  emails: EmailMessagePayload[];
}

// ==========================================
// HELPERS DE NORMALIZACIÓN Y FORMATO
// ==========================================

export const isValidContactName = (val: any): boolean => {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (
    !trimmed ||
    trimmed === '-' ||
    trimmed === '0' ||
    trimmed.toLowerCase() === 'n/a' ||
    trimmed.toLowerCase() === 'null'
  ) {
    return false;
  }
  if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(trimmed)) return false;
  const digits = (trimmed.match(/\d/g) || []).length;
  const letters = (trimmed.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/g) || []).length;
  return letters > digits;
};

export const formatDateLong = (fecha: any, timeZone = 'America/Mexico_City'): string => {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return String(fecha);
  return d.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone
  });
};

export const formatDateShort = (fecha: any, timeZone = 'America/Mexico_City'): string => {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return String(fecha);
  return d.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone
  });
};

export const formatCurrency = (monto: any): string => {
  const num = typeof monto === 'number' ? monto : parseFloat(String(monto || '').replace(/[$, ]/g, ''));
  if (!isNaN(num)) {
    return num.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }
  return '$0.00 MXN';
};

export const padRef = (folio: any): string => String(folio || '').padStart(6, '0');

export const normalizePhone = (rawVal: any, isTestMode: boolean, testPhone?: string): string => {
  if (isTestMode) return testPhone || '+525510163879';
  const raw = String(rawVal || '').replace(/\D/g, '');
  if (raw.length === 10) return '+52' + raw;
  if (raw.length === 12 && raw.startsWith('52')) return '+' + raw;
  if (raw.length === 13 && raw.startsWith('521')) return '+52' + raw.slice(3);
  return '+' + raw;
};

export const normalizeProduct = (prod: any): 'ARRENDAMIENTO' | 'PRESTAMO' => {
  const norm = String(prod || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
  return norm.includes('ARREND') ? 'ARRENDAMIENTO' : 'PRESTAMO';
};

export const normalizePersonalidad = (pers: any): 'FISICA' | 'MORAL' => {
  const norm = String(pers || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
  return norm === 'MORAL' ? 'MORAL' : 'FISICA';
};

export const normalizeTimeZone = (tz?: string): string => {
  if (!tz) return 'America/Mexico_City';
  const clean = tz.trim().toLowerCase();
  if (clean === 'mexico' || clean === 'cdmx' || clean === 'mx') return 'America/Mexico_City';
  return tz.trim();
};

export const getNextCronDate = (targetHour = 9, timeZone = 'America/Mexico_City', now = new Date()): string => {
  const normTz = normalizeTimeZone(timeZone);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: normTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = Object.fromEntries(formatter.formatToParts(now).map(p => [p.type, p.value]));
  const currentHour = parseInt(parts.hour || '0', 10);

  const d = new Date(Date.UTC(parseInt(parts.year || '1970', 10), parseInt(parts.month || '1', 10) - 1, parseInt(parts.day || '1', 10)));
  if (currentHour >= targetHour) {
    d.setUTCDate(d.getUTCDate() + 1);
  }

  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(targetHour).padStart(2, '0');

  return `${y}-${m}-${day}T${hh}:00:00`;
};

export const getTodayCronDate = (targetHour = 9, timeZone = 'America/Mexico_City', now = new Date()): string => {
  const normTz = normalizeTimeZone(timeZone);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: normTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = Object.fromEntries(formatter.formatToParts(now).map(p => [p.type, p.value]));
  const y = parts.year || '1970';
  const m = (parts.month || '1').padStart(2, '0');
  const day = (parts.day || '1').padStart(2, '0');
  const hh = String(targetHour).padStart(2, '0');

  return `${y}-${m}-${day}T${hh}:00:00`;
};

export const getTomorrowCronDate = (targetHour = 9, timeZone = 'America/Mexico_City', now = new Date()): string => {
  const normTz = normalizeTimeZone(timeZone);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: normTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = Object.fromEntries(formatter.formatToParts(now).map(p => [p.type, p.value]));
  const d = new Date(Date.UTC(parseInt(parts.year || '1970', 10), parseInt(parts.month || '1', 10) - 1, parseInt(parts.day || '1', 10)));
  d.setUTCDate(d.getUTCDate() + 1);

  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(targetHour).padStart(2, '0');

  return `${y}-${m}-${day}T${hh}:00:00`;
};

export const parseFlowFilter = (flow?: string, flows?: string[]): string[] => {
  if (flows && Array.isArray(flows) && flows.length > 0) {
    const list = flows.flatMap(f => f.split(',').map(s => s.trim().toUpperCase())).filter(Boolean);
    return list.length > 0 ? list : ['ALL'];
  }
  if (!flow || flow.trim() === '' || flow.trim().toUpperCase() === 'ALL') {
    return ['ALL'];
  }
  const list = flow.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
  return list.length > 0 ? list : ['ALL'];
};

export const matchesFlowFilter = (flowName: string, filters: string[]): boolean => {
  if (filters.includes('ALL')) return true;
  const upper = flowName.toUpperCase();
  for (const f of filters) {
    if (f === upper) return true;
    if (upper === 'EARLYBIRD' && (f === 'PREVENTIVO' || f === 'EARLY_BIRD')) return true;
    if (upper === 'PAYDAY' && (f === 'DIA_PAGO' || f === 'DIAPAGO' || f === 'PAY_DAY')) return true;
    if (upper === 'DUE' && (f === 'ATRASADOS' || f === 'MORA' || f === 'VENCIDOS' || f === 'DUEWHATSAPP' || f === 'DUE_WHATSAPP')) return true;
    if (upper === 'EMAIL' && (f === 'CORREO' || f === 'DUEEMAIL' || f === 'DUE_EMAIL' || f === 'MAIL')) return true;
  }
  return false;
};

// ==========================================
// MOTOR PRINCIPAL DE SIMULACIÓN
// ==========================================

export function simulateCollectionsRun(
  exigibilidadClients: ClientRecord[],
  atrasadosClients: ClientRecord[],
  config: SimulatorConfig,
  options: SimulationOptions = {}
): SimulationResult {
  const timeZone = normalizeTimeZone(options.timeZone);

  let resolvedRefDateStr: string;
  if (!options.referenceDate || options.referenceDate === 'next') {
    resolvedRefDateStr = getNextCronDate(9, timeZone);
  } else if (options.referenceDate === 'today') {
    resolvedRefDateStr = getTodayCronDate(9, timeZone);
  } else if (options.referenceDate === 'tomorrow') {
    resolvedRefDateStr = getTomorrowCronDate(9, timeZone);
  } else if (typeof options.referenceDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(options.referenceDate.trim())) {
    resolvedRefDateStr = `${options.referenceDate.trim()}T09:00:00`;
  } else if (options.referenceDate instanceof Date) {
    resolvedRefDateStr = options.referenceDate.toISOString();
  } else {
    resolvedRefDateStr = String(options.referenceDate);
  }

  const refDate = new Date(resolvedRefDateStr);

  const isEarlyBirdActive = options.forceAllFlowsActive
    ? true
    : config.flow_earlybird === true || config.flow_earlybird === 'true';
  const isPayDayActive = options.forceAllFlowsActive
    ? true
    : config.flow_payday === true || config.flow_payday === 'true';
  const isDueActive = options.forceAllFlowsActive
    ? true
    : config.flow_due === true || config.flow_due === 'true';
  const isEmailActive = options.forceAllFlowsActive
    ? true
    : config.flow_email === true || config.flow_email === 'true';
  const isTestMode = config.test_mode === true || config.test_mode === 'true';
  const testPhone = config.test_phone || '+525510163879';
  const headerMediaId = config.whatsapp_template_media_id ? String(config.whatsapp_template_media_id) : 'https://vandelierai.com/assets/template_header.png';

  const dateRefNormalized = new Date(refDate).setHours(0, 0, 0, 0);
  const oneDay = 24 * 60 * 60 * 1000;

  const whatsAppMessages: WhatsAppMessagePayload[] = [];
  const emails: EmailMessagePayload[] = [];

  // ----------------------------------------------------
  // 1. PROCESAMIENTO DE EXIGIBILIDAD (EarlyBird & PayDay)
  // ----------------------------------------------------
  const unpadExigClients = exigibilidadClients.filter(c => !(c.Pagado === true || c.pagado === true));

  // Cálculo individual de diffInDays
  const evaluatedExig = unpadExigClients.map(item => {
    const rawFecha = item.FechaExigibilidad || item.fechaExigibilidad;
    const dateA = new Date(rawFecha as any).setHours(0, 0, 0, 0);
    const diff = Math.round((dateA - dateRefNormalized) / oneDay);
    return {
      ...item,
      _diffInDays: diff < 0 ? -1 : diff
    };
  });

  // Agrupación por: diffInDays + "_" + Telefono + "_" + Producto
  const exigGroups: Record<string, { diffInDays: number; Telefono: string; Producto: string; items: any[] }> = {};

  for (const item of evaluatedExig) {
    const tel = String(item.Telefono || item.telefono || '').replace(/\D/g, '');
    const prod = normalizeProduct(item.Producto || item.producto);
    const key = `${item._diffInDays}_${tel}_${prod}`;

    if (!exigGroups[key]) {
      exigGroups[key] = {
        diffInDays: item._diffInDays,
        Telefono: tel,
        Producto: prod,
        items: []
      };
    }
    exigGroups[key].items.push(item);
  }

  // Filtrado y armado de EarlyBird & PayDay
  for (const group of Object.values(exigGroups)) {
    const isEB = group.diffInDays >= 1 && group.diffInDays <= 5 && isEarlyBirdActive;
    const isPD = group.diffInDays === 0 && isPayDayActive;

    if (!isEB && !isPD) continue;

    const flowType: 'EarlyBird' | 'PayDay' = isEB ? 'EarlyBird' : 'PayDay';
    const items = group.items;
    const item0 = items[0];
    const isMultiple = items.length > 1;
    const personalidad = normalizePersonalidad(item0.Personalidad || item0.personalidad);
    const isMoral = personalidad === 'MORAL';
    const prod = normalizeProduct(group.Producto);
    const isArrendamiento = prod === 'ARRENDAMIENTO';

    let contacto = '';
    if (isValidContactName(item0.Contacto || item0.contacto)) {
      contacto = String(item0.Contacto || item0.contacto).trim();
    } else if (isValidContactName(item0.Cliente || item0.cliente)) {
      contacto = String(item0.Cliente || item0.cliente).trim();
    } else {
      contacto = isMoral ? 'Representante Legal' : 'Cliente';
    }

    const empresa = String(item0.Cliente || item0.cliente || 'Empresa').trim();
    const phone = normalizePhone(group.Telefono, isTestMode, testPhone);

    const getProductWithArticle = (multi: boolean) => {
      if (isArrendamiento) return multi ? 'los arrendamientos' : 'el arrendamiento';
      return multi ? 'los préstamos' : 'el préstamo';
    };

    let templateName = '';
    let variables: Record<string, any> = {};
    const totalGroupAmount = items.reduce((sum, it) => sum + (Number(it.Total || it.total) || 0), 0);

    if (flowType === 'EarlyBird') {
      if (!isMultiple) {
        const folio = padRef(item0.Folio || item0.folio);
        const total = formatCurrency(item0.Total || item0.total);
        const fechaExig = formatDateLong(item0.FechaExigibilidad || item0.fechaExigibilidad, timeZone);
        const fechaLim = formatDateShort(item0.FechaExigibilidad || item0.fechaExigibilidad, timeZone);

        if (!isMoral) {
          templateName = 'recordatorio_pago_fisica_1';
          variables = {
            header_1: headerMediaId,
            nombre_contacto: contacto,
            tipo_producto: getProductWithArticle(false),
            numero_folio: folio,
            fecha_exigibilidad: fechaExig,
            monto_total: total,
            fecha_limite: fechaLim,
            numero_referencia: folio
          };
        } else {
          templateName = 'recordatorio_pago_moral_1';
          variables = {
            header_1: headerMediaId,
            nombre_contacto: contacto,
            tipo_producto: getProductWithArticle(false),
            numero_folio: folio,
            nombre_empresa: empresa,
            fecha_exigibilidad: fechaExig,
            monto_total: total,
            fecha_limite: fechaLim,
            numero_referencia: folio
          };
        }
      } else {
        const listaOperaciones = items
          .map(it => {
            const f = padRef(it.Folio || it.folio);
            const t = formatCurrency(it.Total || it.total);
            const fec = formatDateShort(it.FechaExigibilidad || it.fechaExigibilidad, timeZone);
            return `. Folio ${f}: ${t} (vence ${fec})`;
          })
          .join(' - ');

        const referencias = items.map(it => padRef(it.Folio || it.folio)).join(' / ');

        if (!isMoral) {
          templateName = 'recordatorio_pago_fisica_multi';
          variables = {
            header_1: headerMediaId,
            nombre_contacto: contacto,
            lista_operaciones: listaOperaciones,
            referencias_combinadas: referencias
          };
        } else {
          templateName = 'recordatorio_pago_moral_multi';
          variables = {
            header_1: headerMediaId,
            nombre_contacto: contacto,
            nombre_empresa: empresa,
            lista_operaciones: listaOperaciones,
            referencias_combinadas: referencias
          };
        }
      }
    } else {
      // PayDay
      if (!isMultiple) {
        const folio = padRef(item0.Folio || item0.folio);
        const total = formatCurrency(item0.Total || item0.total);

        if (!isMoral) {
          templateName = 'dia_pago_fisica_1';
          variables = {
            header_1: headerMediaId,
            contacto: contacto,
            producto: getProductWithArticle(false),
            folio: folio,
            total: total,
            referencia: folio
          };
        } else {
          templateName = 'dia_pago_moral_1';
          variables = {
            header_1: headerMediaId,
            contacto: contacto,
            producto: getProductWithArticle(false),
            folio: folio,
            empresa: empresa,
            total: total,
            referencia: folio
          };
        }
      } else {
        const listaOperaciones = items
          .map(it => {
            const f = padRef(it.Folio || it.folio);
            const t = formatCurrency(it.Total || it.total);
            return `. Folio ${f}: ${t}`;
          })
          .join(' - ');

        const referencias = items.map(it => padRef(it.Folio || it.folio)).join(' / ');

        if (!isMoral) {
          templateName = 'dia_pago_fisica_multi';
          variables = {
            header_1: headerMediaId,
            contacto: contacto,
            lista_operaciones: listaOperaciones,
            referencias: referencias
          };
        } else {
          templateName = 'dia_pago_moral_multi';
          variables = {
            header_1: headerMediaId,
            contacto: contacto,
            empresa: empresa,
            lista_operaciones: listaOperaciones,
            referencias: referencias
          };
        }
      }
    }

    // Limpieza de saltos de línea para Meta API
    for (const k of Object.keys(variables)) {
      if (typeof variables[k] === 'string') {
        variables[k] = variables[k].replace(/[\r\n]+/g, ' - ').trim();
      }
    }

    whatsAppMessages.push({
      flow: flowType,
      producto: prod,
      phone,
      cliente: empresa,
      contacto,
      personalidad,
      isMultiple,
      diffInDays: group.diffInDays,
      foliosCount: items.length,
      folios: items.map(it => it.Folio || it.folio),
      totalAmount: totalGroupAmount,
      totalFormatted: formatCurrency(totalGroupAmount),
      template: templateName,
      variables,
      rawGroupItems: items
    });
  }

  // ----------------------------------------------------
  // 2. PROCESAMIENTO DE ATRASADOS (Due WhatsApp & Email)
  // ----------------------------------------------------
  const unpadAtrasados = atrasadosClients.filter(c => !(c.Pagado === true || c.pagado === true));

  // Cálculo individual de días de atraso y sendMail
  const evaluatedAtrasados = unpadAtrasados.map(item => {
    const rawFecha = item.FechaExigibilidad || item.fechaExigibilidad;
    const dateA = new Date(rawFecha as any).setHours(0, 0, 0, 0);
    const diff = Math.round((dateA - dateRefNormalized) / oneDay);
    const diasAtraso = diff < 0 ? Math.abs(diff) : 0;

    const rawEmail = item.Email || item.email || item.Correo || item.correo || '';
    const correoValido = rawEmail && String(rawEmail).trim() !== '' && String(rawEmail).includes('@');
    const sendMail = diasAtraso > 7 && !!correoValido;

    return {
      ...item,
      _diffInDays: diff < 0 ? -1 : diff,
      _diasAtraso: diasAtraso,
      _sendMail: sendMail,
      _emailClean: correoValido ? String(rawEmail).trim() : ''
    };
  });

  // Agrupación por: Telefono + "_" + Producto
  const atrasadosGroups: Record<
    string,
    {
      diffInDays: number;
      diasAtrasoMax: number;
      Telefono: string;
      Producto: string;
      sendMail: boolean;
      Email: string;
      items: any[];
    }
  > = {};

  for (const item of evaluatedAtrasados) {
    const tel = String(item.Telefono || item.telefono || '').replace(/\D/g, '');
    const prod = normalizeProduct(item.Producto || item.producto);
    const key = `${tel}_${prod}`;

    if (!atrasadosGroups[key]) {
      atrasadosGroups[key] = {
        diffInDays: item._diffInDays,
        diasAtrasoMax: item._diasAtraso,
        Telefono: tel,
        Producto: prod,
        sendMail: item._sendMail,
        Email: item._emailClean,
        items: []
      };
    } else {
      if (item._diasAtraso > atrasadosGroups[key].diasAtrasoMax) {
        atrasadosGroups[key].diasAtrasoMax = item._diasAtraso;
      }
      if (!atrasadosGroups[key].Email && item._emailClean) {
        atrasadosGroups[key].Email = item._emailClean;
      }
      atrasadosGroups[key].sendMail = atrasadosGroups[key].sendMail || item._sendMail;
    }
    atrasadosGroups[key].items.push(item);
  }

  // Filtrado y armado de Due WhatsApp & Due Email
  for (const group of Object.values(atrasadosGroups)) {
    const items = group.items;
    const item0 = items[0];
    const isMultiple = items.length > 1;
    const personalidad = normalizePersonalidad(item0.Personalidad || item0.personalidad);
    const isMoral = personalidad === 'MORAL';
    const prod = normalizeProduct(group.Producto);
    const isArrendamiento = prod === 'ARRENDAMIENTO';
    const totalGroupAmount = items.reduce((sum, it) => sum + (Number(it.Total || it.total) || 0), 0);

    let contacto = '';
    if (isValidContactName(item0.Contacto || item0.contacto)) {
      contacto = String(item0.Contacto || item0.contacto).trim();
    } else if (isValidContactName(item0.Cliente || item0.cliente)) {
      contacto = String(item0.Cliente || item0.cliente).trim();
    } else {
      contacto = isMoral ? 'Representante Legal' : 'Cliente';
    }

    const empresa = String(item0.Cliente || item0.cliente || 'Empresa').trim();
    const phone = normalizePhone(group.Telefono, isTestMode, testPhone);

    const getProductWithArticle = (multi: boolean) => {
      if (isArrendamiento) return multi ? 'los arrendamientos' : 'el arrendamiento';
      return multi ? 'los préstamos' : 'el préstamo';
    };

    // A. WhatsApp Due (Aviso de Adeudo)
    if (group.diffInDays < 0 && isDueActive) {
      let listaAdeudos = '';
      let referencias = '';

      if (items.length <= 3) {
        listaAdeudos = items
          .map(it => {
            const f = padRef(it.Folio || it.folio);
            const fec = formatDateShort(it.FechaExigibilidad || it.fechaExigibilidad, timeZone);
            const t = formatCurrency(it.Total || it.total);
            return `. Folio ${f} - Fecha Límite: ${fec} - ${t}`;
          })
          .join(' - ');
        referencias = items.map(it => padRef(it.Folio || it.folio)).join(', ');
      } else {
        const topItems = items.slice(0, 3);
        const remainingItems = items.slice(3);
        const remainingTotal = remainingItems.reduce((sum, it) => sum + (Number(it.Total || it.total) || 0), 0);

        const topLines = topItems.map(it => {
          const f = padRef(it.Folio || it.folio);
          const fec = formatDateShort(it.FechaExigibilidad || it.fechaExigibilidad, timeZone);
          const t = formatCurrency(it.Total || it.total);
          return `. Folio ${f} (${fec}): ${t}`;
        });

        topLines.push(`. (+${remainingItems.length} adeudos más: ${formatCurrency(remainingTotal)})`);
        listaAdeudos = topLines.join(' - ');

        const allRefs = items.map(it => padRef(it.Folio || it.folio)).join(', ');
        if (allRefs.length > 90) {
          const topRefs = items.slice(0, 4).map(it => padRef(it.Folio || it.folio)).join(', ');
          referencias = `${topRefs} (+${items.length - 4} más)`;
        } else {
          referencias = allRefs;
        }
      }

      let templateName = '';
      let variables: Record<string, any> = {};

      if (!isMoral) {
        templateName = 'aviso_adeudo_fisica';
        variables = {
          header_1: headerMediaId,
          cliente: contacto,
          producto: getProductWithArticle(isMultiple),
          lista_adeudos: listaAdeudos,
          referencias: referencias
        };
      } else {
        templateName = 'aviso_adeudo_moral';
        variables = {
          header_1: headerMediaId,
          contacto: contacto,
          producto: getProductWithArticle(isMultiple),
          empresa: empresa,
          lista_adeudos: listaAdeudos,
          referencias: referencias
        };
      }

      for (const k of Object.keys(variables)) {
        if (typeof variables[k] === 'string') {
          variables[k] = variables[k].replace(/[\r\n]+/g, ' - ').trim();
        }
      }

      whatsAppMessages.push({
        flow: 'Due',
        producto: prod,
        phone,
        cliente: empresa,
        contacto,
        personalidad,
        isMultiple,
        diffInDays: group.diffInDays,
        diasAtraso: group.diasAtrasoMax,
        foliosCount: items.length,
        folios: items.map(it => it.Folio || it.folio),
        totalAmount: totalGroupAmount,
        totalFormatted: formatCurrency(totalGroupAmount),
        template: templateName,
        variables,
        rawGroupItems: items
      });
    }

    // B. Email Due (Correo Cartera Vencida > 7 días)
    if (group.sendMail && group.Email && isEmailActive) {
      const productoText = isArrendamiento ? 'Arrendamiento' : 'Préstamo';
      const referenciasEmail = items.map(it => padRef(it.Folio || it.folio)).join(', ');

      const tableRows = items
        .map(
          it => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 12px; font-family: monospace; font-size: 13px;">${padRef(it.Folio || it.folio)}</td>
          <td style="padding: 10px 12px;">${formatDateLong(it.FechaExigibilidad || it.fechaExigibilidad, timeZone)}</td>
          <td style="padding: 10px 12px; text-align: right; font-weight: 600; color: #222;">${formatCurrency(it.Total || it.total)}</td>
        </tr>
      `
        )
        .join('');

      const html = `
<div style="font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #333333; line-height: 1.5; background-color: #f9f9fb; padding: 20px;">
  <div style="background-color: #0d1b2a; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
    <h2 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 1.5px; font-weight: 700;">VANDELIER</h2>
    <p style="color: #a4b3c6; margin: 6px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Notificación de Cartera Vencida</p>
  </div>
  <div style="padding: 28px 24px; border: 1px solid #e0e1dd; border-top: none; border-radius: 0 0 8px 8px; background-color: #ffffff;">
    <p style="font-size: 15px; margin-top: 0;">Estimado(a) <strong>${contacto}</strong>${isMoral ? ` (<strong>${empresa}</strong>)` : ''}:</p>
    <p style="font-size: 14px; color: #495057; line-height: 1.6;">
      Esperamos que se encuentre bien. Le informamos que a la fecha presenta montos pendientes correspondientes a su contrato de <strong>${productoText}</strong> con más de 7 días de atraso:
    </p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; background-color: #ffffff; border: 1px solid #e9ecef;">
      <thead>
        <tr style="background-color: #f1f3f5; text-align: left; border-bottom: 2px solid #dee2e6;">
          <th style="padding: 10px 12px; color: #495057;">Folio</th>
          <th style="padding: 10px 12px; color: #495057;">Fecha Límite</th>
          <th style="padding: 10px 12px; text-align: right; color: #495057;">Total Adeudo</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
      <tfoot>
        <tr style="background-color: #f8f9fa; font-weight: bold; border-top: 2px solid #dee2e6;">
          <td colspan="2" style="padding: 12px; color: #212529; font-size: 14px;">Total Pendiente:</td>
          <td style="padding: 12px; text-align: right; color: #b7094c; font-size: 15px;">${formatCurrency(totalGroupAmount)}</td>
        </tr>
      </tfoot>
    </table>

    <div style="background-color: #f8f9fa; border-left: 4px solid #1b4965; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <h4 style="margin: 0 0 12px 0; color: #1b4965; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Datos para Depósito / Transferencia</h4>
      <p style="margin: 4px 0; font-size: 13px;"><strong>Titular:</strong> BANCO COVALTO SA DE IBM FID 1444</p>
      <p style="margin: 4px 0; font-size: 13px;"><strong>Banco:</strong> BBVA</p>
      <p style="margin: 4px 0; font-size: 13px;"><strong>Cuenta:</strong> 0125218543</p>
      <p style="margin: 4px 0; font-size: 13px;"><strong>CLABE:</strong> 012180001252185431</p>
      <p style="margin: 4px 0; font-size: 13px;"><strong>Referencia:</strong> <code style="background-color: #e9ecef; padding: 2px 6px; border-radius: 3px; font-size: 13px;">${referenciasEmail}</code></p>
      <p style="margin: 4px 0; font-size: 13px;"><strong>Fecha Límite:</strong> <span style="color: #b7094c; font-weight: bold;">INMEDIATO</span></p>
    </div>

    <p style="font-size: 12px; color: #6c757d; line-height: 1.5; margin: 20px 0 0 0;">
      Recuerde que el atraso en los pagos afecta el historial crediticio de la persona moral, representantes y avales ante las sociedades de información crediticia.<br>
      Si ya realizó su pago, por favor haga caso omiso de este correo o envíenos su comprobante a este medio.
    </p>

    <hr style="border: none; border-top: 1px solid #e9ecef; margin: 24px 0;" />
    <p style="font-size: 13px; color: #495057; margin: 0;">Atentamente,<br><strong style="color: #0d1b2a;">Equipo de Cobranza Vandelier</strong></p>
  </div>
</div>
      `;

      emails.push({
        toEmail: group.Email,
        subject: `Aviso de Adeudo Pendiente - ${productoText} (Ref: ${referenciasEmail})`,
        html,
        cliente: empresa,
        contacto,
        empresa,
        producto: prod,
        personalidad,
        diasAtraso: group.diasAtrasoMax,
        foliosCount: items.length,
        folios: items.map(it => it.Folio || it.folio),
        totalAmount: totalGroupAmount,
        totalFormatted: formatCurrency(totalGroupAmount),
        referencias: referenciasEmail,
        rawGroupItems: items
      });
    }
  }

  // ----------------------------------------------------
  // 3. GENERACIÓN DEL RESUMEN GLOBAL Y FILTRADO POR FLUJO
  // ----------------------------------------------------
  const countsByFlow = {
    earlyBird: whatsAppMessages.filter(m => m.flow === 'EarlyBird').length,
    payDay: whatsAppMessages.filter(m => m.flow === 'PayDay').length,
    dueWhatsApp: whatsAppMessages.filter(m => m.flow === 'Due').length,
    dueEmail: emails.length
  };

  const foliosByFlow = {
    earlyBird: whatsAppMessages.filter(m => m.flow === 'EarlyBird').reduce((s, m) => s + m.foliosCount, 0),
    payDay: whatsAppMessages.filter(m => m.flow === 'PayDay').reduce((s, m) => s + m.foliosCount, 0),
    dueWhatsApp: whatsAppMessages.filter(m => m.flow === 'Due').reduce((s, m) => s + m.foliosCount, 0),
    dueEmail: emails.reduce((s, m) => s + m.foliosCount, 0)
  };

  const countsByProduct = {
    arrendamiento: whatsAppMessages.filter(m => m.producto === 'ARRENDAMIENTO').length,
    prestamo: whatsAppMessages.filter(m => m.producto === 'PRESTAMO').length
  };

  const totalAmountWhatsApp = whatsAppMessages.reduce((sum, m) => sum + m.totalAmount, 0);
  const totalAmountEmails = emails.reduce((sum, m) => sum + m.totalAmount, 0);

  // Filtrado de mensajes por tipo de flujo (por defecto 'ALL' - todos)
  const configuredFlows = parseFlowFilter(options.flow, options.flows);
  const isFilterAll = configuredFlows.includes('ALL');

  const filteredWhatsAppMessages = isFilterAll
    ? whatsAppMessages
    : whatsAppMessages.filter(m => matchesFlowFilter(m.flow, configuredFlows));

  const filteredEmails = isFilterAll
    ? emails
    : emails.filter(e => matchesFlowFilter('Email', configuredFlows) || matchesFlowFilter('Due', configuredFlows));

  const filteredAmountWhatsApp = filteredWhatsAppMessages.reduce((sum, m) => sum + m.totalAmount, 0);
  const filteredAmountEmails = filteredEmails.reduce((sum, m) => sum + m.totalAmount, 0);

  return {
    summary: {
      referenceDateIso: refDate.toISOString(),
      referenceDateLocal: refDate.toLocaleString('es-MX', { timeZone }),
      configuredDay: resolvedRefDateStr,
      configuredTimeZone: timeZone,
      configuredFlows,
      totalExigibilidadInBase: exigibilidadClients.length,
      totalAtrasadosInBase: atrasadosClients.length,
      totalWhatsAppMessages: whatsAppMessages.length,
      totalEmails: emails.length,
      totalAmountWhatsApp,
      totalAmountEmails,
      filteredWhatsAppMessages: filteredWhatsAppMessages.length,
      filteredEmails: filteredEmails.length,
      filteredAmountWhatsApp,
      filteredAmountEmails,
      countsByFlow,
      countsByProduct,
      foliosByFlow
    },
    whatsAppMessages: filteredWhatsAppMessages,
    emails: filteredEmails
  };
}
