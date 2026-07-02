export interface EmailRecipient {
  user_id: string;
  email: string;
  display_name: string | null;
  first_name: string | null;
}

export function recipientFirstName(recipient: EmailRecipient): string {
  return recipient.first_name || recipient.display_name || "there";
}

interface CampaignEmailOptions {
  appUrl: string;
  logoUrl: string;
  preheader: string;
  eyebrow: string;
  title: string;
  greeting: string;
  bodyHtml: string;
  featureList?: string[];
  infoBox?: { title: string; bodyHtml: string };
  primaryCta: { label: string; url: string };
  secondaryCta?: { label: string; url: string };
  closingHtml: string;
  unsubscribeUrl: string;
}

export function buildCampaignEmailHtml(options: CampaignEmailOptions): string {
  const {
    appUrl,
    logoUrl,
    preheader,
    eyebrow,
    title,
    greeting,
    bodyHtml,
    featureList,
    infoBox,
    primaryCta,
    secondaryCta,
    closingHtml,
    unsubscribeUrl,
  } = options;

  const featureListHtml = featureList?.length
    ? `<table cellpadding="0" cellspacing="0" style="margin:24px 0;width:100%;">
        ${featureList.map((f) => `
          <tr>
            <td style="padding:6px 0;vertical-align:top;width:24px;">
              <span style="display:inline-block;width:6px;height:6px;background-color:#2563eb;border-radius:50%;margin-top:6px;"></span>
            </td>
            <td style="padding:6px 0;color:#475569;font-size:14px;line-height:1.5;">${f}</td>
          </tr>
        `).join("")}
      </table>`
    : "";

  const infoBoxHtml = infoBox
    ? `<table cellpadding="0" cellspacing="0" style="margin:24px 0;width:100%;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background-color:#f1f5f9;padding:20px 24px;border-left:4px solid #2563eb;">
            <p style="margin:0;font-weight:600;font-size:14px;color:#0f172a;">${infoBox.title}</p>
            <div style="color:#475569;font-size:13px;line-height:1.6;">${infoBox.bodyHtml}</div>
          </td>
        </tr>
      </table>`
    : "";

  const secondaryCtaHtml = secondaryCta
    ? `<a href="${secondaryCta.url}" style="display:inline-block;margin-left:16px;padding:12px 24px;font-size:14px;font-weight:600;color:#2563eb;text-decoration:none;border:1px solid #2563eb;border-radius:8px;">${secondaryCta.label}</a>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08),0 4px 12px rgba(0,0,0,0.04);">

          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a;padding:28px 40px;text-align:center;">
              <a href="${appUrl}" style="text-decoration:none;">
                <img src="${logoUrl}" alt="TSCopier" width="140" style="display:inline-block;max-width:140px;height:auto;" />
              </a>
            </td>
          </tr>

          <!-- Eyebrow -->
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <p style="margin:0 0 8px 0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#2563eb;">${eyebrow}</p>
              <h1 style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">${title}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:0 40px;">
              <p style="margin:0 0 20px 0;font-size:15px;color:#334155;line-height:1.6;">Hey ${greeting},</p>
              <div style="font-size:14px;color:#475569;line-height:1.7;">${bodyHtml}</div>
              ${featureListHtml}
              ${infoBoxHtml}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:8px 40px 32px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td>
                    <a href="${primaryCta.url}" style="display:inline-block;padding:14px 32px;background-color:#2563eb;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;box-shadow:0 2px 4px rgba(37,99,235,0.3);">${primaryCta.label}</a>
                    ${secondaryCtaHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">${closingHtml}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 8px 0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.5;">
                Tartarix Inc. | 131 Continental Dr, Suite 305, Newark, DE 19713 US
              </p>
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a> from these emails
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
