import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import app from './firebase';
import FirebaseError from './components/FirebaseError';

// Pages
import Home from './pages/Home';
import About from './pages/About'; // 1. Import the About Page
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import TeacherLogin from './pages/Teacher/TeacherLogin';
import TeacherDashboard from './pages/Teacher/Dashboard';
import ExamWizard from './pages/Teacher/ExamWizard';
import Monitor from './pages/Teacher/Monitor';
import StudentLogin from './pages/Student/StudentLogin';
import ExamInterface from './pages/Student/ExamInterface';

function App() {
  // Check if Firebase is properly initialized
  if (!app) {
    return <FirebaseError />;
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} /> {/* 2. Add the Route here */}
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          
          {/* Teacher Routes */}
          <Route path="/teacher/login" element={<TeacherLogin />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/exam-wizard" element={<ExamWizard />} />
          <Route path="/teacher/monitor" element={<Monitor />} />
          
          {/* Student Routes */}
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student/exam" element={<ExamInterface />} />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;