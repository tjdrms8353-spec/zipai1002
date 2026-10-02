ALTER TABLE defense_reports
  ADD COLUMN original_file_name VARCHAR(255) NULL,
  ADD COLUMN original_content_type VARCHAR(100) NULL,
  ADD COLUMN original_file LONGBLOB NULL;
