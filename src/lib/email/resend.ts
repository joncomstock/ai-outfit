import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const from = process.env.EMAIL_FROM ?? "noreply@outfitengine.com";

interface OutfitReadyEmailParams {
  to: string;
  outfitName: string;
  outfitUrl: string;
}

export async function sendOutfitReadyEmail({ to, outfitName, outfitUrl }: OutfitReadyEmailParams) {
  try {
    await resend.emails.send({
      from,
      to,
      subject: `Your outfit "${outfitName}" is ready`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; color: #1C1B19; margin-bottom: 8px;">Your Outfit is Ready</h1>
          <p style="font-size: 16px; color: #49454F; line-height: 1.6;">
            Your AI-curated outfit <strong>"${outfitName}"</strong> has been generated and is ready to view.
          </p>
          <a href="${outfitUrl}" style="display: inline-block; margin-top: 24px; padding: 12px 32px; background: linear-gradient(45deg, #974232, #b65948); color: white; text-decoration: none; font-family: sans-serif; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">
            VIEW OUTFIT
          </a>
          <p style="font-size: 12px; color: #79747E; margin-top: 40px;">
            Outfit Engine — Your Personal AI Stylist
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send outfit ready email:", error);
    return { success: false, error };
  }
}

interface TrendAlertEmailParams {
  to: string;
  trendName: string;
  trendUrl: string;
}

export async function sendTrendAlertEmail({ to, trendName, trendUrl }: TrendAlertEmailParams) {
  try {
    await resend.emails.send({
      from,
      to,
      subject: `New trend: ${trendName}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; color: #1C1B19; margin-bottom: 8px;">Trending Now</h1>
          <p style="font-size: 16px; color: #49454F; line-height: 1.6;">
            A new trend matching your style preferences has arrived: <strong>"${trendName}"</strong>.
          </p>
          <a href="${trendUrl}" style="display: inline-block; margin-top: 24px; padding: 12px 32px; background: linear-gradient(45deg, #974232, #b65948); color: white; text-decoration: none; font-family: sans-serif; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">
            EXPLORE TREND
          </a>
          <p style="font-size: 12px; color: #79747E; margin-top: 40px;">
            Outfit Engine — Your Personal AI Stylist
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send trend alert email:", error);
    return { success: false, error };
  }
}
