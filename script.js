<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HX Cash Hunt - الرئيسية</title>
<link rel="stylesheet" href="style.css">
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"></script>

<style>
/* ===== ستايل الصفحة ===== */
.top-nav { display: flex; gap: 10px; margin-bottom: 20px; justify-content: center; }
.top-nav button { flex: 1; padding: 12px; font-weight: bold; border-radius: 8px; border: none; cursor: pointer; }
.btn-store { background: #f39c12; color: black; }
.btn-history { background: #3498db; color: white; }
.btn-contact { background:#25d366; color:white; }
.modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: none; justify-content: center; align-items: center; z-index: 2000; }
.modal-content { background: #34495e; padding: 25px; border-radius: 15px; width: 85%; max-width: 400px; text-align: center; border: 2px solid #f1c40f; color: white; }
.modal-content input { width: 90%; padding: 10px; margin: 10px 0; border-radius: 5px; border: none; font-size: 16px; }
.close-btn { background: #e74c3c; margin-top: 10px; width: 100%; color: white; border: none; padding: 10px; cursor: pointer; border-radius: 5px; }

#login-screen { max-width: 350px; margin: 50px auto; text-align: center; }
#login-screen input { width: 100%; padding: 12px; margin: 10px 0; border-radius: 8px; border: 1px solid #ccc; font-size: 16px; }
#login-screen button { width: 100%; padding: 12px; margin-top: 10px; font-weight: bold; border-radius: 8px; border: none; cursor: pointer; background: #f1c40f; color: black; }

#login-logo { width:90px; height:90px; border-radius:50%; object-fit:cover; display:block; margin:0 auto 20px; }

footer { background:#222; color:#f1c40f; padding:10px 0; text-align:center; position:fixed; bottom:0; width:100%; font-size:14px; }

.youtube-video { margin: 20px auto; max-width: 560px; text-align:center; }
.youtube-video iframe { width: 100%; height: 315px; border: none; border-radius: 10px; }
#youtube-description { margin-bottom:10px; background:#1e272e; color:#f1c40f; padding:10px; border-radius:5px; font-size:16px; }

.article-section { margin: 20px auto; max-width: 800px; background: #2c3e50; padding: 20px; border-radius: 10px; color: #f1c40f; font-size:16px; }
.game-area { margin: 20px auto; text-align: center; }
#monster-container img { border-radius: 10px; }
#timer-box { margin: 10px 0; font-weight: bold; color: #f1c40f; }
</style>
</head>

<body>

<!-- إعلان الهجوم -->
<div id="reward-ad" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:9999; justify-content:center; align-items:center;">
  <div style="background:#fff; padding:25px; border-radius:12px; text-align:center; width:80%; max-width:350px;">
    <h3>إعلان ممول</h3>
    <p>استنى <span id="reward-timer">30</span> ثانية</p>
    <p style="font-size:14px;color:#555">ممنوع الإغلاق</p>
    <div id="real-ad-container" style="margin-top:15px;"></div>
  </div>
</div>

<!-- شروط الاستخدام -->
<div id="terms-modal" class="modal">
  <div class="modal-content">
    <h3>شروط استخدام الموقع</h3>
    <p>الإدارة تقدر تغلق حسابك أو تخصم نقاطك في أي وقت بدون سبب أو إشعار.
النقاط تُحسب فقط من مشاهدة الإعلانات وبيع السلع في المتجر.</p>
    <button onclick="acceptTerms()" style="background:#27ae60; color:white; padding:10px; border:none; border-radius:5px;">أوافق</button>
  </div>
</div>

<!-- شاشة تسجيل الدخول -->
<div id="login-screen" class="container">
  <h2>HX CASH HUNT</h2>
  <img id="login-logo" src="https://files.catbox.moe/fghvtu.jpg">
  <input type="email" id="email" placeholder="البريد الإلكتروني">
  <input type="password" id="password" placeholder="كلمة السر">
  <button onclick="login()">تسجيل الدخول</button>
  <p id="login-error" style="color:#ff4757; margin-top:15px; font-weight:bold;"></p>
</div>

<!-- واجهة اللعبة -->
<div id="game-interface" style="display:none;">
  <div class="ad-banner">إعلان ثابت - Ad Space</div>
  <div class="container">
    <div class="top-nav">
      <button class="btn-store">🛒 المتجر</button>
      <button class="btn-history">🔔 الإشعارات</button>
      <button class="btn-contact">تواصل معنا</button>
    </div>

    <div class="user-stats">
      <p>اللاعب: <span id="display-name">...</span></p>
      <p>المستوى: <span id="level">1</span></p>
      <p>النقاط: <span id="points">0</span></p>
    </div>

    <div class="game-area">
      <div id="monster-container">
        <img src="https://via.placeholder.com/120/ff0000/ffffff?text=Monster">
        <div id="timer-box">الوقت: <span id="timer">0</span> ثانية</div>
        <button id="attack-btn" onclick="startAttack()">بدء الهجوم</button>
      </div>
    </div>

    <div class="article-section">
      <h3>ماذا يفعل موقعنا</h3>
      <p>كل ما عليك هو مشاهدة الإعلان حتى نهايته، وبعدها تربح النقاط مباشرة!
محتوى المتجر يتجدد باستمرار ويحتوي على اشتراكات مميزة وملفات بوتات وأرقام وهمية وغيرها.</p>
    </div>

    <div id="youtube-description">
      احدث بوت كراش ممكن تشتري من موقعنا 📛👇🏻📛
    </div>

    <div class="youtube-video">
      <iframe src="https://www.youtube.com/embed/u06pVnjyMTo" allowfullscreen></iframe>
    </div>
  </div>
</div>

<footer>© HX Cash Hunt جميع الحقوق محفوظة</footer>

<script src="script.js"></script>
<script>
  // فتح الشروط أول مرة
  document.getElementById('terms-modal').style.display = 'flex';

  function acceptTerms() {
    document.getElementById('terms-modal').style.display = 'none';
  }
</script>

</body>
</html>