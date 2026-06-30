import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { addContactToBrevo } from "./brevo";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    transaction: true,
  }),
  emailAndPassword: {
    enabled: true,
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
      roles: {
        type: "string[]",
        required: false,
        defaultValue: ["user"],
        input: false,
        returned: true,
      },
      avatar: {
        type: "string",
        required: false,
        input: false,
        returned: true,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // OAuth flows don't provide a username — generate one from name or email
          const rawUsername = (user as Record<string, unknown>).username as string | undefined;
          if (!rawUsername) {
            const base = (user.name ?? user.email.split("@")[0])
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, "_")
              .slice(0, 20);
            const suffix = Math.random().toString(36).slice(2, 6);
            return { data: { ...user, username: `${base}_${suffix}` } };
          }
          return { data: { ...user, username: rawUsername.toLowerCase() } };
        },
        after: async (user) => {
          await addContactToBrevo(user.email, user.name ?? undefined).catch(() => {});
        },
      },
    },
  },
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
});

export type Session = typeof auth.$Infer.Session;
