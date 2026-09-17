import { cobranzaEnabled } from "@/server/cobranza/flag";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";

export default function CobranzaSettingsPage() {
  if (!cobranzaEnabled()) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Ajustes de Cobranza (Integraciones)</h1>
      <p className="text-muted-foreground">
        Instrucciones para configurar las variables de entorno necesarias para el motor de cobranza y notificaciones.
      </p>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Integración con n8n</h2>
        <p className="text-sm text-muted-foreground">
          Para que el motor de cobranza pueda comunicarse con el flujo de n8n, asegúrate de configurar la clave API en tu archivo <code>.env</code>.
        </p>
        <div className="bg-slate-100 p-4 rounded text-sm font-mono text-slate-800">
          COBRANZA_API_KEY=tu_clave_secreta_aqui
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Esta clave es utilizada internamente para autorizar llamadas seguras entre los servicios.
        </p>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Configuración de SMTP</h2>
        <p className="text-sm text-muted-foreground">
          Si el flujo de cobranza envía correos electrónicos, debes proveer la configuración SMTP en el servidor. Configura las siguientes variables:
        </p>
        <div className="bg-slate-100 p-4 rounded text-sm font-mono text-slate-800 space-y-1">
          <p>COBRANZA_SMTP_HOST=smtp.tuservidor.com</p>
          <p>COBRANZA_SMTP_PORT=587</p>
          <p>COBRANZA_SMTP_USER=usuario@tuservidor.com</p>
          <p>COBRANZA_SMTP_PASS=tu_contraseña</p>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Contacta a tu proveedor de correo para obtener estos datos si no los conoces.
        </p>
      </Card>
    </div>
  );
}
