import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import {
  getDoc, updateDoc, getDocs, doc, collection, arrayUnion, deleteField
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

let currentUser = null;
let userRef = null;
let userData = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "index.html";
  currentUser = user;
  document.getElementById("userEmail").innerText = user.email;

  userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  userData = userSnap.data();
  document.getElementById("points").innerText = userData.points || 0;

  if (userData.facebookPage) {
    const myPageInfo = document.createElement("div");
    myPageInfo.innerHTML = `
      <p>رابط صفحتك الحالي: <a href="${userData.facebookPage}" target="_blank">${userData.facebookPage}</a></p>
      <button id="deletePageBtn">🗑️ حذف الصفحة</button>
    `;
    document.getElementById("myPage").appendChild(myPageInfo);

    document.getElementById("deletePageBtn").onclick = async () => {
      await updateDoc(userRef, {
        facebookPage: deleteField()
      });
      alert("تم حذف صفحتك.");
      location.reload();
    };
  }

  document.getElementById("savePageBtn").onclick = async () => {
    const pageURL = document.getElementById("pageInput").value;
    if (pageURL.length < 10) return alert("الرابط غير صالح");
    await updateDoc(userRef, { facebookPage: pageURL });
    alert("تم حفظ الرابط.");
    location.reload();
  };

  loadOtherPages();
});

async function loadOtherPages() {
  const pagesList = document.getElementById("pagesList");
  pagesList.innerHTML = "";

  const usersSnap = await getDocs(collection(db, "users"));
  usersSnap.forEach(docSnap => {
    const other = docSnap.data();
    const otherId = docSnap.id;

    const alreadyFollowed = (userData.followers || []).includes(otherId);
    const canShow = (
      otherId !== currentUser.uid &&
      other.facebookPage &&
      !alreadyFollowed &&
      (other.points || 0) > 0
    );

    if (canShow) {
      const li = document.createElement("li");
      const pageId = `fb_${otherId}`;
      const emailDisplay = other.email ? other.email : "مستخدم";
      li.innerHTML = `
        <a href="${other.facebookPage}" target="_blank">🔗 ${emailDisplay}</a>
        <button onclick="openFacebookPage('${other.facebookPage}', '${pageId}')">افتح الصفحة</button>
        <button id="${pageId}" onclick="confirmFollow('${otherId}', this)" disabled>أنا تابعت الصفحة</button>
      `;
      pagesList.appendChild(li);
    }
  });
}

window.openFacebookPage = (url, buttonId) => {
  window.open(url, '_blank');
  const btn = document.getElementById(buttonId);
  if (btn) {
    btn.disabled = false;
    btn.style.background = "#4CAF50";
  }
};

window.confirmFollow = async (targetId, button) => {
  if (!confirm("هل تأكدت أنك تابعت الصفحة فعليًا؟")) return;

  const targetRef = doc(db, "users", targetId);
  const targetSnap = await getDoc(targetRef);
  const targetData = targetSnap.data();

  if ((targetData.points || 0) < 1) {
    alert("صاحب هذه الصفحة لا يملك نقاط كافية.");
    return;
  }

  await updateDoc(userRef, {
    points: (userData.points || 0) + 1,
    followers: arrayUnion(targetId)
  });

  await updateDoc(targetRef, {
    points: targetData.points - 1
  });

  // حذف الصفحة من واجهة المستخدم
  button.parentElement.remove();

  alert("تمت المتابعة. أضيفت نقطة لرصيدك.");
};
