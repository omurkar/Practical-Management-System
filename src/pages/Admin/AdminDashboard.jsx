import { useState, useEffect } from 'react';
import { collection, getDocs, query, deleteDoc, doc, setDoc, writeBatch, where } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import * as XLSX from 'xlsx';
import { db, firebaseConfig } from '../../firebase';
import Navbar from '../../components/Navbar';
import ProtectedRoute from '../../components/ProtectedRoute';

const AdminDashboard = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ email: '', password: '', name: '', department: '' });
  
  // --- SUBMISSION STATE ---
  const [groupedSessions, setGroupedSessions] = useState({});
  const [selectedSessionKey, setSelectedSessionKey] = useState(null); 
  const [exportLoading, setExportLoading] = useState(false);
  
  // --- BULK TEACHER CREATION STATE ---
  const [bulkTeachers, setBulkTeachers] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // --- SEARCH & BULK DELETE STATE ---
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  
  // --- SEARCH STATES ---
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');

  // --- SESSION DELETE STATE ---
  const [sessionToDelete, setSessionToDelete] = useState(null);

  const [secondaryAuth] = useState(() => {
    const secondaryApp = initializeApp(firebaseConfig, 'secondary');
    return getAuth(secondaryApp);
  });

  useEffect(() => {
    fetchTeachers();
    fetchData(); // Changed to fetch both Exams and Students
  }, []);

  // --- HELPER: FORMAT DATE ---
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      // Check if date is valid
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString('en-GB', { 
        day: 'numeric', month: 'short', year: 'numeric' 
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const fetchTeachers = async () => {
    try {
      const q = query(collection(db, 'teachers'));
      const querySnapshot = await getDocs(q);
      const teachersList = [];
      querySnapshot.forEach((doc) => {
        teachersList.push({ id: doc.id, ...doc.data() });
      });
      setTeachers(teachersList);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      // 1. Fetch All Exams (Sessions) to get accurate Dates
      const examsQuery = query(collection(db, 'exams'));
      const examsSnapshot = await getDocs(examsQuery);
      const examMap = {};
      
      examsSnapshot.forEach((doc) => {
        const data = doc.data();
        // Store exam details keyed by session code (doc.id)
        examMap[doc.id] = {
          created_at: data.created_at, // This is the source of truth for Date
          lab_number: data.lab_number,
          subject: data.subject_name
        };
      });

      // 2. Fetch All Students
      const studentsQuery = query(collection(db, 'students'));
      const studentsSnapshot = await getDocs(studentsQuery);
      const submissions = [];
      studentsSnapshot.forEach((doc) => {
        submissions.push({ id: doc.id, ...doc.data() });
      });
      
      // 3. Group Students by Session
      const groups = {};
      
      // Initialize groups from Exams first (so we show sessions even with 0 students)
      Object.keys(examMap).forEach(code => {
        groups[code] = {
            session_code: code,
            lab_number: examMap[code].lab_number || 'N/A',
            date_obj: examMap[code].created_at, // Use Exam creation date
            students: [],
            count: 0
        };
      });

      // Add students to groups
      submissions.forEach(sub => {
        const code = sub.session_code || 'Unknown';
        
        // If session not in examMap (maybe deleted?), create a fallback group
        if (!groups[code]) {
          groups[code] = {
            session_code: code,
            lab_number: sub.lab_number || 'N/A', 
            date_obj: sub.joined_at, // Fallback to student join date
            students: [],
            count: 0
          };
        }
        
        groups[code].students.push(sub);
        groups[code].count++;
      });

      setGroupedSessions(groups);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // --- FILTERING & SORTING ---
  
  const filteredTeachers = teachers.filter(t => {
    const term = teacherSearch.toLowerCase();
    return (
      (t.name?.toLowerCase() || '').includes(term) ||
      (t.email?.toLowerCase() || '').includes(term) ||
      (t.department?.toLowerCase() || '').includes(term)
    );
  });

  // SORTING LOGIC: Latest Date First
  const filteredSessions = Object.values(groupedSessions)
    .filter(session => {
      const term = sessionSearch.toLowerCase();
      return (
        (session.session_code?.toLowerCase() || '').includes(term) ||
        (session.lab_number?.toLowerCase() || '').includes(term)
      );
    })
    .sort((a, b) => {
      // Handle Firestore Timestamp or Date objects
      const dateA = a.date_obj?.toDate ? a.date_obj.toDate() : new Date(a.date_obj || 0);
      const dateB = b.date_obj?.toDate ? b.date_obj.toDate() : new Date(b.date_obj || 0);
      return dateB - dateA; // Descending
    });

  const getFilteredStudentsForSession = () => {
    if (!selectedSessionKey || !groupedSessions[selectedSessionKey]) return [];
    
    const students = groupedSessions[selectedSessionKey].students;
    const term = submissionSearch.toLowerCase();
    
    // Sort students by Roll Number
    const sortedStudents = [...students].sort((a, b) => 
        (a.roll_no || '').localeCompare(b.roll_no || '', undefined, { numeric: true })
    );

    if (!term) return sortedStudents;

    return sortedStudents.filter(sub => 
      (sub.roll_no?.toLowerCase() || '').includes(term) ||
      (sub.name?.toLowerCase() || '').includes(term)
    );
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        newTeacher.email,
        newTeacher.password
      );
      await setDoc(doc(db, 'teachers', userCredential.user.uid), {
        name: newTeacher.name,
        email: newTeacher.email,
        department: newTeacher.department,
        role: 'teacher'
      });
      alert('Teacher account created successfully!');
      setNewTeacher({ email: '', password: '', name: '', department: '' });
      setShowAddForm(false);
      fetchTeachers();
    } catch (error) {
      alert('Error creating teacher: ' + error.message);
    }
  };

  const handleSelectAllTeachers = (e) => {
    if (e.target.checked) {
      const allIds = new Set(filteredTeachers.map(t => t.id));
      setSelectedTeacherIds(allIds);
    } else {
      setSelectedTeacherIds(new Set());
    }
  };

  const handleSelectOneTeacher = (id) => {
    const newSet = new Set(selectedTeacherIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedTeacherIds(newSet);
  };

  const handleBulkDeleteTeachers = async () => {
    if (selectedTeacherIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedTeacherIds.size} teacher(s)?`)) return;

    setIsDeleting(true);
    try {
      const batch = writeBatch(db);
      selectedTeacherIds.forEach(id => {
        const docRef = doc(db, 'teachers', id);
        batch.delete(docRef);
      });
      await batch.commit();
      
      alert(`Successfully deleted ${selectedTeacherIds.size} teacher(s).`);
      setSelectedTeacherIds(new Set());
      fetchTeachers();
    } catch (error) {
      console.error("Bulk delete error:", error);
      alert("Failed to delete teachers: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const normalizeRow = (row) => {
      const normalized = {};
      Object.entries(row || {}).forEach(([key, value]) => {
        const cleanKey = String(key || '').toLowerCase().trim();
        const cleanVal = typeof value === 'string' ? value.trim() : value;
        normalized[cleanKey] = cleanVal;
      });
      return normalized;
    };

    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    const normalizedRows = jsonData.map(normalizeRow);

    const parsed = normalizedRows
      .map((row) => ({
        name: String(row['full name'] || row['name'] || '').trim(),
        email: String(row['email id'] || row['email'] || '').trim(),
        password: String(row['password'] || '').trim(),
        department: String(row['department'] || '').trim(),
      }))
      .filter((t) => t.name && t.email && t.password && t.department);

    if (parsed.length === 0) {
      alert('Bulk upload: no valid rows found.');
      setBulkTeachers([]);
      return;
    }
    setBulkTeachers(parsed);
  };

  const handleBulkCreate = async () => {
    if (bulkTeachers.length === 0) return;
    setBulkLoading(true);
    const results = { success: 0, failed: 0, errors: [] };

    for (const teacher of bulkTeachers) {
      try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, teacher.email, teacher.password);
        await setDoc(doc(db, 'teachers', userCredential.user.uid), {
          name: teacher.name,
          email: teacher.email,
          department: teacher.department,
          role: 'teacher',
        });
        results.success += 1;
      } catch (error) {
        results.failed += 1;
        results.errors.push(`${teacher.email}: ${error.message}`);
      }
    }
    setBulkLoading(false);
    fetchTeachers();
    alert(`Bulk upload completed. Success: ${results.success}, Failed: ${results.failed}`);
    setBulkTeachers([]);
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!globalThis.confirm('Delete this teacher?')) return;
    try {
      await deleteDoc(doc(db, 'teachers', teacherId));
      fetchTeachers();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const confirmDeleteSession = (e, sessionCode) => {
    e.stopPropagation(); 
    setSessionToDelete(sessionCode);
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      const batch = writeBatch(db);
      
      const examRef = doc(db, 'exams', sessionToDelete);
      batch.delete(examRef);

      const studentsQ = query(collection(db, 'students'), where('session_code', '==', sessionToDelete));
      const studentsSnap = await getDocs(studentsQ);
      studentsSnap.forEach(doc => batch.delete(doc.ref));

      const questionsQ = query(collection(db, 'questions'), where('session_code', '==', sessionToDelete));
      const questionsSnap = await getDocs(questionsQ);
      questionsSnap.forEach(doc => batch.delete(doc.ref));

      await batch.commit();

      alert(`Session ${sessionToDelete} history deleted successfully.`);
      
      // Update UI
      const newGroups = { ...groupedSessions };
      delete newGroups[sessionToDelete];
      setGroupedSessions(newGroups);
      setSessionToDelete(null);

    } catch (error) {
      console.error("Error deleting session:", error);
      alert("Failed to delete session: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const exportToCSV = (data) => {
    setExportLoading(true);
    try {
      const csvRows = [];
      csvRows.push(['Date', 'Session Code', 'Lab/Room', 'Roll No', 'Name', 'Status', 'Practical Marks', 'Viva Marks', 'Total Marks']);

      data.forEach((sub) => {
        // Use Session Date if available, otherwise Student Join Date
        const dateToUse = groupedSessions[sub.session_code]?.date_obj || sub.joined_at;
        
        csvRows.push([
          formatDate(dateToUse), 
          sub.session_code || '',
          sub.lab_number || '-',
          sub.roll_no || '',
          sub.name || '',
          sub.status || '',
          sub.scores?.practical || 0,
          sub.scores?.viva || 0,
          sub.scores?.total || 0
        ]);
      });

      const csvContent = csvRows.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pms-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) {
      alert('Error exporting CSV: ' + error.message);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              {showAddForm ? 'Cancel' : '+ Add Teacher'}
            </button>
          </div>

          {showAddForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Create Teacher Account</h2>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Single Teacher</h3>
                  <form onSubmit={handleAddTeacher} className="grid md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Full Name" value={newTeacher.name} onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })} className="border rounded-lg px-4 py-2" required />
                    <input type="email" placeholder="Email" value={newTeacher.email} onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })} className="border rounded-lg px-4 py-2" required />
                    <input type="password" placeholder="Password" value={newTeacher.password} onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })} className="border rounded-lg px-4 py-2" required />
                    <input type="text" placeholder="Department" value={newTeacher.department} onChange={(e) => setNewTeacher({ ...newTeacher, department: e.target.value })} className="border rounded-lg px-4 py-2" required />
                    <button type="submit" className="md:col-span-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition">Create Account</button>
                  </form>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold">Bulk Upload</h3>
                  <input type="file" accept=".xlsx" onChange={handleBulkUpload} className="border rounded-lg px-4 py-2 w-full" />
                  <button onClick={handleBulkCreate} disabled={bulkLoading || bulkTeachers.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50">{bulkLoading ? 'Creating...' : 'Create Accounts from Excel'}</button>
                </div>
              </div>
            </div>
          )}

          {/* TEACHERS SECTION */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
              <h2 className="text-2xl font-bold">Teachers</h2>
              
              <div className="flex gap-2 w-full md:w-auto">
                <input 
                  type="text" 
                  placeholder="Search Name, Dept or Email..." 
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  className="border rounded-lg px-4 py-2 w-full md:w-64"
                />
                
                {selectedTeacherIds.size > 0 && (
                  <button 
                    onClick={handleBulkDeleteTeachers}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition whitespace-nowrap"
                  >
                    {isDeleting ? 'Deleting...' : `Delete (${selectedTeacherIds.size})`}
                  </button>
                )}
              </div>
            </div>

            {loading ? <div className="text-center py-8">Loading...</div> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="p-2 w-10">
                        <input 
                          type="checkbox" 
                          onChange={handleSelectAllTeachers}
                          checked={filteredTeachers.length > 0 && selectedTeacherIds.size === filteredTeachers.length}
                          className="w-4 h-4"
                        />
                      </th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Department</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.length === 0 ? (
                      <tr><td colSpan="5" className="p-4 text-center text-gray-500">No teachers found matching "{teacherSearch}"</td></tr>
                    ) : (
                      filteredTeachers.map((teacher) => (
                        <tr key={teacher.id} className={`border-b hover:bg-gray-50 ${selectedTeacherIds.has(teacher.id) ? 'bg-blue-50' : ''}`}>
                          <td className="p-2">
                            <input 
                              type="checkbox" 
                              checked={selectedTeacherIds.has(teacher.id)}
                              onChange={() => handleSelectOneTeacher(teacher.id)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="p-2">{teacher.name}</td>
                          <td className="p-2">{teacher.email}</td>
                          <td className="p-2">{teacher.department}</td>
                          <td className="p-2">
                            <button onClick={() => handleDeleteTeacher(teacher.id)} className="text-red-600 hover:text-red-800">Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ALL SUBMISSIONS SECTION */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">All Student Submissions</h2>
                
                {!selectedSessionKey && (
                    <div className="relative w-full md:w-64">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Filter by Session ID..." 
                            value={sessionSearch}
                            onChange={(e) => setSessionSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                )}
            </div>
            
            {!selectedSessionKey ? (
              // --- VIEW 1: SESSION CARDS (Sorted by Date DESC) ---
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredSessions.length === 0 ? (
                  <p className="text-gray-500 col-span-4 text-center py-8">
                    {Object.keys(groupedSessions).length === 0 ? "No submissions found." : "No sessions match your filter."}
                  </p>
                ) : (
                  filteredSessions.map((session) => (
                    <div 
                      key={session.session_code}
                      onClick={() => {
                        setSelectedSessionKey(session.session_code);
                        setSubmissionSearch(''); 
                      }}
                      className="border rounded-lg p-5 cursor-pointer hover:shadow-lg transition bg-gray-50 hover:bg-white hover:border-blue-300 group relative"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-xl font-bold text-blue-700">{session.session_code}</span>
                        <button 
                          onClick={(e) => confirmDeleteSession(e, session.session_code)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded-full transition"
                          title="Delete Session History"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="flex justify-between items-center mb-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                          {session.count} Students
                        </span>
                        {/* --- DATE DISPLAY --- */}
                        <span className="text-xs text-gray-500 font-medium">
                          {formatDate(session.date_obj)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p className="mb-1"><strong>Lab:</strong> {session.lab_number}</p>
                      </div>
                      <div className="mt-3 text-right">
                        <span className="text-sm text-blue-500 font-semibold group-hover:underline">View Details →</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // --- VIEW 2: DETAILS TABLE ---
              <div>
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setSelectedSessionKey(null)}
                      className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-100 transition flex items-center gap-1"
                    >
                      ← Back
                    </button>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Session: {selectedSessionKey}</h3>
                      <p className="text-xs text-gray-500">
                        Lab: {groupedSessions[selectedSessionKey]?.lab_number} • 
                        Date: {formatDate(groupedSessions[selectedSessionKey]?.date_obj)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    <input 
                      type="text" 
                      placeholder="Search Roll No or Name..." 
                      value={submissionSearch}
                      onChange={(e) => setSubmissionSearch(e.target.value)}
                      className="border rounded-lg px-4 py-2 w-full md:w-64"
                    />
                    <button 
                      onClick={() => exportToCSV(getFilteredStudentsForSession())} 
                      disabled={exportLoading} 
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 whitespace-nowrap"
                    >
                      {exportLoading ? '...' : 'Export This Session'}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Roll No</th>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Practical</th>
                        <th className="text-left p-2">Viva</th>
                        <th className="text-left p-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredStudentsForSession().length === 0 ? (
                        <tr><td colSpan="7" className="p-4 text-center text-gray-500">No students match "{submissionSearch}"</td></tr>
                      ) : (
                        getFilteredStudentsForSession().map((sub) => (
                          <tr key={sub.id} className="border-b hover:bg-gray-50">
                            {/* Uses the Exam Date first, else Student Date */}
                            <td className="p-2 text-gray-600 text-sm">
                                {formatDate(groupedSessions[sub.session_code]?.date_obj || sub.joined_at)}
                            </td>
                            <td className="p-2 font-mono">{sub.roll_no}</td>
                            <td className="p-2">{sub.name}</td>
                            <td className="p-2">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                sub.status === 'submitted' ? 'bg-green-100 text-green-800' :
                                sub.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {sub.status}
                              </span>
                            </td>
                            <td className="p-2">{sub.scores?.practical || 0}</td>
                            <td className="p-2">{sub.scores?.viva || 0}</td>
                            <td className="p-2 font-bold">{sub.scores?.total || 0}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* SESSION DELETE MODAL */}
          {sessionToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Session History?</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete session <strong>{sessionToDelete}</strong>? <br/>
                  This will remove all student records and exam data for this session.
                </p>
                <div className="flex gap-3 justify-center">
                  <button 
                    onClick={() => setSessionToDelete(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDeleteSession}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard;