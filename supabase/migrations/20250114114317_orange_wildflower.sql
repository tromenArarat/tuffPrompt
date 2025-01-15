/*
  # Add profile insert policy

  1. Security Changes
    - Add policy to allow users to insert their own profile
    - This fixes the RLS error when creating profiles during authentication
*/

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);