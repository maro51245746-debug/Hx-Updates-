// دالة للحصول على معرف فريد للمستخدم (لمنع التصويت المتكرر)
function getUserId() {
    let userId = localStorage.getItem('pollUserId');
    if (!userId) {
        // إنشاء معرف فريد بسيط
        userId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('pollUserId', userId);
    }
    return userId;
}

// الدالة الأساسية لمعالجة الاستفتاء وعرض النتائج
function setupPoll(pollId) {
    const pollRef = db.collection('polls').doc(pollId);
    const userId = getUserId();
    const optionsContainer = document.getElementById('poll-options-1');
    const resultDisplay = optionsContainer.querySelector('.poll-results-display');
    const buttons = optionsContainer.querySelectorAll('.poll-btn');
    
    // متغير لتتبع ما إذا كان المستخدم قد صوت بالفعل في الجلسة الحالية
    let userVoted = false; 

    // ******************************************************************
    // 1. الاستماع للتغييرات في Firebase (لعرض النتائج الفورية)
    // ******************************************************************
    pollRef.onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data() || {};
            const votes = data.options || {};
            const voters = data.voters || {};
            let totalVotes = 0;
            
            // حساب إجمالي الأصوات
            Object.values(votes).forEach(count => {
                totalVotes += count;
            });

            // التحقق من حالة التصويت للمستخدم الحالي
            if (voters[userId] || userVoted) {
                // إخفاء الأزرار وإظهار النتائج
                buttons.forEach(btn => btn.style.display = 'none');
                resultDisplay.style.display = 'block';
                userVoted = true; 
            } else {
                // إظهار الأزرار إذا لم يصوت المستخدم بعد
                buttons.forEach(btn => btn.style.display = 'block');
                resultDisplay.style.display = 'none';
            }
            
            // تحديث عرض النتائج
            resultDisplay.querySelectorAll('.poll-result').forEach(resultElement => {
                const optionName = resultElement.getAttribute('data-option');
                const voteCount = votes[optionName] || 0;
                
                // حساب النسبة المئوية
                const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                const percentageRounded = percentage.toFixed(0);

                // تحديث النص وعرض شريط التقدم
                resultElement.querySelector('.poll-percentage').textContent = `${percentageRounded}%`;
                resultElement.querySelector('.poll-bar').style.width = `${percentageRounded}%`;
            });

        } else {
            // إذا لم تكن الوثيقة موجودة، يتم إنشاؤها عند أول تصويت
        }
    });

    // ******************************************************************
    // 2. معالجة التصويت (النقر على الزر)
    // ******************************************************************
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            if (userVoted) return; // منع التصويت المزدوج

            const selectedOption = button.getAttribute('data-option');
            userVoted = true; // وضع علامة التصويت على الواجهة الأمامية فوراً

            // استخدام Transaction لضمان دقة العدادات
            db.runTransaction(async (transaction) => {
                const doc = await transaction.get(pollRef);
                const data = doc.data() || {};
                const currentVotes = data.options || {};
                const currentVoters = data.voters || {};

                // 1. تأكد من أن المستخدم لم يصوت بعد
                if (currentVoters[userId]) {
                    throw "Already Voted"; 
                }

                // 2. زيادة العداد للخيار المحدد
                const newVoteCount = (currentVotes[selectedOption] || 0) + 1;
                currentVotes[selectedOption] = newVoteCount;
                
                // 3. تسجيل معرف المستخدم (user ID) في قائمة المصوتين
                currentVoters[userId] = selectedOption;

                // تحديث الوثيقة
                transaction.set(pollRef, { 
                    options: currentVotes,
                    voters: currentVoters
                }, { merge: true });

            }).then(() => {
                console.log("Vote successfully cast for:", selectedOption);
                // الـ onSnapshot Listener سيتولى تحديث النتائج وعرضها
            }).catch((error) => {
                if (error === "Already Voted") {
                    console.log("User tried to vote again, prevented.");
                } else {
                    console.error("Voting transaction failed: ", error);
                }
                userVoted = false; // إذا كان هناك خطأ، اسمح للمستخدم بالمحاولة مرة أخرى
            });
        });
    });
}


// ******************************************************************
// الدالة الرئيسية: عند تحميل الصفحة
// ******************************************************************
document.addEventListener('DOMContentLoaded', () => {
    
    if (typeof db === 'undefined') {
        console.error("Firebase 'db' is not defined. تأكد من إعداد Firebase في index.html.");
        return;
    }

    // A. دالة عداد المشاهدات (غير معدلة، يتم استدعاؤها فقط هنا)
    function trackAndViewCount(postId) {
        const viewCountElement = document.getElementById(`views-${postId}`);
        const postRef = db.collection('posts').doc(postId);

        db.runTransaction(async (transaction) => {
            const doc = await transaction.get(postRef);
            let newViews = (doc.data() && doc.data().views) || 0;
            newViews++; 
            transaction.set(postRef, { views: newViews }, { merge: true }); 
            return newViews;
        }).then((newViews) => {
            viewCountElement.textContent = `المشاهدات: ${newViews}`;
        }).catch((error) => {
            console.error("View count transaction failed: ", error);
            viewCountElement.textContent = `المشاهدات: خطأ`;
        });

        postRef.onSnapshot((doc) => {
            if (doc.exists) {
                const currentViews = doc.data().views || 0;
                viewCountElement.textContent = `المشاهدات: ${currentViews}`;
            }
        });
    }

    // **********************************
    // تشغيل المنطق لكلا المنشورين
    // **********************************
    
    // 1. تشغيل الاستفتاء الجديد
    setupPoll('poll-1'); 
    
    // 2. تشغيل عداد المشاهدات للمنشور القديم
    trackAndViewCount('post-1');
});
