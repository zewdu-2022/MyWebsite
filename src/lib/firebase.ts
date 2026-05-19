import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, getDoc, serverTimestamp, collection, getDocs, 
  updateDoc, query, where, deleteDoc, onSnapshot, orderBy, getDocFromServer, limit
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Sync user to Firestore
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    let userData;
    
    if (!userSnap.exists()) {
      userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.email === 'zewdueconomist@gmail.com' ? 'admin' : 'viewer', // Master email gets admin
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, userData);
    } else {
      userData = userSnap.data();
      const updates = {
        displayName: user.displayName,
        photoURL: user.photoURL,
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, updates, { merge: true });
      userData = { ...userData, ...updates };
    }
    
    return { ...user, role: userData.role };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const logout = () => signOut(auth);

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const fetchUserProfile = async (uid: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
  return null;
};

export const fetchAllUsers = async () => {
  try {
    const usersCol = collection(db, 'users');
    const userSnapshot = await getDocs(usersCol);
    return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
    return [];
  }
};

export const updateUserRole = async (uid: string, role: 'admin' | 'editor' | 'viewer') => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { role, updatedAt: serverTimestamp() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
};

export const updateUserProfile = async (uid: string, data: { displayName?: string, photoURL?: string, interests?: string[] }) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { ...data, updatedAt: serverTimestamp() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
};

export const createApiKey = async (userId: string, name: string) => {
  try {
    const keyId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const keyRef = doc(db, 'api_keys', keyId);
    const apiKey = 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    await setDoc(keyRef, {
      id: keyId,
      userId,
      key: apiKey,
      name,
      createdAt: serverTimestamp()
    });
    return { id: keyId, key: apiKey, name };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'api_keys');
  }
};

export const fetchUserApiKeys = async (userId: string) => {
  try {
    const keysRef = collection(db, 'api_keys');
    const q = query(keysRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'api_keys');
    return [];
  }
};

export const deleteApiKey = async (keyId: string) => {
  try {
    const keyRef = doc(db, 'api_keys', keyId);
    await deleteDoc(keyRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `api_keys/${keyId}`);
  }
};

export const subscribeToNotifications = (userId: string, callback: (notifications: any[]) => void) => {
  const q = query(
    collection(db, 'notifications'), 
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(notifications);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'notifications');
  });
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${notificationId}`);
  }
};

export const createNotification = async (notification: { 
  userId: string, 
  title: string, 
  message: string, 
  type: 'info' | 'event' | 'update' | 'alert',
  link?: string 
}) => {
  try {
    const id = Math.random().toString(36).substring(2, 11);
    const notificationRef = doc(db, 'notifications', id);
    await setDoc(notificationRef, {
      id,
      ...notification,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'notifications');
  }
};

export const fetchBlogPosts = async (limitNum: number = 10) => {
  try {
    const q = query(
      collection(db, 'blog_posts'), 
      orderBy('createdAt', 'desc'),
      limit(limitNum)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'blog_posts');
    return [];
  }
};

export const createBlogPost = async (post: { 
  title: string, 
  excerpt: string, 
  content: string, 
  imagePath?: string, 
  authorId: string 
}) => {
  try {
    const id = Math.random().toString(36).substring(2, 11);
    const postRef = doc(db, 'blog_posts', id);
    await setDoc(postRef, {
      id,
      ...post,
      createdAt: serverTimestamp()
    });
    return { id, ...post };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'blog_posts');
  }
};

export const submitContactForm = async (contact: { 
  name: string, 
  email: string, 
  message: string, 
  serviceName?: string 
}) => {
  try {
    const id = Math.random().toString(36).substring(2, 11);
    const contactRef = doc(db, 'contacts', id);
    await setDoc(contactRef, {
      id,
      ...contact,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'contacts');
  }
};

export const subscribeToNewsletter = async (email: string) => {
  try {
    const subRef = doc(db, 'subscribers', email);
    await setDoc(subRef, {
      email,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `subscribers/${email}`);
  }
};

export const submitFeedback = async (feedback: { 
  userId?: string, 
  category: string, 
  message: string 
}) => {
  try {
    const id = Math.random().toString(36).substring(2, 11);
    const feedbackRef = doc(db, 'feedback', id);
    await setDoc(feedbackRef, {
      id,
      ...feedback,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'feedback');
  }
};
