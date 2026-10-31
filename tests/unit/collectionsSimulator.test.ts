import { describe, it, expect } from 'vitest';
import {
  simulateCollectionsRun,
  type ClientRecord,
  type SimulatorConfig
} from "@/services/collectionsSimulator";

describe('collectionsSimulator', () => {
  const baseConfig: SimulatorConfig = {
    flow_earlybird: true,
    flow_payday: true,
    flow_due: true,
    flow_email: true,
    test_mode: false,
    whatsapp_template_media_id: '1109845575347729'
  };

  it('classifies EarlyBird (1 to 5 days before due date)', () => {
    // Reference date: 2026-10-31
    const exig: ClientRecord[] = [
      {
        Folio: 101,
        Cliente: 'Empresa Alfa SA de CV',
        Contacto: 'Juan Perez',
        FechaExigibilidad: '2026-11-04T18:00:00.000Z', // 4 days later
        Producto: 'ARRENDAMIENTO',
        Total: 50000,
        Pagado: false,
        Telefono: '5511223344',
        Personalidad: 'MORAL'
      }
    ];

    const res = simulateCollectionsRun(exig, [], baseConfig, {
      referenceDate: '2026-10-31T09:00:00-06:00'
    });

    expect(res.summary.countsByFlow.earlyBird).toBe(1);
    expect(res.whatsAppMessages.length).toBe(1);
    expect(res.whatsAppMessages[0]!.flow).toBe('EarlyBird');
    expect(res.whatsAppMessages[0]!.template).toBe('recordatorio_pago_moral_1');
    expect(res.whatsAppMessages[0]!.phone).toBe('+525511223344');
    expect(res.whatsAppMessages[0]!.diffInDays).toBe(4);
  });

  it('classifies PayDay (0 days difference)', () => {
    const exig: ClientRecord[] = [
      {
        Folio: 201,
        Cliente: 'Cliente Beta',
        Contacto: 'Carlos Ruiz',
        FechaExigibilidad: '2026-10-31T18:00:00.000Z', // Same day
        Producto: 'PRESTAMO',
        Total: 12000,
        Pagado: false,
        Telefono: '5522334455',
        Personalidad: 'FISICA'
      }
    ];

    const res = simulateCollectionsRun(exig, [], baseConfig, {
      referenceDate: '2026-10-31T09:00:00-06:00'
    });

    expect(res.summary.countsByFlow.payDay).toBe(1);
    expect(res.whatsAppMessages[0]!.flow).toBe('PayDay');
    expect(res.whatsAppMessages[0]!.template).toBe('dia_pago_fisica_1');
    expect(res.whatsAppMessages[0]!.diffInDays).toBe(0);
  });

  it('classifies Due WhatsApp and Due Email when diasAtraso > 7', () => {
    const atrasados: ClientRecord[] = [
      {
        Folio: 301,
        Cliente: 'Comercializadora Gamma SA de CV',
        Contacto: 'Maria Gomez',
        FechaExigibilidad: '2026-10-20T18:00:00.000Z', // 11 days past due
        Producto: 'ARRENDAMIENTO',
        Total: 35000,
        Pagado: false,
        Telefono: '5533445566',
        Email: 'maria@gamma.com',
        Personalidad: 'MORAL'
      }
    ];

    const res = simulateCollectionsRun([], atrasados, baseConfig, {
      referenceDate: '2026-10-31T09:00:00-06:00'
    });

    expect(res.summary.countsByFlow.dueWhatsApp).toBe(1);
    expect(res.summary.countsByFlow.dueEmail).toBe(1);
    expect(res.whatsAppMessages[0]!.flow).toBe('Due');
    expect(res.whatsAppMessages[0]!.template).toBe('aviso_adeudo_moral');
    expect(res.emails.length).toBe(1);
    expect(res.emails[0]!.toEmail).toBe('maria@gamma.com');
    expect(res.emails[0]!.subject).toContain('Arrendamiento');
  });

  it('groups multiple folios for the same phone and product', () => {
    const exig: ClientRecord[] = [
      {
        Folio: 401,
        Cliente: 'Flotas del Norte SA',
        Contacto: 'Roberto',
        FechaExigibilidad: '2026-11-05T18:00:00.000Z',
        Producto: 'ARRENDAMIENTO',
        Total: 20000,
        Pagado: false,
        Telefono: '5544556677',
        Personalidad: 'MORAL'
      },
      {
        Folio: 402,
        Cliente: 'Flotas del Norte SA',
        Contacto: 'Roberto',
        FechaExigibilidad: '2026-11-05T18:00:00.000Z',
        Producto: 'ARRENDAMIENTO',
        Total: 30000,
        Pagado: false,
        Telefono: '5544556677',
        Personalidad: 'MORAL'
      }
    ];

    const res = simulateCollectionsRun(exig, [], baseConfig, {
      referenceDate: '2026-10-31T09:00:00-06:00'
    });

    expect(res.whatsAppMessages.length).toBe(1);
    expect(res.whatsAppMessages[0]!.isMultiple).toBe(true);
    expect(res.whatsAppMessages[0]!.template).toBe('recordatorio_pago_moral_multi');
    expect(res.whatsAppMessages[0]!.foliosCount).toBe(2);
    expect(res.whatsAppMessages[0]!.totalAmount).toBe(50000);
  });

  it('filters results by specific flow type and supports timezone aliases', () => {
    const exig: ClientRecord[] = [
      {
        Folio: 501,
        Cliente: 'Cliente Preventivo',
        FechaExigibilidad: '2026-11-04T18:00:00.000Z',
        Producto: 'PRESTAMO',
        Total: 5000,
        Pagado: false,
        Telefono: '5511112222',
        Personalidad: 'FISICA'
      },
      {
        Folio: 502,
        Cliente: 'Cliente Hoy',
        FechaExigibilidad: '2026-10-31T18:00:00.000Z',
        Producto: 'PRESTAMO',
        Total: 8000,
        Pagado: false,
        Telefono: '5533334444',
        Personalidad: 'FISICA'
      }
    ];

    // Filter by PayDay only with timezone 'mexico'
    const resPayDayOnly = simulateCollectionsRun(exig, [], baseConfig, {
      referenceDate: '2026-10-31T09:00:00-06:00',
      timeZone: 'mexico',
      flow: 'PayDay'
    });

    expect(resPayDayOnly.summary.configuredTimeZone).toBe('America/Mexico_City');
    expect(resPayDayOnly.summary.configuredFlows).toEqual(['PAYDAY']);
    expect(resPayDayOnly.whatsAppMessages.length).toBe(1);
    expect(resPayDayOnly.whatsAppMessages[0]!.flow).toBe('PayDay');
    expect(resPayDayOnly.whatsAppMessages[0]!.folios).toEqual([502]);

    // Filter by EarlyBird only
    const resEarlyBirdOnly = simulateCollectionsRun(exig, [], baseConfig, {
      referenceDate: '2026-10-31T09:00:00-06:00',
      flow: 'EarlyBird'
    });

    expect(resEarlyBirdOnly.whatsAppMessages.length).toBe(1);
    expect(resEarlyBirdOnly.whatsAppMessages[0]!.flow).toBe('EarlyBird');
    expect(resEarlyBirdOnly.whatsAppMessages[0]!.folios).toEqual([501]);
  });

  it('defaults to next cron date when referenceDate is omitted or "next"', () => {
    const res = simulateCollectionsRun([], [], baseConfig, {
      referenceDate: 'next',
      timeZone: 'America/Mexico_City'
    });

    expect(res.summary.configuredDay).toMatch(/^\d{4}-\d{2}-\d{2}T09:00:00$/);
    expect(res.summary.configuredTimeZone).toBe('America/Mexico_City');
    expect(res.summary.configuredFlows).toEqual(['ALL']);
  });
});
