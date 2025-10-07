document.addEventListener('DOMContentLoaded', () => {
    
    // تأكد من أن متغير 'db' معرف في الكود المدمج داخل ملف index.html
    if (typeof db === 'undefined') {
        console.error("Firebase 'db' is not defined. Ensure Firebase initialization script is placed correctly in index.html.");
        return;
    }

    // الدالة الأساسية: زيادة وعرض المشاهدات
    function trackAndViewCount(postId) {
        const viewCountElement = document.getElementById(`views-${postId}`);
        // تحديد الوثيقة في مجموعة 'posts' في Firestore
        const postRef = db.collection('posts').doc(postId);

        // أ. زيادة العداد في قاعدة البيانات (Transaction لضمان دقة العد)
        db.runTransaction(async (transaction) => {
            const doc = await transaction.get(postRef);
            let newViews = (doc.data() && doc.data().views) || 0;
            
            // زيادة المشاهدة بمقدار 1
            newViews++; 

            transaction.set(postRef, { views: newViews }, { merge: true }); 
            return newViews;
        }).then((newViews) => {
            // تحديث الواجهة الأمامية بعد نجاح عملية الزيادة
            viewCountElement.textContent = `المشاهدات: ${newViews}`;
        }).catch((error) => {
            console.error("View count transaction failed: ", error);
            viewCountElement.textContent = `المشاهدات: خطأ`;
        });

        // ب. الاستماع للتغييرات (لضمان أن كل زائر يرى العداد المُتزامن)
        postRef.onSnapshot((doc) => {
            if (doc.exists) {
                const currentViews = doc.data().views || 0;
                viewCountElement.textContent = `المشاهدات: ${currentViews}`;
            }
        });
    }

    // **********************************
    // تشغيل الدالة للمنشور الوحيد
    // **********************************
    trackAndViewCount('post-1'); 
});
