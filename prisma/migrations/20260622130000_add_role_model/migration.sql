CREATE TABLE "Role" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- Seed the four built-in roles
INSERT INTO "Role" ("id", "name", "description", "createdAt") VALUES
  (gen_random_uuid()::text, 'user',      'Default role for all users',         NOW()),
  (gen_random_uuid()::text, 'admin',     'Full platform access',               NOW()),
  (gen_random_uuid()::text, 'moderator', 'Content moderation privileges',      NOW()),
  (gen_random_uuid()::text, 'artist',    'Verified artist badge',              NOW());
