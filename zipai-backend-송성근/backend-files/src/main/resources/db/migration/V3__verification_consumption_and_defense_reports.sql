ALTER TABLE verification_codes
  ADD COLUMN consumed_at DATETIME(6) NULL;

CREATE TABLE defense_reports (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  report_type VARCHAR(30) NOT NULL,
  title VARCHAR(255) NOT NULL,
  snapshot_json LONGTEXT NOT NULL,
  share_token VARCHAR(64) NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_defense_reports_share_token (share_token),
  KEY idx_defense_reports_user_created (user_id, created_at),
  CONSTRAINT fk_defense_reports_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
