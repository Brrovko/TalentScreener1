-- Add answer_text column to candidate_answers for storing the textual value of the answer (nullable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='candidate_answers' AND column_name='answer_text'
  ) THEN
    ALTER TABLE candidate_answers ADD COLUMN answer_text json;
  END IF;
END $$;

-- Make answer_text column in candidate_answers NOT NULL to match the current application logic (answerText is always present in the answer)
ALTER TABLE candidate_answers ALTER COLUMN answer_text SET NOT NULL;
