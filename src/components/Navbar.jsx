import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // If no user is logged in, you might want to show a basic navbar or nothing.
  // Currently set to return null based on your snippet, but often a basic logo is better.
  if (!currentUser) {
    return (
      <nav className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">PMS</Link>
          <div className="space-x-4">
            <Link to="/" className="hover:text-blue-200">Home</Link>
            <Link to="/about" className="hover:text-blue-200">About</Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo / Brand */}
          <Link to="/" className="text-xl font-bold hover:text-blue-100 transition">
            PMS - Practical Management System
          </Link>
          
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-blue-200 font-medium">Home</Link>
            <Link to="/about" className="hover:text-blue-200 font-medium">About</Link>

            {/* Admin Dashboard Link */}
            {userRole === 'admin' && (
              <Link to="/admin/dashboard" className="hover:text-blue-200 font-medium">
                Admin Dashboard
              </Link>
            )}
            
            {/* Teacher Dashboard Link */}
            {userRole === 'teacher' && (
              <Link to="/teacher/dashboard" className="hover:text-blue-200 font-medium">
                Dashboard
              </Link>
            )}

            {/* User Info & Logout */}
            <div className="flex items-center gap-3 bg-blue-700 px-3 py-1.5 rounded-lg">
              <span className="text-sm font-medium border-r border-blue-500 pr-3">
                {currentUser.email || currentUser.name || 'User'}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-bold text-white hover:text-red-200 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;