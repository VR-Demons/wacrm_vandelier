import nodemailer from "nodemailer";

export async function sendCollectionEmail(
  to: string,
  subject: string,
  body: string
): Promise<void> {
  if (!process.env.COBRANZA_SMTP_HOST) {
    console.warn("No SMTP config, skipping collection email");
    return;
  }
  
  const transporter = nodemailer.createTransport({
    host: process.env.COBRANZA_SMTP_HOST,
    port: parseInt(process.env.COBRANZA_SMTP_PORT || "587"),
    secure: process.env.COBRANZA_SMTP_PORT === "465",
    auth: {
      user: process.env.COBRANZA_SMTP_USER,
      pass: process.env.COBRANZA_SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.COBRANZA_SMTP_FROM || `"Cobranza" <${process.env.COBRANZA_SMTP_USER}>`,
    to,
    subject,
    text: body,
  });
}
