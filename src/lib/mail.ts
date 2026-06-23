import nodemailer from "nodemailer";

function getTransporter() {
  const port = Number(process.env.SMTP_PORT ?? 465);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function isMailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  return "http://localhost:3000";
}

interface WelcomeEmailParams {
  to: string;
  name: string;
  locale: "en" | "es";
}

const subjects = {
  en: "Welcome to PictaVoz! 🗣️",
  es: "¡Bienvenido a PictaVoz! 🗣️",
};

const copy = {
  es: {
    tagline: "Comunicación visual para todos",
    greeting: (name: string) => `¡Hola ${name}!`,
    intro:
      "Gracias por sumarte a PictaVoz. Ya tenés todo listo para comunicarte con pictogramas claros, armar oraciones y escucharlas en voz alta.",
    features: [
      { emoji: "💬", title: "Comunicar", text: "Armá oraciones tocando pictogramas" },
      { emoji: "🎨", title: "Mi tablero", text: "Personalizá tu biblioteca a medida" },
      { emoji: "📷", title: "Crear", text: "Subí fotos y creá tus propios símbolos" },
    ],
    cta: "Empezar ahora",
    footer: "— El equipo de PictaVoz",
    footerNote: "Si no creaste esta cuenta, podés ignorar este correo.",
    textIntro:
      "Gracias por registrarte en PictaVoz. Abrí la app para explorar pictogramas, armar oraciones y crear los tuyos.",
  },
  en: {
    tagline: "Visual communication for everyone",
    greeting: (name: string) => `Hi ${name}!`,
    intro:
      "Thanks for joining PictaVoz. You're all set to communicate with clear pictograms, build sentences, and hear them aloud.",
    features: [
      { emoji: "💬", title: "Communicate", text: "Build sentences by tapping pictograms" },
      { emoji: "🎨", title: "My board", text: "Customize your personal pictogram library" },
      { emoji: "📷", title: "Create", text: "Upload photos and make your own symbols" },
    ],
    cta: "Get started",
    footer: "— The PictaVoz team",
    footerNote: "If you didn't create this account, you can ignore this email.",
    textIntro:
      "Thanks for signing up for PictaVoz. Open the app to explore pictograms, build sentences, and create your own.",
  },
} as const;

function buildHtml(name: string, locale: "en" | "es"): string {
  const safeName = escapeHtml(name);
  const t = copy[locale];
  const appUrl = getAppUrl();
  const loginUrl = `${appUrl}/${locale}/comunicar`;

  const featureRows = t.features
    .map(
      (f) => `
        <td width="33%" valign="top" style="padding: 6px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
            <tr>
              <td style="padding: 16px 12px; text-align: center;">
                <div style="font-size: 28px; line-height: 1; margin-bottom: 8px;">${f.emoji}</div>
                <div style="font-size: 13px; font-weight: 700; color: #4338ca; margin-bottom: 4px;">${f.title}</div>
                <div style="font-size: 12px; line-height: 1.45; color: #64748b;">${f.text}</div>
              </td>
            </tr>
          </table>
        </td>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>PictaVoz</title>
</head>
<body style="margin: 0; padding: 0; background-color: #6366f1; -webkit-text-size-adjust: 100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #6366f1 0%, #9333ea 50%, #f472b6 100%); background-color: #6366f1; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">
          <!-- Logo + brand -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="width: 72px; height: 72px; background-color: #ffffff; border-radius: 22px; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.18); font-size: 38px; line-height: 72px;">
                    🗣️
                  </td>
                </tr>
              </table>
              <div style="margin-top: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em; text-shadow: 0 2px 8px rgba(15, 23, 42, 0.15);">
                PictaVoz
              </div>
              <div style="margin-top: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: rgba(255, 255, 255, 0.92);">
                ${t.tagline}
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color: #ffffff; border-radius: 28px; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18); overflow: hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height: 6px; background: linear-gradient(90deg, #6366f1, #9333ea, #f472b6); background-color: #6366f1; font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding: 36px 32px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    <h1 style="margin: 0 0 12px; font-size: 24px; line-height: 1.25; font-weight: 800; color: #312e81;">
                      ${t.greeting(safeName)}
                    </h1>
                    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.65; color: #475569;">
                      ${t.intro}
                    </p>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                      <tr>${featureRows}</tr>
                    </table>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${loginUrl}" style="display: inline-block; padding: 16px 32px; background-color: #4f46e5; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 16px; box-shadow: 0 10px 24px rgba(79, 70, 229, 0.35);">
                            ${t.cta} →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 32px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    <p style="margin: 0; font-size: 14px; color: #64748b;">${t.footer}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer note -->
          <tr>
            <td align="center" style="padding: 20px 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5; color: rgba(255, 255, 255, 0.78);">
              ${t.footerNote}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildText(name: string, locale: "en" | "es"): string {
  const t = copy[locale];
  const appUrl = getAppUrl();
  return `${t.greeting(name)}

${t.textIntro}

${t.cta}: ${appUrl}/${locale}/comunicar

${t.footer}`;
}

export async function sendWelcomeEmail({
  to,
  name,
  locale,
}: WelcomeEmailParams): Promise<void> {
  if (!isMailConfigured()) {
    console.warn("SMTP not configured — skipping welcome email");
    return;
  }

  const from = process.env.MAIL_FROM ?? process.env.SMTP_USER;
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"PictaVoz" <${from}>`,
    to,
    subject: subjects[locale],
    text: buildText(name, locale),
    html: buildHtml(name, locale),
  });
}
