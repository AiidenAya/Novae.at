import { PrismaClient } from "../lib/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const email = process.argv[2];
if (!email) { console.error("Usage: node scripts/set-admin.mjs <email>"); process.exit(1); }

const result = await prisma.user.updateMany({ where: { email }, data: { role: "admin" } });
console.log(`Updated ${result.count} user(s) to admin.`);
await prisma.$disconnect();
