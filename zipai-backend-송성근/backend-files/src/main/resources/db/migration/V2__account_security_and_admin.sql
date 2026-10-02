ALTER TABLE users
  ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN locked_until DATETIME(6) NULL,
  ADD COLUMN email_verified_at DATETIME(6) NULL,
  ADD COLUMN phone_verified_at DATETIME(6) NULL,
  ADD COLUMN deleted_at DATETIME(6) NULL;

ALTER TABLE community_posts
  ADD COLUMN deleted_at DATETIME(6) NULL,
  ADD COLUMN deleted_by BIGINT NULL,
  ADD COLUMN delete_reason VARCHAR(500) NOT NULL DEFAULT '',
  ADD KEY idx_posts_deleted_created (deleted_at, created_at),
  ADD CONSTRAINT fk_posts_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE verification_codes (
  id BIGINT NOT NULL AUTO_INCREMENT, purpose VARCHAR(20) NOT NULL, channel VARCHAR(20) NOT NULL,
  destination VARCHAR(254) NOT NULL, code_hash VARCHAR(64) NOT NULL, user_id BIGINT NULL,
  expires_at DATETIME(6) NOT NULL, verified_at DATETIME(6) NULL, attempts INT NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL, PRIMARY KEY (id),
  KEY idx_verification_lookup (purpose, channel, destination, created_at),
  CONSTRAINT fk_verification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE admin_audit_logs (
  id BIGINT NOT NULL AUTO_INCREMENT, admin_id BIGINT NOT NULL, action VARCHAR(80) NOT NULL,
  target_type VARCHAR(50) NOT NULL, target_id VARCHAR(100) NOT NULL, detail VARCHAR(1000) NOT NULL DEFAULT '',
  created_at DATETIME(6) NOT NULL, PRIMARY KEY (id), KEY idx_admin_audit_created (created_at),
  CONSTRAINT fk_admin_audit_admin FOREIGN KEY (admin_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
