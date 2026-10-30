import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

const DEFAULT_ALLOWED_EMAIL = "product.gatekeepr@gmail.com";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  jwt: {
    customClaims: async (ctx, { userId }) => {
      const user = await ctx.db.get(userId);
      return user?.email
        ? { email: user.email.trim().toLowerCase() }
        : {};
    },
  },
  providers: [
    Password({
      profile(params) {
        const email = typeof params.email === "string" ? params.email.trim().toLowerCase() : "";
        if (email !== DEFAULT_ALLOWED_EMAIL) {
          throw new ConvexError("This email is not authorized to access Gatekeeper.");
        }
        return { email };
      },
    }),
  ],
});
