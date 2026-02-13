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
import { 
  ShieldCheck, 
  Leaf, 
  Zap, 
  IndianRupee, 
  Award, 
  Phone, 
  Mail,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link'; // Assuming you are using Next.js

const About = () => {
  return (
    // ADDED: style={{ backgroundColor: '#050505' }} to force black background
    <div className="min-h-screen bg-[#050505] font-sans text-gray-100" style={{ backgroundColor: '#050505' }}>
      
      {/* --- TEMPORARY NAVBAR (In case your import was broken) --- */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="text-xl font-bold tracking-tighter text-white">
            NEXT<span className="text-blue-500">SOLVES</span>
        </div>
        <Link href="/" className="text-sm text-gray-400 hover:text-white flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Home
        </Link>
      </nav>

      {/* --- HERO SECTION --- */}
      <div className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Manual Gradient Fallback */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] to-[#050505] -z-20"></div>
        
        {/* Background Glow Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600 rounded-full blur-[120px] opacity-20 -z-10"></div>
        
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight text-white">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">PMS</span>
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
          <div className="bg-gray-900 border-l-4 border-blue-600 p-8 rounded-r-xl text-left shadow-lg">
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

      {/* --- WHAT IS PMS? --- */}
      <div className="py-24 px-4 relative bg-slate-50 text-slate-900">
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">What is PMS?</h2>
            <p className="text-slate-600 max-w-3xl mx-auto text-lg">
              PMS is a comprehensive digital ecosystem that serves as a centralized command center for HODs and faculty.
            </p>
          </div>

          {/* ADVANTAGES GRID */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Card 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 relative overflow-hidden group hover:-translate-y-1 transition-transform">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
              <div className="mb-4 text-green-600"><Leaf size={32} /></div>
              <h3 className="text-xl font-bold mb-2">Zero Paperwork</h3>
              <p className="text-slate-500 text-sm">Eliminating physical answer sheets for a green campus.</p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 relative overflow-hidden group hover:-translate-y-1 transition-transform">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
              <div className="mb-4 text-blue-600"><ShieldCheck size={32} /></div>
              <h3 className="text-xl font-bold mb-2">Absolute Security</h3>
              <p className="text-slate-500 text-sm">Encrypted question banks ensure zero leaks.</p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 relative overflow-hidden group hover:-translate-y-1 transition-transform">
              <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
              <div className="mb-4 text-yellow-600"><Zap size={32} /></div>
              <h3 className="text-xl font-bold mb-2">Instant Results</h3>
              <p className="text-slate-500 text-sm">Results generated in minutes, not weeks.</p>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 relative overflow-hidden group hover:-translate-y-1 transition-transform">
              <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
              <div className="mb-4 text-purple-600"><IndianRupee size={32} /></div>
              <h3 className="text-xl font-bold mb-2">Cost Efficiency</h3>
              <p className="text-slate-500 text-sm">Save approx ₹5,00,000 per year per college.</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- TEAM & RELIABILITY --- */}
      <div className="py-20 px-4 bg-black">
        <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-10">Proven Reliability</h2>
            <div className="bg-blue-900/20 border border-blue-500/30 p-8 rounded-2xl max-w-3xl mx-auto">
                 <Award size={40} className="text-yellow-400 mx-auto mb-4" />
                 <p className="text-xl text-blue-100 italic mb-4">"The system is perfectly stable and has replaced our manual logs completely."</p>
                 <div className="font-bold text-white">Mr. Vijay Rawool</div>
                 <div className="text-blue-400 text-sm">IT HOD & IQAC Head, Thakur Shyamnarayan College</div>
            </div>
        </div>
      </div>

    </div>
  );
};

export default About;