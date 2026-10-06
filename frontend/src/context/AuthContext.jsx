import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../api/firebase'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid)
          const userSnap = await getDoc(userDocRef)
          
          if (userSnap.exists()) {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...userSnap.data()
            })
          } else {
            // Default profile fallback
            const defaultProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.email.split('@')[0],
              role: 'pharmacist'
            }
            setUser(defaultProfile)
          }
        } catch (err) {
          console.error('Error fetching user profile from Firestore:', err)
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: 'pharmacist'
          })
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email, password) => {
    const res = await signInWithEmailAndPassword(auth, email, password)
    const userDocRef = doc(db, 'users', res.user.uid)
    const userSnap = await getDoc(userDocRef)
    const userData = userSnap.exists() 
      ? { uid: res.user.uid, email: res.user.email, ...userSnap.data() }
      : { uid: res.user.uid, email: res.user.email, role: 'pharmacist' }
    
    setUser(userData)
    return userData
  }

  const register = async ({ email, password, role = 'pharmacist', name = '', vendor_id = '' }) => {
    const res = await createUserWithEmailAndPassword(auth, email, password)
    const userData = {
      uid: res.user.uid,
      email,
      name: name || email.split('@')[0],
      role: role.toLowerCase(),
      vendor_id,
      created_at: new Date().toISOString()
    }
    
    // Save User Role & Profile to Firestore
    await setDoc(doc(db, 'users', res.user.uid), userData)
    setUser(userData)
    return userData
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
