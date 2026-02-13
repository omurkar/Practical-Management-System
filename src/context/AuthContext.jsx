import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  signInWithPopup,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    // Set persistence to session storage so each tab has independent auth state
    setPersistence(auth, browserSessionPersistence).then(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setCurrentUser(user);
          // Check user role from Firestore
          try {
            const userDoc = await getDoc(doc(db, 'teachers', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUserRole(userData.role || 'teacher');
            } else {
              // Check if admin (Google OAuth only)
              setUserRole('admin');
            }
          } catch (error) {
            console.error('Error fetching user role:', error);
            setUserRole(null);
          }
        } else {
          setCurrentUser(null);
          setUserRole(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    }).catch((error) => {
      console.error('Error setting auth persistence:', error);
      setLoading(false);
    });
  }, []);

  // Teacher login with email/password
  const teacherLogin = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'teachers', userCredential.user.uid));
    if (!userDoc.exists()) {
      throw new Error('Teacher account not found');
    }
    return userCredential.user;
  };

  // Admin login with Google OAuth
  const adminLogin = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    // Admin role is determined by absence in teachers collection
    return result.user;
  };

  // Student login (whitelist - no Firebase Auth)
  const studentLogin = async (rollNo, name, sessionCode) => {
    // This will be handled differently - database lookup only
    // Return a mock user object for student
    return {
      uid: `${sessionCode}_${rollNo}`,
      rollNo,
      name,
      sessionCode,
      role: 'student'
    };
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserRole(null);
  };

  const value = {
    currentUser,
    userRole,
    teacherLogin,
    adminLogin,
    studentLogin,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

