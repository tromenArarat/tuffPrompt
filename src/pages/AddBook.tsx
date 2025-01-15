import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface BookFormData {
  title: string;
  author: string;
  cover_url: string;
  category: string;
}

interface GoogleBook {
  volumeInfo: {
    title: string;
    authors?: string[];
    imageLinks?: {
      thumbnail: string;
    };
    categories?: string[];
  };
}

const CATEGORIES = [
  'Fiction',
  'Non-Fiction',
  'Science',
  'Technology',
  'History',
  'Biography',
  'Other'
];

export default function AddBook() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    cover_url: '',
    category: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    async function ensureProfile() {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!profile) {
          // Create profile if it doesn't exist
          const { error } = await supabase.from('profiles').insert([
            {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata.full_name || user.email?.split('@')[0],
              avatar_url: user.user_metadata.avatar_url,
            },
          ]);

          if (error) {
            console.error('Error creating profile:', error);
            toast.error('Error setting up user profile');
            navigate('/');
          }
        }
      }
    }

    ensureProfile();
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  async function searchBook() {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const book: GoogleBook = data.items[0];
        const category = book.volumeInfo.categories?.[0] || '';
        // Map Google Books category to our category system
        const mappedCategory = CATEGORIES.find(c => 
          category.toLowerCase().includes(c.toLowerCase())
        ) || 'Other';

        setFormData({
          title: book.volumeInfo.title || '',
          author: book.volumeInfo.authors?.[0] || '',
          cover_url: book.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
          category: mappedCategory,
        });
        toast.success('Book details found!');
      } else {
        toast.error('No books found');
      }
    } catch (error) {
      toast.error('Error searching for book');
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim() || !formData.category) {
      toast.error('Title, author, and category are required');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('books').insert([
        {
          title: formData.title.trim(),
          author: formData.author.trim(),
          cover_url: formData.cover_url.trim() || null,
          category: formData.category,
          owner_id: user?.id || '',
        },
      ]);

      if (error) throw error;

      toast.success('Book added successfully');
      navigate('/');
    } catch (error: any) {
      console.error('Error adding book:', error);
      toast.error(error.message || 'Failed to add book. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Add a New Book</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Search book by title or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchBook()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={searchBook}
            disabled={searching || !searchQuery.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
            Author *
          </label>
          <input
            type="text"
            id="author"
            required
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            id="category"
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-6">
          <label htmlFor="cover_url" className="block text-sm font-medium text-gray-700 mb-2">
            Cover Image URL
          </label>
          <input
            type="url"
            id="cover_url"
            value={formData.cover_url}
            onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {formData.cover_url && (
            <img
              src={formData.cover_url}
              alt="Book cover preview"
              className="mt-2 h-40 object-contain"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=2487&ixlib=rb-4.0.3';
              }}
            />
          )}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Adding Book...' : 'Add Book'}
        </button>
      </form>
    </div>
  );
}