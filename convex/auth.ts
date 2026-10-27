import Resend from "@auth/core/providers/resend";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_ALLOWED_EMAIL = "product.gatekeepr@gmail.com";

function allowedEmails() {
  return new Set(
    (process.env.AUTH_ALLOWED_EMAILS || DEFAULT_ALLOWED_EMAIL)
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function makeEmailProvider(id: string) {
  return Resend({
    id,
    apiKey: process.env.RESEND_API_KEY,
    async generateVerificationToken() {
      const values = crypto.getRandomValues(new Uint32Array(1));
      return String(values[0] % 1_000_000).padStart(6, "0");
    },
    async sendVerificationRequest({ identifier, provider, token }) {
      const from = process.env.AUTH_FROM_EMAIL;
      if (!provider.apiKey || !from) {
        throw new Error("Email verification is not configured.");
      }

      const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [identifier],
          subject: "Your Gatekeeper verification code",
          text: `Your one-time Gatekeeper code is ${token}. If you did not request this, you can ignore this email.`,
        }),
      });

      if (!response.ok) {
        console.error(`Gatekeeper email delivery failed with status ${response.status}.`);
        throw new Error("Could not send the email. Check the email provider settings and try again.");
      }
    },
  });
}

const verificationEmail = makeEmailProvider("gatekeeper-verification");
const resetEmail = makeEmailProvider("gatekeeper-password-reset");

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      verify: verificationEmail,
      reset: resetEmail,
      profile(params) {
        const email = typeof params.email === "string" ? params.email.trim().toLowerCase() : "";
        if (!email || !allowedEmails().has(email)) {
          throw new ConvexError("This email is not authorized to access Gatekeeper.");
        }
        return { email };
      },
    }),
  ],
});
