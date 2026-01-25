-- Create table for tracking user lending positions per protocol
CREATE TABLE IF NOT EXISTS user_lending_positions (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  protocol TEXT NOT NULL,
  amount_deposited FLOAT NOT NULL,
  lp_shares FLOAT NOT NULL,
  apy_at_deposit FLOAT,
  deposited_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wallet_protocol ON user_lending_positions(wallet_address, protocol);
