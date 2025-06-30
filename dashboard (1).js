import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import {
  getDoc, updateDoc, getDocs, doc, collection, arrayUnion, deleteField
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-storage.js";

const storage = getStorage();

let currentUser, userRef, userData;

onAuthStateChanged(auth, async user => {
  if (!user) return location.href = "index.html";
  currentUser = user;
  userRef     = doc(db, "users", user.uid);
  userData    = (await getDoc(userRef)).data();

  document.getElementById("userEmail").innerText = user.email;
  document.getElementById("points").innerText    = userData.points || 0;

  // زر الإحالة
  const link = `${location.origin}/index.html?ref=${user.uid}`;
  document.getElementById("refBtn").onclick = () => {
    document.getElementById("refArea").classList.toggle("hidden");
    document.getElementById("refLink").value = link;
  };
  document.getElementById("copyRef").onclick = () => {
    navigator.clipboard.writeText(link);
    alert("تم نسخ رابط الإحالة");
  };

  // صفحة صاحب الحساب
  if (userData.facebookPage) {
    document.getElementById("pageInput").value = userData.facebookPage;
  }

  document.getElementById("savePageBtn").onclick = async () => {
    const url = document.getElementById("pageInput").value.trim();
    if (!url.startsWith('http')) return alert("رابط غير صالح");
    await updateDoc(userRef, { facebookPage: url });
    alert("تم الحفظ");
    location.reload();
  };

  loadOtherPages();
  checkReferralReward();
});

async function loadOtherPages() {
  const list = document.getElementById("pagesList");
  list.innerHTML = "";
  const snap = await getDocs(collection(db, "users"));
  snap.forEach(docSnap => {
    const o = docSnap.data(), id = docSnap.id;
    if (id === currentUser.uid || !o.facebookPage || (o.points || 0) < 1) return;
    if ((userData.followers || []).includes(id)) return;

    const li     = document.createElement("li");
    const pageId = `btn_${id}`, timerId = `t_${id}`;
    li.innerHTML = `
      <a href="${o.facebookPage}" target="_blank">🔗 ${o.email}</a>
      <button onclick="openPage('${o.facebookPage}','${pageId}','${timerId}')">افتح الصفحة</button>
      <span id="${timerId}">⏳ 10</span>
      <button id="${pageId}" onclick="uploadScreenshotPrompt('${id}', this)" disabled>تابعت</button>
    `;
    list.appendChild(li);
  });
}

window.openPage = (url, btnId, timerId) => {
  window.open(url, '_blank');
  let cnt = 10, sp = document.getElementById(timerId), btn = document.getElementById(btnId);
  const iv = setInterval(() => {
    cnt--; sp.innerText = `⏳ ${cnt}`;
    if (cnt === 0) {
      clearInterval(iv);
      sp.innerText = "✅";
      btn.disabled = false;
    }
  }, 1000);
};

window.uploadScreenshotPrompt = async (targetId, button) => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.onchange = async () => {
    const file = fileInput.files[0];
    if (!file) return alert("لم يتم اختيار صورة.");

    const storageRef = ref(storage, `screenshots/${currentUser.uid}_${targetId}_${Date.now()}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    await confirmFollow(targetId, button, downloadURL);
  };
  fileInput.click();
};

async function confirmFollow(targetId, button, screenshotUrl) {
  const targetRef = doc(db, "users", targetId);
  const targetData = (await getDoc(targetRef)).data();
  if ((targetData.points || 0) < 1) {
    alert("صاحب الصفحة لا يملك نقاط كافية.");
    return;
  }

  await updateDoc(userRef, {
    points: (userData.points || 0) + 1,
    followers: arrayUnion(targetId),
    followCount: (userData.followCount || 0) + 1,
    [`proofs.${targetId}`]: screenshotUrl
  });

  await updateDoc(targetRef, {
    points: targetData.points - 1
  });

  button.parentElement.remove();
  alert("✅ تمت المتابعة وتم رفع لقطة الشاشة.");

  const updated = (await getDoc(userRef)).data();
  if (updated.followCount >= 5 && updated.referrer && !updated.referralCredited) {
    const refRef = doc(db, "users", updated.referrer);
    const refData = (await getDoc(refRef)).data() || {};
    await updateDoc(refRef, { points: (refData.points || 0) + 10 });
    await updateDoc(userRef, { referralCredited: true });
    alert("🎉 مكافأة إحالة: +10 نقاط لمُحيلك!");
  }
}
