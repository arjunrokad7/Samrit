-- Preserve provenance when a hackathon workflow uses simulated coordinates.
ALTER TABLE evidence.photos ADD COLUMN location_source text NOT NULL DEFAULT 'unspecified' CHECK(location_source IN ('device','simulated','operator_supplied','unspecified'));
ALTER TABLE evidence.custody_events ADD COLUMN location_source text NOT NULL DEFAULT 'unspecified' CHECK(location_source IN ('device','simulated','operator_supplied','unspecified'));
ALTER TABLE evidence.location_reports ADD COLUMN location_source text NOT NULL DEFAULT 'unspecified' CHECK(location_source IN ('device','simulated','operator_supplied','unspecified'));
ALTER TABLE feedback.visit_scans ADD COLUMN location_source text NOT NULL DEFAULT 'unspecified' CHECK(location_source IN ('device','simulated','operator_supplied','unspecified'));
CREATE OR REPLACE FUNCTION app.proof_json(photo uuid) RETURNS jsonb LANGUAGE sql STABLE AS $$
SELECT jsonb_build_object('url',url,'sha256',sha256,'actorId',actor_id,'lat',latitude,'lng',longitude,'locationSource',location_source,'timestamp',to_char(captured_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) FROM evidence.photos WHERE id=photo
$$;
