import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Book as BookIcon, Clock, Check, X } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author: string;
  is_available: boolean;
  category: string;
}

interface Profile {
  full_name: string;
  email: string;
}

interface BorrowRequest {
  id: string;
  status: string;
  created_at: string;
  book: Book;
  requester: Profile;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<BorrowRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
  
    const fetchData = async () => {
      try {
        setLoading(true);
    
        // Fetch my books
        const { data: booksData } = await supabase
          .from('books')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });
    
        // Fetch requests I've received (as a book owner)
        const { data: receivedData } = await supabase
          .from('borrow_requests')
          .select(`
            id,
            status,
            created_at,
            book:books!book_id(id, title, author, is_available, category),
            requester:profiles!requester_id(full_name, email)
          `)
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });
    
        // Fetch requests I've sent (as a requester)
        const { data: sentData } = await supabase
          .from('borrow_requests')
          .select(`
            id,
            status,
            created_at,
            book:books!book_id(id, title, author, is_available, category),
            requester:profiles!requester_id(full_name, email)
          `)
          .eq('requester_id', user.id)
          .order('created_at', { ascending: false });
    
        setMyBooks(booksData || []);
        setReceivedRequests(receivedData as unknown as BorrowRequest[] || []);
        setSentRequests(sentData as unknown as BorrowRequest[] || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [user, navigate]);

  async function handleRequestAction(requestId: string, status: 'accepted' | 'declined') {
    try {
      const { error } = await supabase
        .from('borrow_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      // Update the local state to reflect the change
      setReceivedRequests(prevRequests =>
        prevRequests.map(request =>
          request.id === requestId ? { ...request, status } : request
        )
      );

      toast.success(`Request ${status}`);
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Failed to update request');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <div className="grid gap-8">
        {/* Pending Requests Section */}
        {receivedRequests.some(req => req.status === 'pending') && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-yellow-800">
              <Clock className="h-5 w-5 mr-2" />
              Pending Requests
            </h2>
            <div className="divide-y divide-yellow-200">
              {receivedRequests
                .filter(request => request.status === 'pending')
                .map((request) => (
                  <div key={request.id} className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-yellow-900">
                          {request.requester.full_name} wants to borrow "{request.book.title}"
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Contact: {request.requester.email}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRequestAction(request.id, 'accepted')}
                          className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleRequestAction(request.id, 'declined')}
                          className="flex items-center px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* My Books Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <BookIcon className="h-5 w-5 mr-2 text-indigo-600" />
            My Books
          </h2>
          {myBooks.length === 0 ? (
            <p className="text-gray-500">You haven't added any books yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {myBooks.map((book) => (
                <div key={book.id} className="border rounded-lg p-4">
                  <h3 className="font-medium">{book.title}</h3>
                  <p className="text-gray-600 text-sm">{book.author}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                      {book.category}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        book.is_available
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {book.is_available ? 'Available' : 'Borrowed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Request History Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Request History</h2>
          {receivedRequests.filter(req => req.status !== 'pending').length === 0 ? (
            <p className="text-gray-500">No request history.</p>
          ) : (
            <div className="divide-y">
              {receivedRequests
                .filter(request => request.status !== 'pending')
                .map((request) => (
                  <div key={request.id} className="py-4">
                    <p>
                      <span className="font-medium">{request.requester.full_name}</span> requested{' '}
                      <span className="font-medium">"{request.book.title}"</span>
                    </p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                        request.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* My Requests Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">My Requests</h2>
          {sentRequests.length === 0 ? (
            <p className="text-gray-500">You haven't requested any books yet.</p>
          ) : (
            <div className="divide-y">
              {sentRequests.map((request) => (
                <div key={request.id} className="py-4">
                  <p>
                    You requested <span className="font-medium">"{request.book.title}"</span>
                  </p>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                      request.status === 'accepted'
                        ? 'bg-green-100 text-green-800'
                        : request.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {request.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}