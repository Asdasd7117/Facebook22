import { db } from './firebase-config.js';
import {
  getDocs, doc, collection, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const adminUser = "samigmail";
const adminPass = "Asdasd7117";

document.getElementById("loginBtn").onclick = () => {
  const user = document.getElementById("adminUser").value;
  const pass = document.getElementById("adminPass").value;

  if (user === adminUser && pass === adminPass) {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";
    loadUsers();
  } else {
    alert("بيانات الدخول غير صحيحة");
  }
};

async function loadUsers() {
  const list = document.getElementById("userList");
  list.innerHTML = "";
  const usersSnap = await getDocs(collection(db, "users"));

  usersSnap.forEach(snap => {
    const data = snap.data();
    const uid = snap.id;
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${data.email || "بلا بريد"}</strong> | نقاط: ${data.points || 0}<br/>
      <button onclick="givePoints('${uid}', ${data.points || 0})">➕ أضف نقطة</button>
      <button onclick="removePage('${uid}')">❌ حذف صفحته</button>
      <button onclick="removeUser('${uid}')">🗑️ حذف المستخدم</button>
      <hr/>
    `;
    list.appendChild(li);
  });
}

window.givePoints = async (uid, current) => {
  await updateDoc(doc(db, "users", uid), { points: current + 1 });
  alert("تمت إضافة نقطة.");
  loadUsers();
};

window.removePage = async (uid) => {
  await updateDoc(doc(db, "users", uid), { facebookPage: "" });
  alert("تم حذف رابط صفحة المستخدم.");
  loadUsers();
};

window.removeUser = async (uid) => {
  if (confirm("هل أنت متأكد أنك تريد حذف هذا المستخدم؟")) {
    await deleteDoc(doc(db, "users", uid));
    alert("تم حذف المستخدم.");
    loadUsers();
  }
};
