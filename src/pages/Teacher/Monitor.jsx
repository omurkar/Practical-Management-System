import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; 
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, writeBatch, deleteField } from 'firebase/firestore';
import { ref, deleteObject, listAll, getDownloadURL } from 'firebase/storage'; 
import { db, storage } from '../../firebase'; 
import Navbar from '../../components/Navbar';
import ProtectedRoute from '../../components/ProtectedRoute';
import StatusBadge from '../../components/StatusBadge'; 
import * as XLSX from 'xlsx';
import JSZip from 'jszip'; 
import { saveAs } from 'file-saver'; 

const Monitor = () => {
  const [searchParams] = useSearchParams();
  const sessionCode = searchParams.get('session') || '';
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [vivaMarks, setVivaMarks] = useState('');
  const [journalMarks, setJournalMarks] = useState('');
  const [questionScores, setQuestionScores] = useState({}); 

  const [examDetails, setExamDetails] = useState(null);
  const [questionBank, setQuestionBank] = useState([]); 
  const [isChangingSlip, setIsChangingSlip] = useState(false); 
  const [generatedSlips, setGeneratedSlips] = useState([]); 
  
  const [isEndSessionModalOpen, setIsEndSessionModalOpen] = useState(false);
  const [endSessionStep, setEndSessionStep] = useState(1); 
  const [selectedStudentIds, setSelectedStudentIds] = useState([]); 
  const [isEnding, setIsEnding] = useState(false);

  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isTimeUpModalOpen, setIsTimeUpModalOpen] = useState(false);
  const [hasTimeAlertShown, setHasTimeAlertShown] = useState(false);
  const [isDownloadingFiles, setIsDownloadingFiles] = useState(false);
  
  // --- NEW: Zoom Image State ---
  const [zoomedImage, setZoomedImage] = useState(null);

  useEffect(() => {
    if (!sessionCode) return;

    const examRef = doc(db, 'exams', sessionCode);
    const unsubscribeExam = onSnapshot(examRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setExamDetails(data);

        if (data.is_active && data.started_at && data.duration_minutes) {
          const startTime = data.started_at.toDate();
          const endTime = new Date(startTime.getTime() + data.duration_minutes * 60000);
          
          const timerInterval = setInterval(() => {
            const now = new Date();
            const diff = endTime - now;
            setTimeRemaining(diff);

            if (diff <= 0 && diff > -1000 && !hasTimeAlertShown) {
              setHasTimeAlertShown(true);
              setIsTimeUpModalOpen(true);
            }
          }, 1000);

          return () => clearInterval(timerInterval);
        }
      }
    });

    const fetchQuestionBank = async () => {
      try {
        const qBankQuery = query(collection(db, 'questions'), where('session_code', '==', sessionCode));
        const qBankSnap = await getDocs(qBankQuery);
        const questions = [];
        qBankSnap.forEach(doc => questions.push({ id: doc.id, ...doc.data() }));
        setQuestionBank(questions);
      } catch (error) { console.error(error); }
    };
    fetchQuestionBank();

    const q = query(collection(db, 'students'), where('session_code', '==', sessionCode));
    const unsubscribeStudents = onSnapshot(q, (snapshot) => {
      const studentsList = [];
      snapshot.forEach((doc) => { studentsList.push({ id: doc.id, ...doc.data() }); });
      setStudents(studentsList.sort((a, b) => 
        (a.roll_no || '').localeCompare(b.roll_no || '', undefined, { numeric: true })
      ));
    });

    return () => {
      unsubscribeExam();
      unsubscribeStudents();
    };
  }, [sessionCode, hasTimeAlertShown]);

  const formatTime = (ms) => {
    if (ms === null) return "--:--:--";
    const isNegative = ms < 0;
    const absMs = Math.abs(ms);
    const seconds = Math.floor((absMs / 1000) % 60);
    const minutes = Math.floor((absMs / (1000 * 60)) % 60);
    const hours = Math.floor((absMs / (1000 * 60 * 60)));
    return `${isNegative ? '-' : ''}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleContinueOvertime = () => { setIsTimeUpModalOpen(false); };

  const handleNextStudent = () => {
    if (!selectedStudent) return;
    const currentIndex = students.findIndex(s => s.id === selectedStudent.id);
    if (currentIndex < students.length - 1) {
      openStudentView(students[currentIndex + 1]);
    } else {
      alert("End of student list.");
    }
  };

  const handlePrevStudent = () => {
    if (!selectedStudent) return;
    const currentIndex = students.findIndex(s => s.id === selectedStudent.id);
    if (currentIndex > 0) {
      openStudentView(students[currentIndex - 1]);
    }
  };

  const openStudentView = (student) => {
    setSelectedStudent(student);
    setVivaMarks(student.scores?.viva || '');
    setJournalMarks(student.scores?.journal || '');
    
    const loadedScores = {};
    student.assigned_questions?.forEach((_, index) => {
      const key = `q${index + 1}`;
      loadedScores[key] = student.answers?.[key]?.score || '';
    });
    setQuestionScores(loadedScores);
    setIsChangingSlip(false);
  };

  const handleQuestionScoreChange = (key, value, maxMarks) => {
    const val = parseInt(value) || 0;
    if (val > maxMarks) { alert(`Marks cannot exceed max marks of ${maxMarks}`); return; }
    setQuestionScores(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveAllGrades = async () => {
    try {
      const viva = parseInt(vivaMarks || 0);
      const journal = parseInt(journalMarks || 0);
      let totalPractical = 0;
      const updatedAnswers = { ...selectedStudent.answers };

      if (canGradePractical) {
          selectedStudent.assigned_questions.forEach((_, index) => {
            const key = `q${index + 1}`;
            const score = parseInt(questionScores[key] || 0);
            totalPractical += score;
            if (!updatedAnswers[key]) updatedAnswers[key] = {};
            updatedAnswers[key] = { ...updatedAnswers[key], score: score };
          });
      } else {
          totalPractical = selectedStudent.scores?.practical || 0;
      }

      if (examDetails?.viva_marks !== undefined && viva > examDetails.viva_marks) { alert(`Viva marks cannot exceed ${examDetails.viva_marks}.`); return; }
      if (examDetails?.journal_marks !== undefined && journal > examDetails.journal_marks) { alert(`Journal marks cannot exceed ${examDetails.journal_marks}.`); return; }

      const grandTotal = totalPractical + viva + journal;

      await updateDoc(doc(db, 'students', selectedStudent.id), {
        answers: updatedAnswers,
        'scores.practical': totalPractical,
        'scores.viva': viva,
        'scores.journal': journal,
        'scores.total': grandTotal,
        is_graded: true 
      });
      alert(`Grades Saved! Total: ${grandTotal}`);
    } catch (error) { alert("Error saving grades: " + error.message); }
  };

  const handleApprove = async (studentId) => { try { await updateDoc(doc(db, 'students', studentId), { status: 'approved' }); setSelectedStudent(null); } catch (error) { alert(error.message); } };
  const handleReject = async (studentId) => { if(!window.confirm("Reject submission? Student will be able to edit.")) return; try { await updateDoc(doc(db, 'students', studentId), { status: 'in_progress' }); alert("Submission Rejected."); setSelectedStudent(null); } catch (error) { alert(error.message); } };
  const handleResumeSession = async (studentId) => { if (!window.confirm("Undo 'End Session'?")) return; try { await updateDoc(doc(db, 'students', studentId), { session_ended: false }); alert("Session Resumed."); setSelectedStudent(null); } catch (error) { alert(error.message); } };

  // --- LOGIC FIX: Absent students NOT forced to score 0 in DB ---
  const handleEndForAll = async () => {
    if (!window.confirm("🔴 DANGER: Stop exam for ALL students?")) return;
    setIsEnding(true);
    try {
      const batch = writeBatch(db);
      const examRef = doc(db, 'exams', sessionCode);
      batch.update(examRef, { is_active: false });
      let absentsMarked = 0;
      students.forEach(student => {
        const sRef = doc(db, 'students', student.id);
        if (student.status === 'registered') {
          // Just mark status, preserve score field integrity
          batch.update(sRef, { status: 'absent' }); 
          absentsMarked++;
        } else if (student.status === 'in_progress') {
            batch.update(sRef, { status: 'submitted' });
        }
      });
      await batch.commit();
      alert(`Session Ended Globally.\n${absentsMarked} students marked as ABSENT.`);
      setIsEndSessionModalOpen(false);
      setIsTimeUpModalOpen(false);
    } catch (error) { alert("Failed: " + error.message); } finally { setIsEnding(false); }
  };

  const handleEndForSpecific = async () => {
    if (selectedStudentIds.length === 0) return;
    if (!window.confirm(`End session for ${selectedStudentIds.length} students?`)) return;
    setIsEnding(true);
    try {
        const batch = writeBatch(db);
        selectedStudentIds.forEach(id => { const sRef = doc(db, 'students', id); batch.update(sRef, { session_ended: true }); });
        await batch.commit();
        alert("Session ended for selected students.");
        setSelectedStudentIds([]);
        setEndSessionStep(1);
        setIsEndSessionModalOpen(false);
    } catch (error) { alert("Failed: " + error.message); } finally { setIsEnding(false); }
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
        const activeIds = students.filter(s => s.status === 'in_progress' || s.status === 'registered').map(s => s.id);
        setSelectedStudentIds(activeIds);
    } else { setSelectedStudentIds([]); }
  };

  const toggleStudentSelection = (id) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
  };

  // --- LOGIC FIX: Export ABSENT string ---
  const handleExportAttendance = () => {
    if (students.length === 0) return;
    const attendanceData = students.map((student, index) => ({
      'Serial No': index + 1,
      'Roll Number': student.roll_no,
      'Full Name': student.name,
      'Attendance': (student.status === 'absent' || student.status === 'registered') ? 'Absent' : 'Present'
    }));
    const worksheet = XLSX.utils.json_to_sheet(attendanceData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `${sessionCode}_Attendance.xlsx`);
  };

  // --- LOGIC FIX: Export ABSENT in result sheet instead of 0 ---
  const handleExportResults = () => {
    if (students.length === 0) return;
    const dateObj = examDetails?.created_at?.toDate ? examDetails.created_at.toDate() : new Date();
    const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    const dept = (examDetails?.student_department || 'Unknown').toUpperCase();
    const subject = (examDetails?.subject_name || 'Unknown').toUpperCase();
    const year = (examDetails?.student_year || 'Unknown').toUpperCase();

    const dataRows = students.map((student, index) => {
      const isAbsent = student.status === 'absent' || student.status === 'registered';
      return [
        index + 1,
        student.roll_no,
        student.name,
        isAbsent ? 'ABSENT' : (student.scores?.practical || 0),
        isAbsent ? '-' : (student.scores?.viva || 0),
        isAbsent ? '-' : (student.scores?.journal || 0),
        isAbsent ? 'ABSENT' : (student.scores?.total || 0)
      ];
    });

    const worksheetData = [ [`DATE : ${dateStr}`], [`DEPARTMENT: ${dept}    SUBJECT: ${subject}    YEAR: ${year}`], [], ['Serial Number', 'Roll Number', 'Full Name', 'Practical', 'Viva', 'Journal', 'Total'], ...dataRows ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(workbook, `${sessionCode}_Results.xlsx`);
  };

  const canChangeSlip = examDetails?.is_active && selectedStudent?.status !== 'submitted';
  const isSessionActive = examDetails?.is_active;
  const canGradePractical = !isSessionActive || selectedStudent?.status === 'submitted';
  const allGraded = students.length > 0 && students.every(s => s.is_graded || s.status === 'absent');
  const activeStudentsList = students.filter(s => s.status !== 'submitted' && s.status !== 'approved' && s.status !== 'absent');

  const generateAllValidSlips = (targetMarks) => {
    if (!targetMarks || questionBank.length === 0) return [];
    const validCombos = [];
    const findCombos = (startIdx, currentCombo, currentSum) => {
      if (currentSum === targetMarks) { validCombos.push([...currentCombo]); return; }
      if (currentSum > targetMarks) return;
      for (let i = startIdx; i < questionBank.length; i++) {
        const q = questionBank[i];
        currentCombo.push(q);
        findCombos(i + 1, currentCombo, currentSum + q.marks);
        currentCombo.pop(); 
      }
    };
    findCombos(0, [], 0);
    return validCombos;
  };

  const handleOpenSlipChange = () => {
    if (!examDetails?.practical_marks) { alert("Error: Practical marks not defined."); return; }
    const slips = generateAllValidSlips(examDetails.practical_marks);
    setGeneratedSlips(slips);
    setIsChangingSlip(true);
  };

  const handleAssignSlip = async (newQuestions) => {
    try {
      await updateDoc(doc(db, 'students', selectedStudent.id), {
        assigned_questions: newQuestions.map(q => ({ question_id: q.question_id, topic: q.topic, marks: q.marks, image: q.image||"" })),
        is_slip_changed: true, 
      });
      alert("Slip changed!");
      setIsChangingSlip(false);
      setSelectedStudent(null); 
    } catch (error) { alert(error.message); }
  };

  const handleDownloadSessionFiles = async () => {
    if (!window.confirm("⚠️ Download and DELETE all session files?")) return;
    setIsDownloadingFiles(true);
    const zip = new JSZip();
    const batch = writeBatch(db);
    const deletePromises = [];
    let filesFoundCount = 0;

    try {
        const sessionFolderRef = ref(storage, `exam_uploads/${sessionCode}`);
        const studentListResult = await listAll(sessionFolderRef);
        for (const studentFolderRef of studentListResult.prefixes) {
            const fileListResult = await listAll(studentFolderRef);
            for (const fileRef of fileListResult.items) {
                try {
                    filesFoundCount++;
                    const url = await getDownloadURL(fileRef);
                    const response = await fetch(url);
                    if (!response.ok) throw new Error("Fetch failed");
                    const blob = await response.blob();
                    zip.file(fileRef.name, blob);
                    deletePromises.push(deleteObject(fileRef));
                } catch (err) { console.error(err); }
            }
        }
        if (filesFoundCount === 0) { alert("No files found."); setIsDownloadingFiles(false); return; }
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${sessionCode}_Files.zip`);
        students.forEach(student => {
            if (student.answers) {
                const sRef = doc(db, 'students', student.id);
                const updateData = {};
                let needsUpdate = false;
                Object.keys(student.answers).forEach(key => {
                    if (student.answers[key].file_uploaded) {
                        updateData[`answers.${key}.file_uploaded`] = false;
                        updateData[`answers.${key}.file_url`] = deleteField();
                        updateData[`answers.${key}.file_name`] = deleteField();
                        updateData[`answers.${key}.storage_ref`] = deleteField();
                        needsUpdate = true;
                    }
                });
                if (needsUpdate) batch.update(sRef, updateData);
            }
        });
        await Promise.all(deletePromises);
        await batch.commit();
        alert("Success! Files downloaded and deleted.");
    } catch (error) { alert("Error: " + error.message); } 
    finally { setIsDownloadingFiles(false); }
  };

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className='flex items-center gap-4'>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Live Monitor - {sessionCode}</h1>
                {!isSessionActive && <span className="bg-red-100 text-red-800 text-sm font-bold px-2 py-1 rounded border border-red-200 mt-2 inline-block">🔴 Session Ended</span>}
              </div>
              {isSessionActive && timeRemaining !== null && (
                <div className={`text-2xl font-mono font-bold px-4 py-2 rounded-lg border-2 ${timeRemaining < 0 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-gray-800 text-green-400 border-gray-700'}`}>
                   ⏳ {formatTime(timeRemaining)}
                   {timeRemaining < 0 && <span className="text-xs block text-center font-sans">Overtime</span>}
                </div>
              )}
            </div>
            <div className="flex gap-3">
                {!isSessionActive && (
                  <>
                    <button onClick={handleExportAttendance} className="bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200 px-4 py-2 rounded-lg transition font-bold">📋 Attendance</button>
                    <button onClick={handleDownloadSessionFiles} disabled={isDownloadingFiles} className={`bg-blue-600 text-white border border-blue-700 hover:bg-blue-700 px-4 py-2 rounded-lg transition font-bold shadow-sm ${isDownloadingFiles ? 'opacity-50' : ''}`}>
                        {isDownloadingFiles ? '⏳ Downloading...' : '📥 Download Session Files'}
                    </button>
                    <button onClick={handleExportResults} disabled={!allGraded} className={`px-4 py-2 rounded-lg font-bold ${allGraded ? "bg-green-600 text-white" : "bg-gray-300 text-gray-500"}`}>🏆 Results</button>
                  </>
                )}
                {isSessionActive && <button onClick={() => { setEndSessionStep(1); setIsEndSessionModalOpen(true); }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm">🛑 Stop Session</button>}
            </div>
          </div>
          
          {/* --- STATUS LEGEND (UPDATED) --- */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Status Legend</h2>
            <div className="flex flex-wrap gap-4 items-center text-sm font-medium">
              <div className="flex items-center gap-2 px-3 py-2 rounded border bg-red-100 text-red-900 border-red-500">🔴 ABSENT</div>
              <div className="flex items-center gap-2 px-3 py-2 rounded border bg-white text-green-700 border-green-300">⚪ PRESENT / JOINED</div>
              <div className="flex items-center gap-2 px-3 py-2 rounded bg-yellow-100 text-yellow-900 border border-yellow-300">🟡 APPROVAL REQ</div>
              <div className="flex items-center gap-2 px-3 py-2 rounded bg-green-100 text-green-900 border border-green-500">🟢 SUBMITTED</div>
              <div className="flex items-center gap-2 px-3 py-2 rounded bg-white text-blue-900 border-2 border-blue-600">✅ GRADED</div>
              <div className="flex items-center gap-2 px-3 py-2 rounded bg-gray-50 text-gray-500 border border-gray-200">⚪ NOT JOINED</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            {students.length === 0 ? <p className="text-center text-gray-500">No students found.</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {students.map((student) => {
                  
                  // --- NEW LOGIC HIERARCHY IN OLD UI STRUCTURE ---
                  let boxClass = 'border-gray-300 bg-white'; 
                  let textColor = 'text-gray-800';
                  let statusText = 'NOT JOINED';
                  let showScore = false;

                  // 1. ABSENT (Priority 1)
                  if (student.status === 'absent') {
                      boxClass = 'border-red-500 bg-red-50';
                      textColor = 'text-red-900';
                      statusText = 'ABSENT';
                  } 
                  // 2. GRADED
                  else if (student.is_graded) {
                      boxClass = 'border-blue-600 border-2 bg-white'; // Tick mark style requested
                      textColor = 'text-blue-900';
                      statusText = `GRADED`;
                      showScore = true;
                  }
                  // 3. SUBMITTED
                  else if (student.status === 'submitted') {
                      boxClass = 'border-green-600 bg-green-100';
                      textColor = 'text-green-900';
                      statusText = 'SUBMITTED';
                  }
                  // 4. APPROVAL
                  else if (student.status === 'approval_requested') {
                      boxClass = 'border-yellow-400 bg-yellow-100';
                      textColor = 'text-yellow-900';
                      statusText = 'APPROVAL REQ';
                  }
                  // 5. PRESENT (JOINED)
                  else if (student.status === 'in_progress') {
                      boxClass = 'border-green-300 bg-white'; 
                      textColor = 'text-green-800';
                      statusText = 'PRESENT';
                  }
                  
                  return (
                    <div key={student.id} className={`border-2 rounded-lg p-4 cursor-pointer transition ${boxClass} hover:shadow-lg relative overflow-hidden`} onClick={() => openStudentView(student)}>
                      {/* Top Right Badge (Old UI Style) */}
                      <div className="absolute top-0 right-0 flex flex-col items-end">
                          {showScore && <div className="text-white text-xs font-bold px-2 py-1 rounded-bl bg-blue-600">Score: {student.scores?.total || 0}</div>}
                          {student.session_ended && <div className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-bl shadow-sm border-t border-gray-600">ENDED</div>}
                      </div>
                      
                      <div className={`font-bold text-lg ${textColor}`}>{student.name}</div>
                      <div className={`text-sm mb-3 ${textColor}`}>Roll: {student.roll_no}</div>
                      <div className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${boxClass.includes('bg-white') ? 'bg-gray-100 border-gray-200' : 'bg-white bg-opacity-50 border-transparent'}`}>
                        {statusText}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedStudent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6 border-b pb-4">
                    <div>
                      <h2 className="text-2xl font-bold">{selectedStudent.name} ({selectedStudent.roll_no})</h2>
                      <div className="mt-2 flex gap-2">
                        <StatusBadge status={selectedStudent.status} />
                        {selectedStudent.is_slip_changed && <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded border border-orange-200">⚠️ Slip Has Been Changed</span>}
                        {selectedStudent.is_graded && <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded border border-green-200">🎓 Graded</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {selectedStudent.session_ended && (
                          <button onClick={() => handleResumeSession(selectedStudent.id)} className="bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200 px-3 py-1 rounded text-sm font-bold transition flex items-center gap-1">↩️ Undo End Session</button>
                      )}
                      {canChangeSlip && !isChangingSlip && <button onClick={handleOpenSlipChange} className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-sm font-medium transition">🔄 Change Slip</button>}
                      <button onClick={() => setSelectedStudent(null)} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">×</button>
                    </div>
                  </div>

                  {isChangingSlip ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="mb-4 bg-white border border-yellow-200 rounded-lg p-4 shadow-sm">
                            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 border-b pb-2">Current Slip</h4>
                            {selectedStudent.assigned_questions?.length > 0 ? (
                                <div className="space-y-2">
                                    {selectedStudent.assigned_questions.map(q => (
                                        <div key={q.question_id} className="text-sm bg-yellow-50 text-gray-800 px-3 py-2 rounded border border-yellow-200">
                                            <span className="font-semibold block mb-1">{q.topic}</span>
                                            <span className="text-xs text-gray-500 font-mono bg-white px-1 rounded border">Q{q.question_id}</span>
                                            <span className="text-xs text-gray-500 ml-2">({q.marks} marks)</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (<p className="text-sm text-gray-500 italic">No questions assigned.</p>)}
                        </div>
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-bold text-blue-800">Available Combinations</h3>
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Target Marks: {examDetails?.practical_marks}</span>
                        </div>
                        <div className="max-h-80 overflow-y-auto bg-white border rounded p-2 mb-4 space-y-2">
                            {generatedSlips.map((slip, i) => {
                                const isCurrent = JSON.stringify(slip.map(q=>q.question_id).sort()) === JSON.stringify(selectedStudent.assigned_questions?.map(q=>q.question_id).sort());
                                if (isCurrent) return null;
                                return (
                                    <div key={i} className="flex justify-between items-start p-3 border rounded hover:bg-gray-50 transition group">
                                            <div className="flex-1 pr-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="font-bold text-blue-700 text-xs uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">Option {i+1}</span>
                                                </div>
                                                <ul className="list-disc list-inside space-y-1">
                                                    {slip.map(q => (
                                                        <li key={q.question_id} className="text-sm text-gray-700 leading-snug">
                                                            {q.topic} <span className="text-xs text-gray-400">({q.marks}m)</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <button onClick={()=>handleAssignSlip(slip)} className="self-center bg-white border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded text-sm font-bold transition whitespace-nowrap">Assign</button>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-end">
                            <button onClick={()=>setIsChangingSlip(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Cancel</button>
                        </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 text-lg">Student Progress & Evaluation</h3>
                        <div className="flex gap-2">
                            <button onClick={handlePrevStudent} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition">← Prev</button>
                            <button onClick={handleNextStudent} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition">Next →</button>
                        </div>
                      </div>
                      
                      {selectedStudent.assigned_questions?.map((question, index) => {
                        const answerKey = `q${index + 1}`;
                        const answer = selectedStudent.answers?.[answerKey];
                        const score = questionScores[answerKey] || '';

                        return (
                          <div key={index} className="border-2 border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
                              <span className="font-bold text-gray-700">Question {index + 1}</span>
                              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">Max Marks: {question.marks}</span>
                            </div>
                            
                            <div className="p-4 space-y-4">
                              <div className="text-gray-800 font-medium">{question.topic}</div>

                              {/* 🌟 QUESTION IMAGE (Added inside old UI structure) */}
                              {question.image && (
                                <div className="mb-4">
                                    <div className="text-xs text-gray-500 mb-1 uppercase font-bold">Diagram:</div>
                                    <img src={question.image} alt="Diagram" className="h-24 object-contain border rounded cursor-pointer hover:opacity-80" onClick={()=>setZoomedImage(question.image)} />
                                </div>
                              )}

                              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                <span className="text-xs font-bold text-gray-500 uppercase">Student Answer Code:</span>
                                <pre className="mt-1 text-sm overflow-x-auto whitespace-pre-wrap font-mono text-gray-800 bg-white p-2 rounded border border-gray-100">
                                  {answer?.code || <span className="text-gray-400 italic">No answer text provided yet.</span>}
                                </pre>
                              </div>

                              <div className="flex items-center gap-4">
                                {answer?.file_url ? (
                                  <a href={answer.file_url} target="_blank" rel="noopener noreferrer" 
                                     className="flex items-center gap-2 bg-blue-100 text-blue-800 border border-blue-300 px-4 py-2 rounded-lg hover:bg-blue-200 transition font-bold shadow-sm">
                                    <span>📄</span> View Uploaded PDF
                                  </a>
                                ) : (
                                  <span className="text-sm text-red-400 italic border border-red-100 bg-red-50 px-3 py-2 rounded">No PDF Uploaded</span>
                                )}
                              </div>

                              {canGradePractical && (
                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-yellow-50 -mx-4 -mb-4 p-4">
                                  <label className="font-bold text-gray-700">Marks for Q{index + 1}:</label>
                                  <input type="number" min="0" max={question.marks} value={score} onChange={(e) => handleQuestionScoreChange(answerKey, e.target.value, question.marks)} className="w-24 border-2 border-yellow-300 rounded-lg px-3 py-2 text-center font-bold text-lg focus:outline-none focus:border-yellow-500" placeholder="0" />
                                  <span className="text-gray-500 text-sm">/ {question.marks}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      <div className="bg-gray-800 text-white p-6 rounded-xl shadow-lg mt-8">
                        <h3 className="font-bold text-xl mb-4 border-b border-gray-600 pb-2">Final Grading Summary</h3>
                        
                        <div className="grid md:grid-cols-3 gap-6 mb-6">
                          <div>
                            <label className="block text-gray-400 text-sm font-bold mb-2">Viva Marks (Max: {examDetails?.viva_marks || 0})</label>
                            <input type="number" value={vivaMarks} onChange={(e) => setVivaMarks(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="0" />
                          </div>
                          <div>
                            <label className="block text-gray-400 text-sm font-bold mb-2">Journal Marks (Max: {examDetails?.journal_marks || 0})</label>
                            <input type="number" value={journalMarks} onChange={(e) => setJournalMarks(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="0" />
                          </div>
                          <div className="bg-gray-700 rounded-lg p-3 flex flex-col justify-center items-center">
                            <span className="text-gray-400 text-xs uppercase">Total Score</span>
                            <span className="text-3xl font-bold text-green-400">
                              {(canGradePractical ? Object.values(questionScores).reduce((a, b) => a + (parseInt(b)||0), 0) : (selectedStudent.scores?.practical || 0)) + (parseInt(vivaMarks)||0) + (parseInt(journalMarks)||0)}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                           {selectedStudent.status === 'approval_requested' ? (
                             <div className="flex gap-4">
                               <button onClick={() => handleReject(selectedStudent.id)} className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-lg font-bold shadow-lg transition flex items-center gap-2">❌ Reject</button>
                               <button onClick={() => handleApprove(selectedStudent.id)} className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-bold shadow-lg transition flex items-center gap-2">✅ Approve</button>
                             </div>
                           ) : <div></div>}
                           <button onClick={handleSaveAllGrades} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition transform hover:scale-105">💾 Save Grades</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {isEndSessionModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden animate-fade-in-up">
                <div className="bg-red-600 text-white px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xl font-bold">End Session Options</h3>
                    <button onClick={() => setIsEndSessionModalOpen(false)} className="text-white hover:text-red-200 font-bold text-lg">✕</button>
                </div>
                {endSessionStep === 1 ? (
                    <div className="p-8 space-y-4">
                        <p className="text-gray-600 mb-4">How would you like to end the exam?</p>
                        <button onClick={handleEndForAll} className="w-full bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-4 transition group">
                            <span className="text-2xl">🌍</span>
                            <div className="text-left">
                                <div className="font-bold text-lg">End for EVERYONE</div>
                                <div className="text-xs text-red-600">Forces submission for all students and closes session.</div>
                            </div>
                        </button>
                        <button onClick={() => setEndSessionStep(2)} className="w-full bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 text-blue-800 p-4 rounded-xl flex items-center gap-4 transition group">
                            <span className="text-2xl">🎯</span>
                            <div className="text-left">
                                <div className="font-bold text-lg">End for SPECIFIC Students</div>
                                <div className="text-xs text-blue-600">Select students to stop. Others continue.</div>
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col h-[500px]">
                        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                            <span className="font-bold text-gray-700">Select Students to Stop:</span>
                            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                <input type="checkbox" onChange={toggleSelectAll} className="w-4 h-4 text-blue-600 rounded" />
                                Select All Active
                            </label>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {activeStudentsList.length === 0 ? (
                                <div className="text-center text-gray-400 py-10">No active students found.</div>
                            ) : (
                                activeStudentsList.map(s => (
                                    <label key={s.id} className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition ${selectedStudentIds.includes(s.id) ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50 border-gray-200'}`}>
                                            <input type="checkbox" checked={selectedStudentIds.includes(s.id)} onChange={() => toggleStudentSelection(s.id)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                                            <div>
                                                <div className="font-bold text-gray-800">{s.roll_no} - {s.name}</div>
                                                <div className="text-xs text-gray-500 uppercase">{s.status.replace('_', ' ')}</div>
                                            </div>
                                    </label>
                                ))
                            )}
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                            <button onClick={() => setEndSessionStep(1)} className="text-gray-500 hover:text-gray-800 font-medium">← Back</button>
                            <button onClick={handleEndForSpecific} disabled={selectedStudentIds.length === 0 || isEnding} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition">
                                {isEnding ? 'Processing...' : `End for Selected (${selectedStudentIds.length})`}
                            </button>
                        </div>
                    </div>
                )}
              </div>
            </div>
          )}

          {isTimeUpModalOpen && (
             <div className="fixed inset-0 bg-red-900 bg-opacity-90 flex items-center justify-center p-4 z-50">
               <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8 text-center border-4 border-red-500">
                 <h2 className="text-3xl font-bold text-red-600 mb-2">⏰ Time is Up!</h2>
                 <div className="flex flex-col gap-3 mt-6">
                   <button onClick={() => { setIsTimeUpModalOpen(false); setEndSessionStep(1); setIsEndSessionModalOpen(true); }} className="w-full bg-red-600 text-white font-bold py-3 rounded-lg shadow-md">🛑 Stop Session Now</button>
                   <button onClick={handleContinueOvertime} className="w-full bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg">Let Students Continue (Overtime)</button>
                 </div>
               </div>
             </div>
          )}

          {/* --- NEW: FULL SCREEN ZOOM MODAL --- */}
          {zoomedImage && (
            <div className="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setZoomedImage(null)}>
                <div className="relative max-w-[90vw] max-h-[90vh]">
                    <button onClick={() => setZoomedImage(null)} className="absolute -top-10 right-0 text-white text-4xl hover:text-gray-300 font-bold leading-none">&times;</button>
                    <img src={zoomedImage} alt="Zoomed Diagram" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl border-2 border-white object-contain" onClick={(e) => e.stopPropagation()} />
                </div>
            </div>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Monitor;