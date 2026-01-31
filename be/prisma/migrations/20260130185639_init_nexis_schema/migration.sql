-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('pending', 'connected', 'expired');

-- CreateEnum
CREATE TYPE "TxStatus" AS ENUM ('pending', 'signed', 'submitted', 'confirmed', 'failed');

-- CreateEnum
CREATE TYPE "TxType" AS ENUM ('transfer');

-- CreateTable
CREATE TABLE "Session" (
    "session_id" TEXT NOT NULL,
    "wallet_address" TEXT,
    "connection_token" TEXT NOT NULL,
    "token_expiry" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3) NOT NULL,
    "status" "SessionStatus" NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "PendingTransaction" (
    "tx_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "recipient_address" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "tx_type" "TxType" NOT NULL,
    "unsigned_transaction" BYTEA NOT NULL,
    "status" "TxStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "signature" TEXT,

    CONSTRAINT "PendingTransaction_pkey" PRIMARY KEY ("tx_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_connection_token_key" ON "Session"("connection_token");

-- AddForeignKey
ALTER TABLE "PendingTransaction" ADD CONSTRAINT "PendingTransaction_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "Session"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;
