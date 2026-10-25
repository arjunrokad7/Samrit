ALTER TABLE feedback.visits ADD COLUMN finished_at timestamptz;
ALTER TABLE feedback.visits ADD COLUMN completion_method text CHECK(completion_method IN ('button','legacy_exit_scan'));
UPDATE feedback.visits v SET finished_at=s.server_recorded_at,completion_method='legacy_exit_scan' FROM feedback.visit_scans s WHERE s.visit_id=v.id AND s.phase='exit';
ALTER TABLE feedback.visits ADD CONSTRAINT visit_completion_fields CHECK((finished_at IS NULL)=(completion_method IS NULL));
ALTER TABLE feedback.visits ADD CONSTRAINT visit_completion_time CHECK(finished_at IS NULL OR finished_at>=created_at);
UPDATE feedback.venue_qr_codes SET active=false WHERE phase='exit';
INSERT INTO feedback.venue_qr_codes(id,location_id,phase,token_hash)
 SELECT uuid_generate_v4(),location_id,'entry',encode(sha256(convert_to(qr_code,'UTF8')),'hex') FROM directory.partner_centers WHERE approved
 ON CONFLICT(token_hash) DO UPDATE SET active=true;
