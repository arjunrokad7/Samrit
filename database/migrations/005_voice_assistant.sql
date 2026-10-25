-- Add a separately identifiable task without storing voice transcripts in AI results.
ALTER TABLE app.ai_jobs DROP CONSTRAINT IF EXISTS ai_jobs_task_check;
ALTER TABLE app.ai_jobs ADD CONSTRAINT ai_jobs_task_check
  CHECK (task IN ('meal_filter','menu_ocr','invoice_ocr','feedback_analysis','review_analysis','voice_assistant'));
