// ====== إعداد Firebase ======
const firebaseConfig = {
  apiKey: "AIzaSyAW9IQZZXks-09bSfAffXVxrgejYfw0O74",
  authDomain: "hx-cash-hunt.firebaseapp.com",
  databaseURL: "https://hx-cash-hunt-default-rtdb.firebaseio.com/",
  projectId: "hx-cash-hunt",
  storageBucket: "hx-cash-hunt.appspot.com",
  messagingSenderId: "829449009252",
  appId: "1:829449009252:web:b0e4a03f170bb61d7a4771"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

const db = firebase.database();
const auth = firebase.auth();
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);

// ====== المتغيرات ======
let currentUser = null;
let userData = {};
const REWARD = 10;          // نقاط الهجوم
const COOLDOWN = 60000;     // دقيقة
const AD_TIME = 30;         // ثواني

const FREE_POINTS = 10;        // نقاط مجانية
const FREE_COOLDOWN = 20000;   // 20 ثانية

// ====== التعامل مع Auth ======
auth.onAuthStateChanged(user => {
  if(!user) return showLogin();
  db.ref("users/" + user.uid).once("value").then(snap => {
    if(!snap.exists()) { auth.signOut(); showLogin(); return; }
    currentUser = user;
    userData = snap.val();
    showGame();
    updateUI();
  });
});

function showLogin() {
  document.getElementById("login-screen").style.display = "block";
  document.getElementById("game-interface").style.display = "none";
}

function showGame() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("game-interface").style.display = "block";
}

function updateUI() {
  document.getElementById("display-name").innerText = userData.name || "لاعب";
  document.getElementById("points").innerText = userData.points || 0;
  document.getElementById("level").innerText = userData.level || 1;
}

// ====== إعلان الهجوم ======
function loadRealAd() {
  const container = document.getElementById("real-ad-container");
  if(!container) return;
  container.innerHTML = "";
  const s = document.createElement("script");
  s.dataset.zone = "10450260";
  s.src = "https://al5sm.com/tag.min.js";
  s.async = true;
  container.appendChild(s);
}

// ====== زر الهجوم ======
window.startAttack = function() {
  if(!currentUser) return;
  const uid = currentUser.uid;
  const now = Date.now();
  db.ref("lastAttack/" + uid).once("value").then(snap => {
    if(snap.exists() && now - snap.val() < COOLDOWN) { 
      alert("استنى دقيقة قبل الهجوم تاني"); 
      return; 
    }
    db.ref("lastAttack/" + uid).set(now);
    startRewardAd();
  });
};

function startRewardAd() {
  const ad = document.getElementById("reward-ad");
  const timerEl = document.getElementById("reward-timer");
  let timeLeft = AD_TIME;
  ad.style.display = "flex";
  timerEl.innerText = timeLeft;
  loadRealAd();
  const interval = setInterval(() => {
    timeLeft--;
    timerEl.innerText = timeLeft;
    if(timeLeft <=0) { 
      clearInterval(interval); 
      ad.style.display = "none"; 
      giveReward(); 
    }
  }, 1000);
}

function giveReward() {
  const newPoints = (userData.points || 0) + REWARD;
  db.ref("users/" + currentUser.uid).update({ points:newPoints })
  .then(()=>{ 
    userData.points=newPoints; 
    updateUI(); 
  });
}

// ====== نقاط مجانية ======
window.getFreePoints = function(){
  if(!currentUser) return;

  const uid = currentUser.uid;
  const now = Date.now();

  db.ref("lastFreeReward/" + uid).once("value").then(snap=>{
    if(snap.exists() && now - snap.val() < FREE_COOLDOWN){
      alert("استنى شوية قبل ما تاخد النقاط تاني");
      return;
    }

    // ضيف النقاط فوراً
    const newPoints = (userData.points || 0) + FREE_POINTS;
    db.ref("users/" + uid).update({ points: newPoints })
    .then(()=>{
      userData.points = newPoints;
      updateUI();
      alert(`تم إضافة ${FREE_POINTS} نقاط لحسابك! 🎉`);
    });

    // سجل الوقت عشان يبقى فيه كولداون
    db.ref("lastFreeReward/" + uid).set(now);

    // افتح الموقع (اختياري)
    window.open("https://otieu.com/4/10460304", "_blank");
  });
};


window.adjustLevel = function(id, currentLevel, type) {
    const val = parseInt(document.getElementById('lvl-' + id).value);
    if(!val) return;
    let newLevel = (type === 'add') ? currentLevel + val : currentLevel - val;
    if(newLevel < 1) newLevel = 1; // الحد الأدنى للمستوى 1
    db.ref('users/' + id).update({ level: newLevel });
    renderUsers(document.getElementById('search-input').value.toLowerCase()); // اعادة تحميل لعرض المستوى الجديد
}
// ====== تسجيل الدخول ======
window.login = function() {
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("password").value.trim();
  const loginError = document.getElementById("login-error");
  if(!email||!pass){ loginError.innerText="اكتب الإيميل والباسورد"; return; }
  auth.signInWithEmailAndPassword(email, pass)
  .catch(()=>loginError.innerText="بيانات الدخول غير صحيحة");
};