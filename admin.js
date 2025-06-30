import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import {
  getDocs, collection, doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const ADMIN_EMAIL = "ag7002011@gmail.com"; // غيّره لبريدك

onAuthStateChanged(auth, async user => {
  if (!user || user.email !== ADMIN_EMAIL) {
    document.body.innerHTML = "<h2 style='color:red'>غير مصرح لك بالدخول.</h2>";
    return;
  }

  const userList = document.getElementById("userList");
  const snapshot = await getDocs(collection(db, "users"));
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const li = document.createElement("li");
    li.innerHTML = `
      <p><strong>${data.email}</strong> - ${data.points} نقاط</p>
      <button onclick="addPoints('${docSnap.id}')">+10 نقاط</button>
      <button onclick="removeUser('${docSnap.id}')">🗑 حذف المستخدم</button>
      <button onclick="removePage('${docSnap.id}')">❌ إزالة الصفحة</button>
    `;
    userList.appendChild(li);
  });

  window.addPoints = async (uid) => {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { points: 10 });
    alert("تمت إضافة النقاط.");
    location.reload();
  };

  window.removeUser = async (uid) => {
    await deleteDoc(doc(db, "users", uid));
    alert("تم حذف المستخدم.");
    location.reload();
  };

  window.removePage = async (uid) => {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { facebookPage: "" });
    alert("تم إزالة الصفحة.");
    location.reload();
  };
});
