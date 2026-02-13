// import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
// import { AuthProvider } from './context/AuthContext';
// import app from './firebase';
// import FirebaseError from './components/FirebaseError';

// // Pages
// import Home from './pages/Home';
// import About from './pages/About';
// import AdminLogin from './pages/Admin/AdminLogin';
// import AdminDashboard from './pages/Admin/AdminDashboard';
// import TeacherLogin from './pages/Teacher/TeacherLogin';
// import TeacherDashboard from './pages/Teacher/Dashboard';
// import ExamWizard from './pages/Teacher/ExamWizard';
// import Monitor from './pages/Teacher/Monitor';
// import StudentLogin from './pages/Student/StudentLogin';
// import ExamInterface from './pages/Student/ExamInterface';

// // Simple Navigation Component
// const Navbar = () => (
//   <nav style={{ 
//     padding: '1rem 2rem', 
//     display: 'flex', 
//     justifyContent: 'space-between', 
//     alignItems: 'center',
//     background: '#fff',
//     boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
//   }}>
//     <Link to="/" style={{ fontWeight: 'bold', fontSize: '1.2rem', textDecoration: 'none', color: '#333' }}>
//       PMS
//     </Link>
//     <div style={{ display: 'flex', gap: '20px' }}>
//       <Link to="/" style={{ textDecoration: 'none', color: '#666' }}>Home</Link>
//       <Link to="/about" style={{ textDecoration: 'none', color: '#666' }}>About</Link>
//     </div>
//   </nav>
// );

// function App() {
//   // Check if Firebase is properly initialized
//   if (!app) {
//     return <FirebaseError />;
//   }

//   return (
//     <AuthProvider>
//       <Router>
//         {/* The Navbar stays visible across all routes */}
//         <Navbar />
        
//         <Routes>
//           <Route path="/" element={<Home />} />
//           <Route path="/about" element={<About />} />
          
//           {/* Admin Routes */}
//           <Route path="/admin/login" element={<AdminLogin />} />
//           <Route path="/admin/dashboard" element={<AdminDashboard />} />
          
//           {/* Teacher Routes */}
//           <Route path="/teacher/login" element={<TeacherLogin />} />
//           <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
//           <Route path="/teacher/exam-wizard" element={<ExamWizard />} />
//           <Route path="/teacher/monitor" element={<Monitor />} />
          
//           {/* Student Routes */}
//           <Route path="/student/login" element={<StudentLogin />} />
//           <Route path="/student/exam" element={<ExamInterface />} />
          
//           {/* Catch all */}
//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//       </Router>
//     </AuthProvider>
//   );
// }

// export default App;



import React from 'react';
import Navbar from './components/Navbar';
import { 
  ShieldCheck, 
  Leaf, 
  Zap, 
  IndianRupee, 
  Award, 
  Phone, 
  Mail 
} from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-[#050505] font-sans text-gray-100">
      <Navbar />

      {/* --- HERO SECTION (Dark Theme to match Navbar) --- */}
      <div className="relative bg-[radial-gradient(circle_at_top_right,_#1a1a1a_0%,_#050505_40%)] text-white pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Glow Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -z-10"></div>
        
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            About PMS
          </h1>
          <p className="text-xl md:text-2xl font-light text-gray-300 mb-8">
            The Operating System for Modern Practical Exams.
          </p>
          <div className="inline-block bg-white/10 backdrop-blur-md border border-white/20 text-blue-200 px-6 py-2 rounded-full font-bold shadow-lg uppercase tracking-wide text-sm">
            Powered by Nextsolves
          </div>
        </div>
      </div>

      {/* --- MISSION SECTION --- */}
      <div className="py-20 px-4 bg-[#0a0a0a]">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
          <h3 className="text-2xl text-blue-500 font-bold mb-6">To Replace Chaos with Control.</h3>
          <p className="text-gray-400 text-lg leading-relaxed mb-10">
            For decades, practical examinations have been synonymous with logistical nightmares: 
            loose attendance slips, manual mark entry, endless spreadsheets, and the constant risk of human error.
          </p>
          <div className="bg-gray-900/50 border-l-4 border-blue-600 p-8 rounded-r-xl text-left shadow-lg">
            <p className="text-gray-200 font-medium text-lg">
              We built the <span className="font-bold text-blue-400">Practical Management System (PMS)</span> to change that.
            </p>
            <p className="text-gray-400 mt-2">
              Powered by the innovation engine of Nextsolves, PMS is the first intelligent ERP designed exclusively 
              to automate, secure, and streamline University Practical Examinations. We don’t just digitize the process; 
              <span className="font-bold text-gray-200"> we eliminate the workload.</span>
            </p>
          </div>
        </div>
      </div>

      {/* --- WHAT IS PMS? (Attractive Background) --- */}
      <div className="py-24 px-4 relative bg-slate-50">
        {/* Decorative Background Pattern (Grid) */}
        <div className="absolute inset-0 z-0 opacity-[0.4]" 
             style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
        </div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">What is PMS?</h2>
            <p className="text-slate-600 max-w-3xl mx-auto text-lg">
              PMS is a comprehensive digital ecosystem that bridges the gap between traditional manual processes and modern efficiency. 
              It serves as a centralized command center for HODs and faculty.
            </p>
          </div>

          {/* ADVANTAGES GRID */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Card 1 */}
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600"></div>
              <div className="mb-6 w-14 h-14 bg-green-50 rounded-lg flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <Leaf size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Zero Paperwork</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                We transform campuses into eco-friendly zones by eliminating the need for physical answer sheets.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
              <div className="mb-6 w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Absolute Security</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Encrypted question bank technology ensures zero chance of paper leaks, protecting integrity.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
              <div className="mb-6 w-14 h-14 bg-yellow-50 rounded-lg flex items-center justify-center text-yellow-600 group-hover:bg-yellow-600 group-hover:text-white transition-colors">
                <Zap size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Instant Results</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                What used to take weeks of manual checking is now generated in minutes automatically.
              </p>
            </div>

            {/* Card 4 */}
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>
              <div className="mb-6 w-14 h-14 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <IndianRupee size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Cost Efficiency</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                By removing printing and logistical waste, PMS saves institutions approx <span className="font-bold">₹5,00,000</span>/year.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- TEAM SECTION --- */}
      <div className="py-20 px-4 bg-[#0a0a0a]">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">The Team Behind the Tech</h2>
          <p className="text-gray-400 mb-12">
            PMS is the flagship innovation of <span className="font-bold text-blue-400">Nextsolves</span>.
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-8">
            {/* Founder 1 */}
            <div className="bg-[#151515] p-8 rounded-2xl shadow-lg border border-gray-800 flex-1 hover:border-blue-500/30 transition duration-300">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full mx-auto mb-6 flex items-center justify-center text-2xl font-bold text-gray-300 shadow-inner">OM</div>
              <h3 className="text-xl font-bold text-white">Om Chandrashekhar Murkar</h3>
              <p className="text-blue-500 font-medium text-sm uppercase tracking-wider mt-1">Founder</p>
            </div>

            {/* Founder 2 */}
            <div className="bg-[#151515] p-8 rounded-2xl shadow-lg border border-gray-800 flex-1 hover:border-blue-500/30 transition duration-300">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full mx-auto mb-6 flex items-center justify-center text-2xl font-bold text-gray-300 shadow-inner">JM</div>
              <h3 className="text-xl font-bold text-white">Jagruti Rajan Morvekar</h3>
              <p className="text-blue-500 font-medium text-sm uppercase tracking-wider mt-1">Co-Founder</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- PROVEN RELIABILITY --- */}
      <div className="py-20 px-4 bg-blue-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="mb-6 flex justify-center"><Award size={48} className="text-yellow-400" /></div>
          <h2 className="text-3xl font-bold text-white mb-8">Proven Reliability</h2>
          <p className="text-lg md:text-xl text-blue-100 mb-10 leading-relaxed">
            The system has been successfully deployed and piloted at 
            <span className="font-bold text-white border-b-2 border-yellow-400 pb-1 ml-2">Thakur Shyamnarayan Degree College</span>.
          </p>
          <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20 relative mx-auto max-w-2xl">
            <p className="text-xl italic font-serif text-white mb-6">
              "The system is perfectly stable and has replaced our manual logs completely."
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-1 bg-yellow-400 rounded-full"></div>
              <div className="text-left">
                <div className="text-white font-bold text-sm">Mr. Vijay Rawool</div>
                <div className="text-blue-200 text-xs uppercase tracking-wide">IT HOD & IQAC Head</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTACT / CTA --- */}
      <div className="bg-black text-gray-300 py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Upgrade Your Exam Cell?</h2>
          <p className="mb-10 text-lg text-gray-400">Join the institutions moving towards a paperless, error-free future.</p>
          
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-full font-bold shadow-lg shadow-blue-900/20 mb-16 transition transform hover:scale-105">
            Request a Live Demo
          </button>

          <div className="grid md:grid-cols-2 gap-8 text-left max-w-2xl mx-auto border-t border-gray-800 pt-10">
            <div className="space-y-4">
              <h4 className="text-white font-bold text-lg">Om Murkar</h4>
              <div className="flex items-center gap-3 text-gray-400 hover:text-white transition">
                <Phone size={18} className="text-blue-500" />
                <span>+91 9136234409</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400 hover:text-white transition">
                <Mail size={18} className="text-blue-500" />
                <a href="mailto:ommurkar34@gmail.com">ommurkar34@gmail.com</a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-white font-bold text-lg">Jagruti Morvekar</h4>
              <div className="flex items-center gap-3 text-gray-400 hover:text-white transition">
                <Phone size={18} className="text-blue-500" />
                <span>+91 9321632938</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400 hover:text-white transition">
                <Mail size={18} className="text-blue-500" />
                <a href="mailto:jagrutimorvekar@gmail.com">jagrutimorvekar@gmail.com</a>
              </div>
            </div>
          </div>

          <div className="mt-16 text-sm text-gray-600 border-t border-gray-900 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p>Copyright © 2026 Nextsolves. All Rights Reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <span className="cursor-pointer hover:text-gray-400">Privacy Policy</span>
              <span className="cursor-pointer hover:text-gray-400">Terms of Service</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;