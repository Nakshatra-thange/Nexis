

CREATE TYPE session_status AS ENUM (
  'pending',
  'connected',
  'expired'
);

CREATE TYPE tx_status AS ENUM (
  'pending',
  'signed',
  'submitted',
  'confirmed',
  'failed'
);

CREATE TYPE tx_type AS ENUM (
  'transfer'
);



CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,
  wallet_address TEXT NULL,
  connection_token TEXT UNIQUE NOT NULL,
  token_expiry TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW(),
  status session_status NOT NULL
);

-- ===== PENDING TRANSACTIONS =====

CREATE TABLE pending_transactions (
  tx_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  amount BIGINT NOT NULL,
  tx_type tx_type NOT NULL,
  unsigned_transaction BYTEA NOT NULL,
  status tx_status NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  signature TEXT NULL,

  CONSTRAINT fk_session
    FOREIGN KEY(session_id)
    REFERENCES sessions(session_id)
    ON DELETE CASCADE
);
INSERT INTO sessions (
  session_id,
  wallet_address,
  connection_token,
  token_expiry,
  status,
  created_at,
  last_used_at
)
VALUES (
  'test-session',
  'YOUR_DEVNET_WALLET_ADDRESS',
  'testtoken123',
  NOW() + INTERVAL '10 minutes',
  'connected',
  NOW(),
  NOW()
)
ON CONFLICT (session_id)
DO UPDATE SET
  wallet_address = EXCLUDED.wallet_address,
  status = 'connected',
  last_used_at = NOW();
