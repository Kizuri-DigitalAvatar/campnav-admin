"use node";

import { internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Resend } from "resend";

// Internal action to process email notifications via Resend
export const processEmailNotifications = internalAction({
    args: {},
    handler: async (ctx) => {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            console.error("[processEmailNotifications] RESEND_API_KEY not found in environment variables");
            return;
        }

        const resend = new Resend(resendApiKey);

        const pending = await ctx.runQuery(api.notifications.getPendingNotifications);

        const emailNotifications = pending.filter((n: any) => {
            const isEmail = n.channel === "email";
            const hasEmail = !!n.userEmail;
            return isEmail && hasEmail;
        });

        console.log(`[processEmailNotifications] Processing ${emailNotifications.length} email notifications`);

        for (const notif of emailNotifications) {
            console.log(`[processEmailNotifications] Sending email to: ${notif.userEmail}`);
            try {
                let subject = "CAMPNAV: Notification";
                let title = "New Notification";
                const body = notif.message;

                if (notif.type === "account_created") {
                    subject = "Welcome to CAMPNAV: Your Account Details";
                    title = "Account Created Successfully";
                }

                const { data, error } = await resend.emails.send({
                    from: "CAMPNAV <notifications@blankspacesl.com>",
                    to: [notif.userEmail],
                    subject: subject,
                    html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <style>
                                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #111827; }
                                .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                                .header { margin-bottom: 24px; }
                                .logo { font-size: 24px; font-weight: 800; color: #000; letter-spacing: -0.025em; }
                                .title { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #111827; }
                                .message { font-size: 16px; color: #4b5563; margin-bottom: 24px; white-space: pre-line; }
                                .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
                                .button { display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; }
                                .credentials { background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e5e7eb; font-family: monospace; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <div class="logo">CAMPNAV</div>
                                </div>
                                <h1 class="title">${title}</h1>
                                <div class="message">${body}</div>
                                
                                <div style="margin-top: 32px;">
                                    <a href="https://campnav.vercel.app/login" class="button">Log In to Your Account</a>
                                </div>

                                <div class="footer">
                                    <p>This is an automated notification from CAMPNAV System.</p>
                                    <p>&copy; 2026 CAMPNAV. All rights reserved.</p>
                                </div>
                            </div>
                        </body>
                        </html>
                    `,
                });

                if (error) {
                    console.error("[processEmailNotifications] Failed to send email:", error);
                    await ctx.runMutation(internal.notifications.updateNotificationStatus, {
                        id: notif._id,
                        status: "failed",
                        error: error.message,
                    });
                } else {
                    console.log("[processEmailNotifications] Email sent successfully:", data?.id);
                    await ctx.runMutation(internal.notifications.updateNotificationStatus, {
                        id: notif._id,
                        status: "sent",
                    });
                }
            } catch (error: any) {
                console.error("[processEmailNotifications] Error processing email notification:", error);
                await ctx.runMutation(internal.notifications.updateNotificationStatus, {
                    id: notif._id,
                    status: "failed",
                    error: error?.message || "Unknown error",
                });
            }

            await new Promise(resolve => setTimeout(resolve, 600));
        }
    },
});
