import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Book, UserCircle, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const { user, signIn, signOut } = useAuth();
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    if (user) {
      const fetchPendingRequests = async () => {
        const { count } = await supabase
          .from('borrow_requests')
          .select('id', { count: 'exact', head: true })
          .eq('book.owner_id', user.id)
          .eq('status', 'pending');
        
        setPendingRequests(count || 0);
      };

      fetchPendingRequests();

      // Subscribe to changes in borrow_requests
      const channel = supabase
        .channel('borrow_requests_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'borrow_requests',
          },
          () => {
            fetchPendingRequests();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Book className="h-6 w-6 text-indigo-600" />
            <span className="font-semibold text-xl">BookShare</span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/add-book"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Agregar libro
                </Link>
                <Link to="/profile" className="relative">
                  {pendingRequests > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {pendingRequests}
                    </span>
                  )}
                  <UserCircle className="h-6 w-6 text-gray-700 hover:text-indigo-600" />
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-700 hover:text-indigo-600"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button
                onClick={() => signIn()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Ingresar
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}