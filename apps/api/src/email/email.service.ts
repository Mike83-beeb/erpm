import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";
import { getEnv } from "../config/env.js";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  devPreviewUrl?: string;
}

export interface VerificationEmailInput {
  to: string;
  userName: string;
  verificationUrl: string;
}

export interface OrganizationInvitationEmailInput {
  to: string;
  organizationName: string;
  inviterName: string;
  inviterEmail: string;
  role: string;
  invitationId: string;
  acceptUrl: string;
  expiresAt: Date;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string;

  constructor() {
    const env = getEnv();
    this.fromEmail = env.RESEND_FROM_EMAIL;
    this.resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
  }

  async sendEmail(payload: SendEmailPayload): Promise<void> {
    if (!this.resend) {
      this.logger.log(
        `[DEV EMAIL FALLBACK] To=${payload.to} | Subject="${payload.subject}"${
          payload.devPreviewUrl ? ` | ActionURL=${payload.devPreviewUrl}` : ""
        }`,
      );
      return;
    }

    const { error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    if (error) {
      this.logger.error(
        `Resend delivery failed for ${payload.to}: ${error.message}`,
      );
      throw new Error(`Failed to deliver email via Resend: ${error.message}`);
    }
  }

  async sendVerificationEmail(input: VerificationEmailInput): Promise<void> {
    const safeName = escapeHtml(input.userName || "there");
    const safeUrl = escapeHtml(input.verificationUrl);

    await this.sendEmail({
      to: input.to,
      subject: "Verify your NexusERP email address",
      devPreviewUrl: input.verificationUrl,
      text: `Hello ${input.userName || "there"},\n\nVerify your email address to activate your NexusERP account:\n${input.verificationUrl}\n\nIf you did not request this, you can safely ignore this email.`,
      html: `
        <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827;">
          <h2 style="margin:0 0 12px;font-size:20px;">Verify your NexusERP email</h2>
          <p style="margin:0 0 16px;line-height:1.5;">Hi ${safeName},</p>
          <p style="margin:0 0 20px;line-height:1.5;">
            Please verify your email address before signing in to your NexusERP workspace.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${safeUrl}" style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">
              Verify Email Address
            </a>
          </p>
          <p style="margin:0;font-size:13px;color:#6b7280;word-break:break-all;">
            Or open this link directly: ${safeUrl}
          </p>
        </div>
      `,
    });
  }

  async sendOrganizationInvitationEmail(
    input: OrganizationInvitationEmailInput,
  ): Promise<void> {
    const safeOrg = escapeHtml(input.organizationName);
    const safeInviter = escapeHtml(input.inviterName || input.inviterEmail);
    const safeRole = escapeHtml(input.role);
    const safeInviteId = escapeHtml(input.invitationId);
    const safeUrl = escapeHtml(input.acceptUrl);
    const expiresLabel = input.expiresAt.toUTCString();

    await this.sendEmail({
      to: input.to,
      subject: `Invitation to join ${input.organizationName} on NexusERP`,
      devPreviewUrl: input.acceptUrl,
      text: `${input.inviterName || input.inviterEmail} invited you to join ${input.organizationName} as "${input.role}".\n\nInvitation ID: ${input.invitationId}\nAccept URL: ${input.acceptUrl}\nExpires: ${expiresLabel}`,
      html: `
        <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827;">
          <h2 style="margin:0 0 12px;font-size:20px;">You are invited to ${safeOrg}</h2>
          <p style="margin:0 0 16px;line-height:1.5;">
            <strong>${safeInviter}</strong> invited you to join <strong>${safeOrg}</strong> on NexusERP with the role <strong>${safeRole}</strong>.
          </p>
          <p style="margin:0 0 20px;">
            <a href="${safeUrl}" style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">
              Accept Organization Invitation
            </a>
          </p>
          <p style="margin:0 0 8px;font-size:13px;color:#4b5563;">
            Invitation ID: <code>${safeInviteId}</code>
          </p>
          <p style="margin:0 0 8px;font-size:13px;color:#4b5563;">
            Expires: ${escapeHtml(expiresLabel)}
          </p>
          <p style="margin:0;font-size:13px;color:#6b7280;word-break:break-all;">
            Accept endpoint: ${safeUrl}
          </p>
        </div>
      `,
    });
  }
}

export const emailDelivery = new EmailService();
