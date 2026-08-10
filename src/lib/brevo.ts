import { env } from '@/lib/env'

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'

type EmailRecipient = { email: string; name?: string }

type SendEmailParams = {
  to: EmailRecipient[]
  subject: string
  htmlContent: string
}

/**
 * Envoie un email transactionnel via l'API Brevo.
 * Lève une erreur si Brevo refuse l'envoi — l'appelant décide quoi en faire.
 */
export async function sendBrevoEmail({ to, subject, htmlContent }: SendEmailParams): Promise<void> {
  const response = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME },
      to,
      subject,
      htmlContent,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Brevo a refusé l'envoi (HTTP ${response.status}) : ${detail}`)
  }
}

/**
 * Échappe le contenu injecté dans le HTML de l'email (le nom vient de la base).
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function buildVerifyEmail(url: string, name?: string): string {
  const greeting = name ? `Bonjour ${escapeHtml(name)},` : 'Bonjour,'

  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:24px;background-color:#f5f5f5;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#1a1a1a;">
    <table role="presentation" style="max-width:520px;margin:0 auto;background-color:#ffffff;border-radius:8px;padding:32px;">
      <tr>
        <td>
          <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;">Confirmez votre adresse email</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">${greeting}</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
            Bienvenue sur Estaple. Il ne reste qu'une chose à faire : confirmer votre adresse
            email pour activer votre compte. Ce lien est valable 24 heures.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${url}" style="display:inline-block;padding:12px 20px;background-color:#4f46e5;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;">
              Confirmer mon adresse
            </a>
          </p>
          <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#555555;">
            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
          </p>
          <p style="margin:0 0 24px;font-size:13px;line-height:1.6;word-break:break-all;">
            <a href="${url}" style="color:#4f46e5;">${url}</a>
          </p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#555555;">
            Vous n'êtes pas à l'origine de cette inscription ? Ignorez cet email, aucun compte ne sera activé.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export function buildResetPasswordEmail(url: string, name?: string): string {
  const greeting = name ? `Bonjour ${escapeHtml(name)},` : 'Bonjour,'

  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:24px;background-color:#f5f5f5;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#1a1a1a;">
    <table role="presentation" style="max-width:520px;margin:0 auto;background-color:#ffffff;border-radius:8px;padding:32px;">
      <tr>
        <td>
          <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;">Réinitialisation de votre mot de passe</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">${greeting}</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
            Vous avez demandé à réinitialiser votre mot de passe Estaple.
            Cliquez sur le bouton ci-dessous pour en choisir un nouveau. Ce lien est valable 1 heure.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${url}" style="display:inline-block;padding:12px 20px;background-color:#4f46e5;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;">
              Choisir un nouveau mot de passe
            </a>
          </p>
          <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#555555;">
            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
          </p>
          <p style="margin:0 0 24px;font-size:13px;line-height:1.6;word-break:break-all;">
            <a href="${url}" style="color:#4f46e5;">${url}</a>
          </p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#555555;">
            Vous n'êtes pas à l'origine de cette demande ? Ignorez cet email, votre mot de passe reste inchangé.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
