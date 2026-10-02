CREATE TABLE users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  username VARCHAR(20) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(11) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_username (username),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE properties (
  id BIGINT NOT NULL AUTO_INCREMENT,
  owner_id BIGINT NOT NULL,
  payload_json JSON NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_properties_owner (owner_id),
  KEY idx_properties_status (status),
  CONSTRAINT fk_properties_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE favorites (
  user_id BIGINT NOT NULL,
  property_id VARCHAR(100) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  PRIMARY KEY (user_id, property_id),
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE visit_requests (
  id BIGINT NOT NULL AUTO_INCREMENT,
  requester_id BIGINT NOT NULL,
  room_id VARCHAR(100) NOT NULL,
  room_title VARCHAR(255) NOT NULL,
  visit_date DATE NOT NULL,
  visit_time TIME NOT NULL,
  phone VARCHAR(30) NOT NULL,
  question VARCHAR(1000) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  approved_slot VARCHAR(500) GENERATED ALWAYS AS
    (CASE WHEN status = 'approved' THEN CONCAT(room_id, '|', visit_date, '|', visit_time) ELSE NULL END) STORED,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_visit_approved_slot (approved_slot),
  KEY idx_visit_requester (requester_id),
  CONSTRAINT fk_visits_requester FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE room_offers (
  id BIGINT NOT NULL AUTO_INCREMENT,
  owner_id BIGINT NOT NULL,
  payload_json JSON NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_room_offers_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE community_posts (
  id BIGINT NOT NULL AUTO_INCREMENT,
  author_id BIGINT NOT NULL,
  category VARCHAR(20) NOT NULL,
  title VARCHAR(60) NOT NULL,
  content TEXT NOT NULL,
  area VARCHAR(30) NOT NULL DEFAULT '',
  rating INT NOT NULL DEFAULT 0,
  views BIGINT NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_posts_created (created_at),
  CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE community_post_likes (
  post_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  created_at DATETIME(6) NOT NULL,
  PRIMARY KEY (post_id, user_id),
  CONSTRAINT fk_likes_post FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE community_comments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  post_id BIGINT NOT NULL,
  author_id BIGINT NOT NULL,
  content VARCHAR(500) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_comments_post_created (post_id, created_at),
  CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inquiries (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  category VARCHAR(30) NOT NULL,
  title VARCHAR(60) NOT NULL,
  content VARCHAR(1000) NOT NULL,
  contact_email VARCHAR(254) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'received',
  answer TEXT NOT NULL,
  answered_by BIGINT NULL,
  answered_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_inquiries_user_created (user_id, created_at),
  KEY idx_inquiries_status (status),
  CONSTRAINT fk_inquiries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_inquiries_answerer FOREIGN KEY (answered_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notifications (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL,
  message VARCHAR(1000) NOT NULL,
  related_type VARCHAR(50) NOT NULL DEFAULT '',
  related_id VARCHAR(100) NOT NULL DEFAULT '',
  read_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_notifications_user_created (user_id, created_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
