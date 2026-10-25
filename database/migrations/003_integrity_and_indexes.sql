CREATE INDEX batches_event ON food.food_batches(event_id);
CREATE INDEX batches_center_status ON food.food_batches(center_id,status);
CREATE INDEX batches_driver_status ON food.food_batches(driver_id,status);
CREATE INDEX photos_batch_stage ON evidence.photos(batch_id,stage);
CREATE INDEX custody_batch_time ON evidence.custody_events(batch_id,occurred_at);
CREATE INDEX route_batch_reverse ON logistics.route_batches(batch_id);
CREATE INDEX reviews_batch ON feedback.reviews(batch_id);
CREATE INDEX visits_location_time ON feedback.visits(location_id,created_at);
CREATE INDEX document_uploader_time ON food.event_documents(uploader_id,uploaded_at);
CREATE INDEX source_import_run ON audit.source_records(import_run_id);
CREATE INDEX service_type_location ON directory.services(service_type,location_id);
CREATE FUNCTION food.check_leftover_servings() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE provided integer; allocated bigint; event uuid; parent_event uuid;
BEGIN
 SELECT estimated_servings,event_id INTO provided,event FROM food.menu_items WHERE id=NEW.menu_item_id FOR UPDATE;
 SELECT event_id INTO parent_event FROM food.food_batches WHERE id=NEW.batch_id;
 IF event<>parent_event THEN RAISE EXCEPTION 'Batch item must belong to its event'; END IF;
 SELECT coalesce(sum(servings),0) INTO allocated FROM food.batch_items WHERE menu_item_id=NEW.menu_item_id;
 IF allocated>provided THEN RAISE EXCEPTION 'Leftover portions exceed confirmed event servings'; END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER leftover_servings AFTER INSERT OR UPDATE ON food.batch_items DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION food.check_leftover_servings();
CREATE FUNCTION feedback.check_visit_scan() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE q feedback.venue_qr_codes; venue uuid; entered timestamptz;
BEGIN
 SELECT * INTO q FROM feedback.venue_qr_codes WHERE id=NEW.qr_code_id;
 SELECT location_id INTO venue FROM feedback.visits WHERE id=NEW.visit_id;
 IF q.location_id<>venue OR q.phase<>NEW.phase THEN RAISE EXCEPTION 'QR phase and venue must match visit'; END IF;
 IF NEW.phase='exit' THEN
  SELECT server_recorded_at INTO entered FROM feedback.visit_scans WHERE visit_id=NEW.visit_id AND phase='entry';
  IF entered IS NULL OR entered>NEW.server_recorded_at THEN RAISE EXCEPTION 'Exit requires a prior entry'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER visit_scan_integrity BEFORE INSERT OR UPDATE ON feedback.visit_scans FOR EACH ROW EXECUTE FUNCTION feedback.check_visit_scan();
