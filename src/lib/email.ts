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
 * Email template wrapper - professional design matching app style
 */
function wrapInTemplate(content: string, preheader: string = ""): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="dark">
        <meta name="supported-color-schemes" content="dark">
        <title>${APP_NAME}</title>
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
        <!-- Preheader text (hidden) -->
        <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
          ${preheader}
          ${"&nbsp;&zwnj;".repeat(30)}
        </div>
        
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
          <tr>
            <td align="center" style="padding: 40px 16px;">
              <table role="presentation" width="100%" style="max-width: 520px;">
                
                <!-- Header -->
                <tr>
                  <td style="padding-bottom: 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <span style="font-size: 20px; font-weight: 300; color: #ffffff; letter-spacing: 0.2em; text-transform: uppercase;">${APP_NAME}</span>
                        </td>
                        <td align="right">
                          <span style="font-size: 12px; color: #525252;">Project Management</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Main Content Card -->
                <tr>
                  <td>
                    <table role="presentation" width="100%" style="background-color: #141414; border-radius: 12px; border: 1px solid #262626;" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 40px;">
                          ${content}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding-top: 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <p style="color: #404040; font-size: 12px; margin: 0 0 8px 0; line-height: 1.5;">
                            This is an automated message from ${APP_NAME}.<br>
                            Please do not reply directly to this email.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-top: 16px;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding: 0 8px;">
                                <a href="${APP_URL}/dashboard" style="color: #525252; font-size: 12px; text-decoration: none;">Dashboard</a>
                              </td>
                              <td style="color: #333333;">•</td>
                              <td style="padding: 0 8px;">
                                <a href="${APP_URL}/profile" style="color: #525252; font-size: 12px; text-decoration: none;">Settings</a>
                              </td>
                              <td style="color: #333333;">•</td>
                              <td style="padding: 0 8px;">
                                <a href="${APP_URL}" style="color: #525252; font-size: 12px; text-decoration: none;">Help</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-top: 20px; border-top: 1px solid #1a1a1a; margin-top: 20px;">
                          <p style="color: #333333; font-size: 11px; margin: 20px 0 0 0;">
                            © ${new Date().getFullYear()} Vibe. All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
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
 * Primary button component
 */
function createButton(text: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
      <tr>
        <td style="background-color: #60a5fa; border-radius: 8px;">
          <a href="${url}" style="display: inline-block; padding: 14px 32px; color: #0a0a0a; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 0.01em;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Secondary/outline button component
 */
function createSecondaryButton(text: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
      <tr>
        <td style="border: 1px solid #333333; border-radius: 8px;">
          <a href="${url}" style="display: inline-block; padding: 12px 24px; color: #a3a3a3; text-decoration: none; font-weight: 500; font-size: 13px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Divider component
 */
function createDivider(): string {
  return `<tr><td style="padding: 24px 0;"><div style="border-top: 1px solid #262626;"></div></td></tr>`;
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
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <!-- Header -->
      <tr>
        <td style="padding-bottom: 24px;">
          <p style="color: #60a5fa; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0;">
            Team Invitation
          </p>
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0; line-height: 1.3;">
            You've been invited to join<br>${teamName}
          </h1>
        </td>
      </tr>
      
      <!-- Message -->
      <tr>
        <td style="padding-bottom: 28px;">
          <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin: 0;">
            <strong style="color: #e5e5e5;">${inviterName}</strong> has invited you to collaborate on their team. You'll be joining as a <strong style="color: #e5e5e5;">${role}</strong>.
          </p>
        </td>
      </tr>
      
      <!-- Team Info Box -->
      <tr>
        <td style="padding-bottom: 32px;">
          <table role="presentation" width="100%" style="background-color: #1a1a1a; border-radius: 8px; border-left: 3px solid #60a5fa;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="48" valign="top">
                      <div style="width: 40px; height: 40px; background-color: #262626; border-radius: 8px; text-align: center; line-height: 40px; font-size: 16px; font-weight: 600; color: #ffffff;">
                        ${teamName.charAt(0).toUpperCase()}
                      </div>
                    </td>
                    <td style="padding-left: 12px;" valign="middle">
                      <p style="color: #ffffff; font-size: 15px; font-weight: 600; margin: 0 0 4px 0;">${teamName}</p>
                      <p style="color: #666666; font-size: 13px; margin: 0;">Your role: ${role}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- CTA Button -->
      <tr>
        <td align="center" style="padding-bottom: 28px;">
          ${createButton("Accept Invitation", `${APP_URL}/teams`)}
        </td>
      </tr>
      
      <!-- Note -->
      <tr>
        <td>
          <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
            This invitation will expire in 7 days.<br>
            If you don't have an account yet, you'll be prompted to create one.
          </p>
        </td>
      </tr>
    </table>
  `;

  return sendEmail({
    to,
    subject: `[${APP_NAME}] ${inviterName} invited you to join ${teamName}`,
    html: wrapInTemplate(content, `${inviterName} invited you to join ${teamName} on Vibe`),
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
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <!-- Header -->
      <tr>
        <td style="padding-bottom: 24px;">
          <p style="color: #60a5fa; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0;">
            Issue Assigned
          </p>
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0; line-height: 1.3;">
            You have a new assignment
          </h1>
        </td>
      </tr>
      
      <!-- Message -->
      <tr>
        <td style="padding-bottom: 28px;">
          <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin: 0;">
            <strong style="color: #e5e5e5;">${assignerName}</strong> assigned you to an issue in <strong style="color: #e5e5e5;">${projectName}</strong>.
          </p>
        </td>
      </tr>
      
      <!-- Issue Box -->
      <tr>
        <td style="padding-bottom: 32px;">
          <table role="presentation" width="100%" style="background-color: #1a1a1a; border-radius: 8px; border-left: 3px solid #60a5fa;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 20px;">
                <p style="color: #666666; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">
                  ${projectName}
                </p>
                <p style="color: #ffffff; font-size: 16px; font-weight: 500; margin: 0; line-height: 1.4;">
                  ${issueTitle}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- CTA Button -->
      <tr>
        <td align="center">
          ${createButton("View Issue", issueUrl)}
        </td>
      </tr>
    </table>
  `;

  return sendEmail({
    to,
    subject: `[${APP_NAME}] Assigned to you: ${issueTitle}`,
    html: wrapInTemplate(content, `${assignerName} assigned you to "${issueTitle}" in ${projectName}`),
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
  const truncatedComment = commentPreview.length > 180 
    ? commentPreview.substring(0, 180) + "..." 
    : commentPreview;

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <!-- Header -->
      <tr>
        <td style="padding-bottom: 24px;">
          <p style="color: #60a5fa; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0;">
            New Mention
          </p>
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0; line-height: 1.3;">
            ${mentionerName} mentioned you
          </h1>
        </td>
      </tr>
      
      <!-- Context -->
      <tr>
        <td style="padding-bottom: 20px;">
          <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin: 0;">
            You were mentioned in a comment on <strong style="color: #e5e5e5;">${issueTitle}</strong>.
          </p>
        </td>
      </tr>
      
      <!-- Comment Box -->
      <tr>
        <td style="padding-bottom: 32px;">
          <table role="presentation" width="100%" style="background-color: #1a1a1a; border-radius: 8px;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom: 12px; border-bottom: 1px solid #262626;">
                      <p style="color: #666666; font-size: 13px; margin: 0;">
                        <strong style="color: #a3a3a3;">${mentionerName}</strong> commented:
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 12px;">
                      <p style="color: #d4d4d4; font-size: 14px; margin: 0; line-height: 1.6; font-style: italic;">
                        "${truncatedComment}"
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- CTA Button -->
      <tr>
        <td align="center">
          ${createButton("View Comment", issueUrl)}
        </td>
      </tr>
    </table>
  `;

  return sendEmail({
    to,
    subject: `[${APP_NAME}] ${mentionerName} mentioned you in ${issueTitle}`,
    html: wrapInTemplate(content, `${mentionerName} mentioned you: "${truncatedComment.substring(0, 60)}..."`),
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
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const urgencyText = diffDays <= 1 ? "Due tomorrow" : `Due in ${diffDays} days`;

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <!-- Header -->
      <tr>
        <td style="padding-bottom: 24px;">
          <p style="color: #f59e0b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0;">
            Reminder
          </p>
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0; line-height: 1.3;">
            ${urgencyText}
          </h1>
        </td>
      </tr>
      
      <!-- Message -->
      <tr>
        <td style="padding-bottom: 28px;">
          <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin: 0;">
            You have an upcoming deadline for an issue in <strong style="color: #e5e5e5;">${projectName}</strong>.
          </p>
        </td>
      </tr>
      
      <!-- Issue Box -->
      <tr>
        <td style="padding-bottom: 32px;">
          <table role="presentation" width="100%" style="background-color: #1a1a1a; border-radius: 8px; border-left: 3px solid #f59e0b;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 20px;">
                <p style="color: #666666; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">
                  ${projectName}
                </p>
                <p style="color: #ffffff; font-size: 16px; font-weight: 500; margin: 0 0 16px 0; line-height: 1.4;">
                  ${issueTitle}
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color: #262626; border-radius: 4px; padding: 8px 12px;">
                      <p style="color: #f59e0b; font-size: 13px; font-weight: 500; margin: 0;">
                        📅 ${formattedDate}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- CTA Button -->
      <tr>
        <td align="center">
          ${createButton("View Issue", issueUrl)}
        </td>
      </tr>
    </table>
  `;

  return sendEmail({
    to,
    subject: `[${APP_NAME}] Reminder: "${issueTitle}" is due ${diffDays <= 1 ? "tomorrow" : `in ${diffDays} days`}`,
    html: wrapInTemplate(content, `Reminder: "${issueTitle}" in ${projectName} is due on ${formattedDate}`),
  });
}
