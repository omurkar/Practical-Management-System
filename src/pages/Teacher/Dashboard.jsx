import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import ProtectedRoute from '../../components/ProtectedRoute';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // --- STATE ---
  const [exams, setExams] = useState([]);
  const [templates, setTemplates] = useState([]); // New State for Templates
  const [loading, setLoading] = useState(true);

  // --- DATA FETCHING ---
  useEffect(() => {
    if (!currentUser) return;

    // 1. Fetch Active/Past Exams
    const qExams = query(collection(db, 'exams'), where('teacher_email', '==', currentUser.email));
    const unsubExams = onSnapshot(qExams, (snapshot) => {
      const examList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by creation date (newest first)
      setExams(examList.sort((a, b) => b.created_at - a.created_at));
      setLoading(false);
    });

    // 2. Fetch Saved Templates
    const qTemplates = query(collection(db, 'exam_templates'), where('teacher_email', '==', currentUser.email));
    const unsubTemplates = onSnapshot(qTemplates, (snapshot) => {
      const tempList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort templates by newest
      setTemplates(tempList.sort((a, b) => b.created_at - a.created_at));
    });

    return () => {
        unsubExams();
        unsubTemplates();
    };
  }, [currentUser]);

  // --- ACTIONS ---

  // Use Template: Send data to Exam Wizard
  const handleUseTemplate = (template) => {
    navigate('/teacher/exam-wizard', { state: { template } });
  };

  // Delete Template
  const handleDeleteTemplate = async (templateId) => {
    if(!window.confirm("Are you sure you want to delete this template?")) return;
    try {
        await deleteDoc(doc(db, 'exam_templates', templateId));
    } catch (e) { 
        alert("Error deleting template: " + e.message); 
    }
  };

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold text-gray-800">Teacher Dashboard</h1>
            <button
              onClick={() => navigate('/teacher/exam-wizard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition transform hover:scale-105"
            >
              + Create New Session (From Scratch)
            </button>
          </div>

          {/* --- SECTION 1: SAVED TEMPLATES --- */}
          {templates.length > 0 && (
            <div className="mb-12 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
                <span>📂</span> Saved Templates
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {templates.map((t) => (
                  <div key={t.id} className="bg-white rounded-xl shadow-sm border-l-4 border-purple-500 p-5 hover:shadow-md transition relative group">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-gray-800 truncate pr-6" title={t.template_name}>
                            {t.template_name}
                        </h3>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id); }}
                            className="text-gray-300 hover:text-red-500 transition"
                            title="Delete Template"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>

                    {/* Details */}
                    <div className="text-sm text-gray-600 space-y-1 mb-4">
                        <p className="flex justify-between"><span>Subject:</span> <span className="font-medium">{t.subjectName}</span></p>
                        <p className="flex justify-between"><span>Students:</span> <span className="font-medium">{t.students?.length || 0}</span></p>
                        <p className="flex justify-between"><span>Questions:</span> <span className="font-medium">{t.questions?.length || 0}</span></p>
                    </div>

                    {/* Action Button */}
                    <button 
                        onClick={() => handleUseTemplate(t)}
                        className="w-full bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-600 hover:text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                        <span>⚡</span> Use This Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- SECTION 2: EXAM SESSIONS --- */}
          <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
            <span>📡</span> Recent Sessions
          </h2>
          
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading exams...</div>
          ) : exams.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500 mb-2">No exam sessions found.</p>
              <p className="text-sm text-gray-400">Click "Create New Session" to get started.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {exams.map((exam) => (
                <div 
                    key={exam.id} 
                    onClick={() => navigate(`/teacher/monitor?session=${exam.id}`)} 
                    className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition border border-gray-100 group relative overflow-hidden"
                >
                  {/* Status Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${exam.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {exam.is_active && <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>}
                      {exam.is_active ? 'Live' : 'Ended'}
                    </span>
                    <span className="text-gray-400 text-xs font-mono">
                        {exam.created_at?.seconds ? new Date(exam.created_at.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  
                  {/* Session Info */}
                  <h3 className="text-2xl font-bold text-gray-800 mb-1 font-mono group-hover:text-blue-600 transition">
                    {exam.id}
                  </h3>
                  <p className="text-gray-600 font-medium truncate" title={exam.subject_name}>
                    {exam.subject_name}
                  </p>
                  
                  {/* Footer Stats */}
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm text-gray-500">
                    <div>
                      <span className="block text-xs uppercase text-gray-400 font-semibold">Class</span>
                      {exam.student_year} ({exam.student_department})
                    </div>
                    <div className="text-right">
                      <span className="block text-xs uppercase text-gray-400 font-semibold">Lab</span>
                      {exam.lab_number}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;