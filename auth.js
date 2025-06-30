import { auth, db } from './firebase-config.js';
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import {
  doc, setDoc, getDoc,
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

window.googleLogin = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user   = result.user;
    const uid    = user.uid;
    const ref    = new URLSearchParams(location.search).get('ref');
    const docRef = doc(db, "users", uid);
    const docSnap= await getDoc(docRef);

    if (!docSnap.exists()) {
      // أول تسجيل: نحفظ referrer إذا موجود
      await setDoc(docRef, {
        email         : user.email,
        points        : 0,
        facebookPage  : "",
        followers     : [],
        followCount   : 0,
        referrer      : ref && ref !== uid ? ref : null,
        referralCredited: false
      });
    }
    location.href = "dashboard.html";
  } catch (err) {
    alert("خطأ أثناء تسجيل الدخول: " + err.message);
  }
};

// إذا كان مسجّل فعلاً نوجهه للداشبورد
onAuthStateChanged(auth, user => {
  if (user && location.pathname.endsWith('index.html')) {
    location.href = "dashboard.html";
  }
});
