"use server";

/**
 * Email Service using Resend API
 * Handles all email sending for the application:
 * - FR-003: Password reset emails (handled by better-auth)
 * - FR-013: Team invitation emails
 */

const APP_NAME = "VIBE";
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
 * Email template wrapper - clean minimal design matching app style
 */
function wrapInTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 48px 20px;">
          <tr>
            <td align="center">
              <table width="100%" style="max-width: 480px;">
                <!-- Logo Header -->
                <tr>
                  <td style="padding-bottom: 32px; text-align: center;">
                    <span style="font-size: 24px; font-weight: 300; color: #ffffff; letter-spacing: 0.25em; text-transform: uppercase;">${APP_NAME}</span>
                  </td>
                </tr>
                
                <!-- Main Card -->
                <tr>
                  <td>
                    <table width="100%" style="background-color: #171717; border-radius: 12px; border: 1px solid #262626;">
                      <tr>
                        <td style="padding: 32px;">
                          ${content}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding-top: 24px; text-align: center;">
                    <p style="color: #525252; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} Vibe. All rights reserved.
                    </p>
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
 * Button component - simple and clean
 */
function createButton(text: string, url: string): string {
  return `
    <a href="${url}" 
       style="display: inline-block; padding: 12px 24px; background-color: #60a5fa; color: #0a0a0a; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
      ${text}
    </a>
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
    <h1 style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">
      You're invited to join a team
    </h1>
    
    <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
      <span style="color: #ffffff;">${inviterName}</span> has invited you to join <span style="color: #ffffff;">${teamName}</span> as a <span style="color: #60a5fa;">${role}</span>.
    </p>
    
    <div style="margin-bottom: 24px;">
      ${createButton("Accept Invitation", `${APP_URL}/teams`)}
    </div>
    
    <p style="color: #525252; font-size: 12px; line-height: 1.5; margin: 0;">
      This invitation expires in 7 days. If you don't have an account, you'll need to sign up first.
    </p>
  `;

  return sendEmail({
    to,
    subject: `${inviterName} invited you to join ${teamName}`,
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
    <h1 style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">
      New issue assigned to you
    </h1>
    
    <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">
      <span style="color: #ffffff;">${assignerName}</span> assigned you an issue in <span style="color: #ffffff;">${projectName}</span>
    </p>
    
    <p style="color: #ffffff; font-size: 16px; font-weight: 500; margin: 0 0 24px 0;">
      ${issueTitle}
    </p>
    
    <div>
      ${createButton("View Issue", issueUrl)}
    </div>
  `;

  return sendEmail({
    to,
    subject: `Assigned: ${issueTitle}`,
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
    <h1 style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">
      You were mentioned in a comment
    </h1>
    
    <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
      <span style="color: #ffffff;">${mentionerName}</span> mentioned you in <span style="color: #ffffff;">${issueTitle}</span>
    </p>
    
    <div style="border-left: 2px solid #404040; padding-left: 16px; margin-bottom: 24px;">
      <p style="color: #a3a3a3; font-size: 14px; margin: 0; font-style: italic; line-height: 1.5;">
        "${commentPreview.substring(0, 150)}${commentPreview.length > 150 ? "..." : ""}"
      </p>
    </div>
    
    <div>
      ${createButton("View Comment", issueUrl)}
    </div>
  `;

  return sendEmail({
    to,
    subject: `${mentionerName} mentioned you in ${issueTitle}`,
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
    <h1 style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">
      Issue due soon
    </h1>
    
    <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">
      An issue in <span style="color: #ffffff;">${projectName}</span> is due soon
    </p>
    
    <p style="color: #ffffff; font-size: 16px; font-weight: 500; margin: 0 0 12px 0;">
      ${issueTitle}
    </p>
    
    <p style="color: #f59e0b; font-size: 14px; font-weight: 500; margin: 0 0 24px 0;">
      Due: ${formattedDate}
    </p>
    
    <div>
      ${createButton("View Issue", issueUrl)}
    </div>
  `;

  return sendEmail({
    to,
    subject: `Due soon: ${issueTitle}`,
    html: wrapInTemplate(content),
  });
}
