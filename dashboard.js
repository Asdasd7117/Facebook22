import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import {
  getDoc, updateDoc, getDocs, doc, collection, arrayUnion, deleteField
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

let currentUser, userRef, userData;

onAuthStateChanged(auth, async user => {
  if (!user) return location.href = "index.html";
  currentUser = user;
  userRef     = doc(db, "users", user.uid);
  userData    = (await getDoc(userRef)).data();

  document.getElementById("userEmail").innerText = user.email;
  document.getElementById("points").innerText    = userData.points || 0;

  // رابط الإحالة
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

  // حفظ/حذف الصفحة
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

// عرض صفحات الآخرين
async function loadOtherPages() {
  const list = document.getElementById("pagesList");
  list.innerHTML = "";
  const snap = await getDocs(collection(db, "users"));
  snap.forEach(docSnap => {
    const o = docSnap.data(), id = docSnap.id;
    if (id === currentUser.uid) return;
    if (!o.facebookPage)       return;
    if ( (o.points||0) < 1 )   return;   // لا تظهر إن لم يكن لديه نقاط
    if ((userData.followers||[]).includes(id)) return;

    const li     = document.createElement("li");
    const pageId = `btn_${id}`, timerId = `t_${id}`;
    li.innerHTML = `
      <a href="${o.facebookPage}" target="_blank">🔗 ${o.email}</a>
      <button onclick="openPage('${o.facebookPage}','${pageId}','${timerId}')">افتح الصفحة</button>
      <span id="${timerId}">⏳ 10</span>
      <button id="${pageId}" onclick="confirmFollow('${id}', this)" disabled>تابعت</button>
    `;
    list.appendChild(li);
  });
}

// تأكيد المتابعة مع مؤقت
window.openPage = (url, btnId, timerId) => {
  window.open(url, '_blank');
  let cnt = 10, sp = document.getElementById(timerId), btn = document.getElementById(btnId);
  const iv = setInterval(() => {
    cnt--; sp.innerText = `⏳ ${cnt}`;
    if (cnt===0) { clearInterval(iv); sp.innerText="✅"; btn.disabled=false; }
  },1000);
};

// تنفيذ المتابعة ونظام الإحالة على 5 متابعات
window.confirmFollow = async (targetId, btn) => {
  if (!confirm("هل تابعت الصفحة فعلاً؟")) return;
  const tRef = doc(db,"users",targetId), tData = (await getDoc(tRef)).data();
  if ((tData.points||0)<1) { alert("صاحب الصفحة لا يملك نقاطاً"); return; }

  // أنت تربح نقطة
  await updateDoc(userRef, {
    points   : (userData.points||0)+1,
    followers: arrayUnion(targetId),
    followCount: (userData.followCount||0)+1
  });
  // وهو يخسر نقطة
  await updateDoc(tRef, { points: tData.points-1 });

  btn.parentElement.remove();
  alert("تمت المتابعة!");

  // تحقق من مكافأة الإحالة (5 متابعات)
  const updated = (await getDoc(userRef)).data();
  if (updated.followCount >=5 && updated.referrer && !updated.referralCredited) {
    const refRef = doc(db,"users", updated.referrer);
    const refData= (await getDoc(refRef)).data()||{};
    await updateDoc(refRef,{ points:(refData.points||0)+10 });
    await updateDoc(userRef,{ referralCredited:true });
    alert("مكافأة إحالة: +10 نقاط أضيفت لمُحيلك!");
  }
};
