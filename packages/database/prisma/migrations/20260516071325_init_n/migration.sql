-- CreateTable
CREATE TABLE "event_store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stream_id" TEXT NOT NULL,
    "stream_type" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "tenant_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "audit_chain" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "previous_hash" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_chain_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event_store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "logo_url" TEXT,
    "branding" TEXT DEFAULT '{"primary_color": "#0D9488", "secondary_color": "#111827"}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "school_id" TEXT,
    "full_name" TEXT,
    "role" TEXT,
    "custom_id" TEXT,
    "avatar_url" TEXT,
    "phone_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profiles_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "slips" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "slip_number" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "image_url" TEXT,
    "verified_by" TEXT,
    "verified_at" DATETIME,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "slips_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "slips_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "slips_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "profiles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "event_store_stream_id_idx" ON "event_store"("stream_id");

-- CreateIndex
CREATE INDEX "event_store_tenant_id_idx" ON "event_store"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "audit_chain_event_id_key" ON "audit_chain"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "audit_chain_hash_key" ON "audit_chain"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "schools_subdomain_key" ON "schools"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_custom_id_key" ON "profiles"("custom_id");
