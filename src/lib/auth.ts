import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Email and Password Authentication (FR-001, FR-002)
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    maxPasswordLength: 100,
    requireEmailVerification: false, // Simplified for MVP
    // Password reset (FR-003)
    sendResetPassword: async ({ user, url }) => {
      // Use Resend for email sending
      if (process.env.RESEND_API_KEY) {
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM || "noreply@manhhung.app",
              to: user.email,
              subject: "Reset Your Password - Jira Lite",
              html: `
                <h1>Password Reset Request</h1>
                <p>Hello ${user.name || "there"},</p>
                <p>You requested to reset your password. Click the link below to set a new password:</p>
                <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
              `,
            }),
          });
          if (!response.ok) {
            console.error(
              "Failed to send password reset email:",
              await response.text()
            );
          }
        } catch (error) {
          console.error("Error sending password reset email:", error);
        }
      } else {
        // Fallback for development
        console.log(`Password reset link for ${user.email}: ${url}`);
      }
    },
  },

  // Session Configuration (FR-002) - 24 hour expiration
  session: {
    expiresIn: 60 * 60 * 24, // 24 hours in seconds
    updateAge: 60 * 60, // Update session every hour
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // Google OAuth (FR-004)
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },

  // User configuration (FR-005, FR-007)
  user: {
    additionalFields: {
      deletedAt: {
        type: "date",
        required: false,
      },
    },
    deleteUser: {
      enabled: true,
    },
    changeEmail: {
      enabled: false, // Not required by PRD
    },
  },

  // Account configuration
  account: {
    accountLinking: {
      enabled: false, // FR-004 says no account merging
    },
  },

  // Advanced configuration
  advanced: {
    cookiePrefix: "jira-lite",
  },

  // Base URL
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,

  // Trust host for production
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
