import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!currentUser) {
    return null;
  }

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">
            PMS - Practical Management System
          </Link>
          
          <div className="flex items-center gap-4">
            {userRole === 'admin' && (
              <button
                onClick={handleLogout}
                className="hover:text-blue-200"
              >
                Dashboard
              </button>
            )}
            
            {/* UPDATED: Only Dashboard link is shown for teacher now */}
            {userRole === 'teacher' && (
              <Link to="/teacher/dashboard" className="hover:text-blue-200">
                Dashboard
              </Link>
            )}

            <span className="text-sm">
              {currentUser.email || currentUser.name || 'User'}
            </span>
            <button
              onClick={handleLogout}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;