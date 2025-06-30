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
    alert("ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¯ط®ظˆظ„ ط؛ظٹط± طµط­ظٹط­ط©");
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
      <strong>${data.email || "ط¨ظ„ط§ ط¨ط±ظٹط¯"}</strong> | ظ†ظ‚ط§ط·: ${data.points || 0}<br/>
      <button onclick="givePoints('${uid}', ${data.points || 0})">â‍• ط£ط¶ظپ ظ†ظ‚ط·ط©</button>
      <button onclick="removePage('${uid}')">â‌Œ ط­ط°ظپ طµظپط­طھظ‡</button>
      <button onclick="removeUser('${uid}')">ًں—‘ï¸ڈ ط­ط°ظپ ط§ظ„ظ…ط³طھط®ط¯ظ…</button>
      <hr/>
    `;
    list.appendChild(li);
  });
}

window.givePoints = async (uid, current) => {
  await updateDoc(doc(db, "users", uid), { points: current + 1 });
  alert("طھظ…طھ ط¥ط¶ط§ظپط© ظ†ظ‚ط·ط©.");
  loadUsers();
};

window.removePage = async (uid) => {
  await updateDoc(doc(db, "users", uid), { facebookPage: "" });
  alert("طھظ… ط­ط°ظپ ط±ط§ط¨ط· طµظپط­ط© ط§ظ„ظ…ط³طھط®ط¯ظ….");
  loadUsers();
};

window.removeUser = async (uid) => {
  if (confirm("ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ط£ظ†ظƒ طھط±ظٹط¯ ط­ط°ظپ ظ‡ط°ط§ ط§ظ„ظ…ط³طھط®ط¯ظ…طں")) {
    await deleteDoc(doc(db, "users", uid));
    alert("طھظ… ط­ط°ظپ ط§ظ„ظ…ط³طھط®ط¯ظ….");
    loadUsers();
  }
};
