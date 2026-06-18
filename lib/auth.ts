import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
        unique: true,
        input: true,
        returned: true,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // OAuth flows don't provide a username — generate one from name or email
          if (!(user as Record<string, unknown>).username) {
            const base = (user.name ?? user.email.split("@")[0])
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, "_")
              .slice(0, 20);
            const suffix = Math.random().toString(36).slice(2, 6);
            return { data: { ...user, username: `${base}_${suffix}` } };
          }
          return { data: user };
        },
      },
    },
  },
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
});

export type Session = typeof auth.$Infer.Session;
