CREATE TABLE oauth_identities (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  provider VARCHAR(20) NOT NULL,
  provider_subject VARCHAR(191) NOT NULL,
  provider_email VARCHAR(254) NOT NULL DEFAULT '',
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_oauth_provider_subject (provider, provider_subject),
  KEY idx_oauth_user (user_id),
  CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
