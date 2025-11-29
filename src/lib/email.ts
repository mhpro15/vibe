"use server";

/**
 * Email Service using Resend API
 * Handles all email sending for the application:
 * - FR-003: Password reset emails (handled by better-auth)
 * - FR-013: Team invitation emails
 */

const APP_NAME = "Vibe";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email using Resend API
 */
async function sendEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[DEV] Email to ${options.to}: ${options.subject}`);
    console.log(`[DEV] Content: ${options.html.substring(0, 200)}...`);
    return true; // Return true in dev mode
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "noreply@manhhung.app",
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to send email:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

/**
 * Email template wrapper with consistent styling
 */
function wrapInTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" style="max-width: 500px; background-color: #171717; border-radius: 12px; border: 1px solid #374151;">
                <tr>
                  <td style="padding: 32px;">
                    <!-- Logo -->
                    <div style="text-align: center; margin-bottom: 24px;">
                      <span style="font-size: 24px; font-weight: bold; color: #a78bfa;">✦ ${APP_NAME}</span>
                    </div>
                    
                    <!-- Content -->
                    ${content}
                    
                    <!-- Footer -->
                    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #374151; text-align: center;">
                      <p style="color: #6b7280; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

/**
 * FR-013: Send team invitation email
 */
export async function sendTeamInviteEmail(
  to: string,
  inviterName: string,
  teamName: string,
  role: string
): Promise<boolean> {
  const content = `
    <h1 style="color: #f5f5f5; font-size: 20px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">
      You're Invited!
    </h1>
    
    <p style="color: #d4d4d4; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
      <strong style="color: #a78bfa;">${inviterName}</strong> has invited you to join 
      <strong style="color: #60a5fa;">${teamName}</strong> as a <strong>${role}</strong>.
    </p>
    
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/teams" 
         style="display: inline-block; padding: 12px 32px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        View Invitation
      </a>
    </div>
    
    <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 24px 0 0 0; text-align: center;">
      This invitation will expire in 7 days.<br>
      If you don't have an account, you'll need to sign up first.
    </p>
  `;

  return sendEmail({
    to,
    subject: `${inviterName} invited you to join ${teamName} - ${APP_NAME}`,
    html: wrapInTemplate(content),
  });
}

/**
 * Send notification email for issue assignment
 */
export async function sendIssueAssignedEmail(
  to: string,
  assignerName: string,
  issueTitle: string,
  projectName: string,
  issueUrl: string
): Promise<boolean> {
  const content = `
    <h1 style="color: #f5f5f5; font-size: 20px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">
      Issue Assigned to You
    </h1>
    
    <p style="color: #d4d4d4; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0; text-align: center;">
      <strong style="color: #a78bfa;">${assignerName}</strong> assigned you an issue in 
      <strong style="color: #60a5fa;">${projectName}</strong>
    </p>
    
    <div style="background-color: #262626; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="color: #f5f5f5; font-size: 16px; font-weight: 500; margin: 0;">
        ${issueTitle}
      </p>
    </div>
    
    <div style="text-align: center; margin: 24px 0;">
      <a href="${issueUrl}" 
         style="display: inline-block; padding: 12px 32px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        View Issue
      </a>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Issue assigned: ${issueTitle} - ${APP_NAME}`,
    html: wrapInTemplate(content),
  });
}

/**
 * Send notification email for issue mentions
 */
export async function sendMentionEmail(
  to: string,
  mentionerName: string,
  issueTitle: string,
  commentPreview: string,
  issueUrl: string
): Promise<boolean> {
  const content = `
    <h1 style="color: #f5f5f5; font-size: 20px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">
      You Were Mentioned
    </h1>
    
    <p style="color: #d4d4d4; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0; text-align: center;">
      <strong style="color: #a78bfa;">${mentionerName}</strong> mentioned you in a comment on
    </p>
    
    <div style="background-color: #262626; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="color: #60a5fa; font-size: 14px; font-weight: 500; margin: 0 0 8px 0;">
        ${issueTitle}
      </p>
      <p style="color: #9ca3af; font-size: 13px; margin: 0; font-style: italic;">
        "${commentPreview.substring(0, 100)}${commentPreview.length > 100 ? "..." : ""}"
      </p>
    </div>
    
    <div style="text-align: center; margin: 24px 0;">
      <a href="${issueUrl}" 
         style="display: inline-block; padding: 12px 32px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        View Comment
      </a>
    </div>
  `;

  return sendEmail({
    to,
    subject: `${mentionerName} mentioned you in ${issueTitle} - ${APP_NAME}`,
    html: wrapInTemplate(content),
  });
}

/**
 * Send notification email for issue due soon
 */
export async function sendDueSoonEmail(
  to: string,
  issueTitle: string,
  projectName: string,
  dueDate: Date,
  issueUrl: string
): Promise<boolean> {
  const formattedDate = dueDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const content = `
    <h1 style="color: #f5f5f5; font-size: 20px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">
      ⏰ Issue Due Soon
    </h1>
    
    <p style="color: #d4d4d4; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0; text-align: center;">
      An issue assigned to you is due soon
    </p>
    
    <div style="background-color: #262626; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="color: #f5f5f5; font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">
        ${issueTitle}
      </p>
      <p style="color: #60a5fa; font-size: 13px; margin: 0 0 8px 0;">
        ${projectName}
      </p>
      <p style="color: #fbbf24; font-size: 14px; font-weight: 500; margin: 0;">
        Due: ${formattedDate}
      </p>
    </div>
    
    <div style="text-align: center; margin: 24px 0;">
      <a href="${issueUrl}" 
         style="display: inline-block; padding: 12px 32px; background-color: #f59e0b; color: #171717; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        View Issue
      </a>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Due soon: ${issueTitle} - ${APP_NAME}`,
    html: wrapInTemplate(content),
  });
}
