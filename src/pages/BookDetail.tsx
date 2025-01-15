import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Book as BookIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  category: string;
  owner_id: string;
  owner: {
    id: string;
    full_name: string;
    email: string;
  };
}

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    async function fetchBook() {
      const { data, error } = await supabase
        .from('books')
        .select(`
          *,
          owner: profiles(full_name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching book:', error);
        navigate('/');
        return;
      }

      setBook(data);
      setLoading(false);
    }

    fetchBook();
  }, [id, navigate]);

  async function handleRequestBook() {
    if (!user) {
      toast.error('Please sign in to request books');
      return;
    }

    if (book?.owner_id === user.id) {
      toast.error('You cannot request your own book');
      return;
    }

    try {
      setRequesting(true);
      const { error } = await supabase
        .from('borrow_requests')
        .insert([
          {
            book_id: id,
            requester_id: user.id,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already requested this book');
        } else {
          toast.error('Failed to request book');
        }
        return;
      }

      toast.success('Book requested successfully');
    } finally {
      setRequesting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          <div className="md:flex-shrink-0 md:w-1/3">
            <img
              src={book.cover_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=2487&ixlib=rb-4.0.3'}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-8 md:w-2/3">
            <div className="flex items-center mb-4">
              <BookIcon className="h-6 w-6 text-indigo-600 mr-2" />
              <h1 className="text-3xl font-bold">{book.title}</h1>
            </div>
            <p className="text-xl text-gray-600 mb-2">{book.author}</p>
            <span className="inline-block mb-4 px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-full">
              {book.category}
            </span>
            <p className="text-gray-500 mb-8">
              Shared by {book.owner?.full_name || 'Anonymous'}
            </p>
            {user && user.id !== book.owner_id && (
              <button
                onClick={handleRequestBook}
                disabled={requesting}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requesting ? 'Requesting...' : 'Request Book'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}