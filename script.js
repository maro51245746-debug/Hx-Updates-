const firebaseConfig = {
  apiKey: "AIzaSyAW9IQZZXks-09bSfAffXVxrgejYfw0O74",
  authDomain: "hx-cash-hunt.firebaseapp.com",
  databaseURL: "https://hx-cash-hunt-default-rtdb.firebaseio.com/",
  projectId: "hx-cash-hunt",
  storageBucket: "hx-cash-hunt.firebasestorage.app",
  messagingSenderId: "829449009252",
  appId: "1:829449009252:web:b0e4a03f170bb61d7a4771"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

const db = firebase.database();
const auth = firebase.auth();

let currentUser = null;
let userData = {};

const REWARD = 10;
const COOLDOWN = 60000;
const AD_TIME = 30;

auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);

/* ===== Auth ===== */
auth.onAuthStateChanged(user => {
    if (!user) return showLogin();

    db.ref("users/" + user.uid).once("value").then(snap => {
        if (!snap.exists()) {
            auth.signOut();
            showLogin();
        } else {
            currentUser = user;
            userData = snap.val();
            showGame();
            updateUI();
        }
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

/* ===== تحميل إعلان al5sm ===== */
function loadRealAd() {
    const container = document.getElementById("real-ad-container");
    if (!container) return;

    container.innerHTML = "";

    const s = document.createElement("script");
    s.dataset.zone = "10450260";
    s.src = "https://al5sm.com/tag.min.js";
    s.async = true;

    container.appendChild(s);
}

/* ===== زر الهجوم (من غير كسر الموجود في index) ===== */
if (!window.startAttack) {
    window.startAttack = function () {
        if (!currentUser) return;

        const uid = currentUser.uid;
        const now = Date.now();

        db.ref("lastAttack/" + uid).once("value").then(snap => {
            if (snap.exists() && now - snap.val() < COOLDOWN) {
                alert("استنى دقيقة قبل الهجوم تاني");
                return;
            }

            db.ref("lastAttack/" + uid).set(now);
            startRewardAd();
        });
    };
}

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

        if (timeLeft <= 0) {
            clearInterval(interval);
            ad.style.display = "none";
            giveReward();
        }
    }, 1000);
}

function giveReward() {
    const newPoints = (userData.points || 0) + REWARD;

    db.ref("users/" + currentUser.uid).update({ points: newPoints })
    .then(() => {
        userData.points = newPoints;
        updateUI();
    });
}

/* ===== ربط rewardUser مع index.html ===== */
if (!window.rewardUser) {
    window.rewardUser = giveReward;
}

/* ===== Login ===== */
window.login = function () {
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value.trim();
    const loginError = document.getElementById("login-error");

    if (!email || !pass) {
        loginError.innerText = "اكتب الإيميل والباسورد";
        return;
    }

    auth.signInWithEmailAndPassword(email, pass)
    .catch(() => loginError.innerText = "بيانات الدخول غير صحيحة");
};