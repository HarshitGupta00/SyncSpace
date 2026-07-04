// services/emailService.js
// Wrapper around Resend for sending emails.
// WHY Resend over Nodemailer+Gmail:
// Gmail SMTP has sending limits and deliverability issues (often lands in spam).
// Resend is a developer-focused email API with better deliverability,
// a clean SDK, and a free tier (100 emails/day) — enough for a portfolio project.

const { Resend } = require("resend");
const { RESEND_API_KEY, CLIENT_URL } = require("../config/env");

const resend = new Resend(RESEND_API_KEY);

// Send a team invite email
const sendInviteEmail = async ({ toEmail, inviterName, teamName, inviteLink, role }) => {
  const { data, error } = await resend.emails.send({
    from: "SyncSpace <noreply@yourdomain.com>", // replace with your verified Resend domain
    to: toEmail,
    subject: `You've been invited to join ${teamName} on SyncSpace`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="font-size: 24px; font-weight: 700; color: #0a0a0a;">
          You've been invited!
        </h2>
        <p style="color: #6b6b6b; font-size: 15px; line-height: 1.6;">
          <strong>${inviterName}</strong> has invited you to join
          <strong>${teamName}</strong> on SyncSpace as a <strong>${role}</strong>.
        </p>
        <p style="color: #6b6b6b; font-size: 14px;">
          Real-time docs, whiteboards, and AI assistance — all in one workspace.
        </p>
        <a href="${inviteLink}"
           style="display: inline-block; margin-top: 24px; padding: 12px 28px;
                  background: #0a0a0a; color: #ffffff; text-decoration: none;
                  border-radius: 8px; font-weight: 600; font-size: 15px;">
          Accept Invitation
        </a>
        <p style="margin-top: 24px; color: #9ca3af; font-size: 13px;">
          This invite expires in 48 hours. If you didn't expect this email, you can safely ignore it.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Email send error:", error);
    throw new Error(`Failed to send invite email: ${error.message}`);
  }

  return data;
};

module.exports = { sendInviteEmail };
