import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Book as BookIcon, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  category: string;
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

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    fetchBooks();
  }, []);

  async function fetchBooks() {
    let query = supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%`);
    }

    if (selectedCategory) {
      query = query.eq('category', selectedCategory);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching books:', error);
      return;
    }

    setBooks(data || []);
    setLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => (
          <Link
            key={book.id}
            to={`/books/${book.id}`}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <img
              src={book.cover_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=2487&ixlib=rb-4.0.3'}
              alt={book.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <div className="flex items-center mb-2">
                <BookIcon className="h-5 w-5 text-indigo-600 mr-2" />
                <h2 className="text-lg font-semibold">{book.title}</h2>
              </div>
              <p className="text-gray-600">{book.author}</p>
              <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                {book.category}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {books.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No books found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}