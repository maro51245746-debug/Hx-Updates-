document.addEventListener('DOMContentLoaded', () => {
    
    // **********************************
    // 1. التحقق من Firebase
    // **********************************
    if (typeof db === 'undefined') {
        console.error("Firebase 'db' is not defined. تأكد من إعداد Firebase في index.html.");
        return;
    }

    // **********************************
    // 2. دالة عداد المشاهدات
    // **********************************
    function trackAndViewCount(postId) {
        const viewCountElement = document.getElementById(`views-${postId}`);
        const postRef = db.collection('posts').doc(postId);

        // أ. زيادة العداد في قاعدة البيانات (Transaction لضمان دقة العد)
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

        // ب. الاستماع للتغييرات (لضمان أن كل زائر يرى العداد المُتزامن)
        postRef.onSnapshot((doc) => {
            if (doc.exists) {
                const currentViews = doc.data().views || 0;
                viewCountElement.textContent = `المشاهدات: ${currentViews}`;
            }
        });
    }

    // **********************************
    // 3. تشغيل الدالة لكلا المنشورين
    // **********************************
    trackAndViewCount('post-2'); // منشور الفيديو
    trackAndViewCount('post-1'); // منشور التحديثات الجديد
});
