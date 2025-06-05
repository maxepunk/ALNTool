-- Add status and resolution_comment columns to the gaps table
ALTER TABLE gaps ADD COLUMN status TEXT;
ALTER TABLE gaps ADD COLUMN resolution_comment TEXT;

-- Optional: Update existing rows to have a default status if needed,
-- for example, setting them to 'Open' if they are currently NULL.
-- UPDATE gaps SET status = 'Open' WHERE status IS NULL;
