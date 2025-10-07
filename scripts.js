// Function to get a unique identifier for the user (to prevent repeat voting)
function getUserId() {
    let userId = localStorage.getItem('pollUserId');
    if (!userId) {
        // Generate a simple unique ID (using current time and a random number)
        userId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('pollUserId', userId);
    }
    return userId;
}

// Function to handle the real-time voting and display
function setupPoll(pollId) {
    const pollRef = db.collection('polls').doc(pollId);
    const userId = getUserId();
    const optionsContainer = document.getElementById('poll-options-1');
    const resultDisplay = optionsContainer.querySelector('.poll-results-display');
    const buttons = optionsContainer.querySelectorAll('.poll-btn');
    
    let userVoted = false;

    // --- 1. DISPLAY RESULTS (Real-time listener) ---
    // This function runs every time the poll data changes in Firebase
    pollRef.onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data() || {};
            const votes = data.options || {};
            const voters = data.voters || {};
            let totalVotes = 0;
            
            // Calculate total votes
            Object.values(votes).forEach(count => {
                totalVotes += count;
            });

            // Check if the current user has already voted
            if (voters[userId] || userVoted) {
                // Hide buttons and show results
                buttons.forEach(btn => btn.style.display = 'none');
                resultDisplay.style.display = 'block';
                userVoted = true;
            } else {
                // Show buttons if user hasn't voted
                buttons.forEach(btn => btn.style.display = 'block');
                resultDisplay.style.display = 'none';
            }
            
            // Update results display
            resultDisplay.querySelectorAll('.poll-result').forEach(resultElement => {
                const optionName = resultElement.getAttribute('data-option');
                const voteCount = votes[optionName] || 0;
                
                // Calculate percentage
                const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                const percentageRounded = percentage.toFixed(0);

                // Update text and bar width
                resultElement.querySelector('.poll-percentage').textContent = `${percentageRounded}%`;
                resultElement.querySelector('.poll-bar').style.width = `${percentageRounded}%`;
            });

        } else {
            // Document doesn't exist yet, initialize it
            // This is handled by the initial click (see below)
        }
    });

    // --- 2. HANDLE VOTING (Button click) ---
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            if (userVoted) return; // Prevent double clicking

            const selectedOption = button.getAttribute('data-option');
            userVoted = true; // Mark voted immediately on the client side

            // Atomic update (transaction) to ensure accuracy
            db.runTransaction(async (transaction) => {
                const doc = await transaction.get(pollRef);
                const data = doc.data() || {};
                const currentVotes = data.options || {};
                const currentVoters = data.voters || {};

                // 1. Check again in case the user's vote status changed during the transaction
                if (currentVoters[userId]) {
                    throw "Already Voted"; // This stops the transaction
                }

                // 2. Increment the vote count for the selected option
                const newVoteCount = (currentVotes[selectedOption] || 0) + 1;
                currentVotes[selectedOption] = newVoteCount;
                
                // 3. Mark the user as having voted
                currentVoters[userId] = selectedOption;

                // Update the document
                transaction.set(pollRef, { 
                    options: currentVotes,
                    voters: currentVoters
                }, { merge: true });

            }).then(() => {
                // Success: The onSnapshot listener will handle showing the final result
                console.log("Vote successfully cast for:", selectedOption);
            }).catch((error) => {
                if (error === "Already Voted") {
                    console.log("User tried to vote again, prevented.");
                } else {
                    console.error("Voting transaction failed: ", error);
                }
                userVoted = false; // Allow another try if it was a generic error
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    
    if (typeof db === 'undefined') {
        console.error("Firebase 'db' is not defined.");
        return;
    }

    // A. تشغيل عداد المشاهدات القديم
    function trackAndViewCount(postId) {
        // ... (كود عداد المشاهدات كما هو في الملف السابق) ...
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
    // تشغيل المنطق:
    // **********************************
    // 1. تشغيل الاستفتاء الجديد
    setupPoll('poll-1'); 
    
    // 2. تشغيل عداد المشاهدات للمنشور القديم
    trackAndViewCount('post-1');
});
