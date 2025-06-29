import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import {
  getDoc, setDoc, getDocs, updateDoc, doc, collection
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "index.html";
  document.getElementById("userEmail").innerText = user.email;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const data = userSnap.data();
  document.getElementById("points").innerText = data.points;

  // حفظ رابط الصفحة
  document.getElementById("savePageBtn").onclick = async () => {
    const pageURL = document.getElementById("pageInput").value;
    await updateDoc(userRef, { facebookPage: pageURL });
    alert("تم حفظ الرابط.");
  };

  // عرض صفحات الآخرين
  const pagesList = document.getElementById("pagesList");
  const usersSnap = await getDocs(collection(db, "users"));
  usersSnap.forEach(docSnap => {
    const other = docSnap.data();
    if (docSnap.id !== user.uid && other.facebookPage) {
      const li = document.createElement("li");
      li.innerHTML = `
        <a href="${other.facebookPage}" target="_blank">${other.email}</a>
        <button onclick="follow('${docSnap.id}')">متابعة</button>
      `;
      pagesList.appendChild(li);
    }
  });

  window.follow = async (targetId) => {
    const targetRef = doc(db, "users", targetId);
    const targetSnap = await getDoc(targetRef);
    const targetData = targetSnap.data();

    // خصم نقطة منك
    await updateDoc(userRef, { points: data.points - 1 });
    // إضافة نقطة له
    await updateDoc(targetRef, { points: targetData.points + 1 });

    alert("تمت المتابعة. حصلت على نقطة!");
    location.reload();
  };
});
