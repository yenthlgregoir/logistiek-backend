import { Resend } from "resend";

export async function sendInviteEmail(email, link) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: "onboarding@resend.dev", // je eigen mailadres of verified domain
      to: email, // belangrijk! anders gaat de mail nergens heen
      subject: "Account aangemaakt",
      html: `
        <h2>Welkom</h2>
        <p>Je account werd aangemaakt.</p>
        <p>Klik op deze link om je wachtwoord te kiezen:</p>
        <a href="${link}">Set password</a>
        <p>Deze link is 1 uur geldig.</p>
      `
    });

  } catch (error) {
    console.error("Mail error:", error);
  }
}