/*
  # Add category to books table

  1. Changes
    - Add category column to books table
    - Add category index for faster filtering
    
  2. Notes
    - Categories will help organize and filter books more effectively
    - Index improves search performance
*/

-- Add category column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'books' AND column_name = 'category'
  ) THEN
    ALTER TABLE books ADD COLUMN category text DEFAULT 'Other';
    CREATE INDEX idx_books_category ON books(category);
  END IF;
END $$;