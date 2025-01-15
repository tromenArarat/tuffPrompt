/*
  # Initial Schema for Book Borrowing Application

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - matches auth.users id
      - `email` (text)
      - `full_name` (text)
      - `avatar_url` (text)
      - `created_at` (timestamp)
      
    - `books`
      - `id` (uuid, primary key)
      - `title` (text)
      - `author` (text)
      - `cover_url` (text)
      - `owner_id` (uuid, foreign key to profiles)
      - `is_available` (boolean)
      - `created_at` (timestamp)
      
    - `borrow_requests`
      - `id` (uuid, primary key)
      - `book_id` (uuid, foreign key to books)
      - `requester_id` (uuid, foreign key to profiles)
      - `status` (text) - enum: 'pending', 'accepted', 'declined'
      - `created_at` (timestamp)
      
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Create books table
CREATE TABLE books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  cover_url text,
  owner_id uuid REFERENCES profiles(id) NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create borrow_requests table
CREATE TABLE borrow_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) NOT NULL,
  requester_id uuid REFERENCES profiles(id) NOT NULL,
  status text CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_requests ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Books policies
CREATE POLICY "Books are viewable by everyone"
  ON books FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own books"
  ON books FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own books"
  ON books FOR UPDATE
  USING (auth.uid() = owner_id);

-- Borrow requests policies
CREATE POLICY "Users can view their own requests and requests for their books"
  ON borrow_requests FOR SELECT
  USING (
    auth.uid() = requester_id OR 
    auth.uid() IN (
      SELECT owner_id FROM books WHERE id = book_id
    )
  );

CREATE POLICY "Authenticated users can create borrow requests"
  ON borrow_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Book owners can update request status"
  ON borrow_requests FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT owner_id FROM books WHERE id = book_id
    )
  );