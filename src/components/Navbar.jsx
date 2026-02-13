// import React from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';

// const Navbar = () => {
//   const { currentUser, userRole, logout } = useAuth();
//   const navigate = useNavigate();

//   const handleLogout = async () => {
//     try {
//       await logout();
//       navigate('/');
//     } catch (error) {
//       console.error("Logout failed", error);
//     }
//   };

//   // 1. PUBLIC VIEW (If user is NOT logged in)
//   if (!currentUser) {
//     return (
//       <nav className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
//         <div className="container mx-auto px-4 py-3">
//           <div className="flex justify-between items-center">
//             <Link to="/" className="text-xl font-bold hover:text-blue-100 transition">
//               PMS
//             </Link>
//             <div className="flex items-center gap-6">
//               <Link to="/" className="hover:text-blue-200 font-medium">Home</Link>
//               <Link to="/about" className="hover:text-blue-200 font-medium">About</Link>
//               <Link to="/teacher/login" className="bg-white text-blue-600 px-4 py-1.5 rounded font-bold hover:bg-gray-100 transition text-sm">
//                 Login
//               </Link>
//             </div>
//           </div>
//         </div>
//       </nav>
//     );
//   }

//   // 2. LOGGED IN VIEW (Admin or Teacher)
//   return (
//     <nav className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
//       <div className="container mx-auto px-4 py-3">
//         <div className="flex justify-between items-center">
//           <Link to="/" className="text-xl font-bold">
//             PMS - Practical Management System
//           </Link>
          
//           <div className="flex items-center gap-4">
//             {/* Show Admin Dashboard Link */}
//             {userRole === 'admin' && (
//               <Link 
//                 to="/admin/dashboard"
//                 className="hover:text-blue-200 font-medium"
//               >
//                 Admin Dashboard
//               </Link>
//             )}
            
//             {/* Show Teacher Dashboard Link */}
//             {userRole === 'teacher' && (
//               <Link to="/teacher/dashboard" className="hover:text-blue-200 font-medium">
//                 Dashboard
//               </Link>
//             )}

//             <div className="flex items-center gap-3 bg-blue-700 px-3 py-1.5 rounded-lg">
//                 <span className="text-sm border-r border-blue-500 pr-3">
//                 {currentUser.email || currentUser.name || 'User'}
//                 </span>
//                 <button
//                 onClick={handleLogout}
//                 className="text-sm font-bold hover:text-red-200 transition"
//                 >
//                 Logout
//                 </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;



import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // Check if the user is a Student OR is on the Student Login Page
  const isStudentMode = (currentUser && userRole === 'student') || location.pathname === '/student/login';

  // --- 🔒 RESTRICTED VIEW (Student Mode) ---
  if (isStudentMode) {
    return (
      <nav className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Brand - Non-clickable (Text Only) so they can't go Home */}
            <span className="text-xl font-bold cursor-default select-none">
              PMS
            </span>
            
            <div className="flex items-center gap-6">
              {/* Only About Link is allowed */}
              <Link to="/about" className="hover:text-blue-200 font-medium">About</Link>

              {/* Show Logout ONLY if actually logged in */}
              {currentUser && (
                <div className="flex items-center gap-3 bg-blue-700 px-3 py-1.5 rounded-lg">
                  <span className="text-sm border-r border-blue-500 pr-3">
                    {currentUser.email || currentUser.name || 'Student'}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-bold hover:text-red-200 transition"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // --- 🌍 STANDARD VIEW (Public / Teacher / Admin) ---
  return (
    <nav className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Brand - Clickable for everyone else */}
          <Link to="/" className="text-xl font-bold hover:text-blue-100 transition">
            PMS - Practical Management System
          </Link>
          
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-blue-200 font-medium">Home</Link>
            <Link to="/about" className="hover:text-blue-200 font-medium">About</Link>

            {/* Admin Dashboard Link */}
            {currentUser && userRole === 'admin' && (
              <Link to="/admin/dashboard" className="hover:text-blue-200 font-medium">
                Admin Dashboard
              </Link>
            )}
            
            {/* Teacher Dashboard Link */}
            {currentUser && userRole === 'teacher' && (
              <Link to="/teacher/dashboard" className="hover:text-blue-200 font-medium">
                Dashboard
              </Link>
            )}

            {/* User Info & Logout (If logged in) */}
            {currentUser ? (
              <div className="flex items-center gap-3 bg-blue-700 px-3 py-1.5 rounded-lg">
                  <span className="text-sm border-r border-blue-500 pr-3">
                  {currentUser.email || currentUser.name || 'User'}
                  </span>
                  <button
                  onClick={handleLogout}
                  className="text-sm font-bold hover:text-red-200 transition"
                  >
                  Logout
                  </button>
              </div>
            ) : (
                // ❌ Login Button REMOVED globally as requested
                null
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;