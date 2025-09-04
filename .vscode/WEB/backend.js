// Firebase configuration and imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Global variables provided by the environment
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Function to display messages to the user
export const showMessage = (text, isError = false) => {
    const container = document.getElementById('message-container');
    if (!container) return; // Exit if the container doesn't exist on the page
    container.innerHTML = `
        <div class="p-4 rounded-lg shadow-md ${isError ? 'bg-red-500' : 'bg-green-500'} text-white text-center transition-opacity duration-300">
            ${text}
        </div>
    `;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
};

// Handle user registration
export const registerUser = async (e) => {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Save additional user info to Firestore
        const userDocRef = doc(db, `/artifacts/${appId}/users/${user.uid}/student_info`, 'profile');
        await setDoc(userDocRef, {
            studentname: form.studentname.value,
            collegename: form.collegename.value,
            Enggyear: form.Enggyear.value,
            subject: form.subject.value,
            age: form.age.value,
            dateOfBirth: form['date-of-birth'].value,
            gender: form.gender.value
        });
        
        showMessage('Registration successful! Redirecting to resources...', false);
        window.location.href = 'resources.html';
    } catch (error) {
        showMessage(`Registration failed: ${error.message}`, true);
    }
};

// Handle user login
export const loginUser = async (e) => {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showMessage('Login successful! Redirecting to resources...', false);
        window.location.href = 'resources.html';
    } catch (error) {
        showMessage(`Login failed: ${error.message}`, true);
    }
};

// Handle user logout
export const logoutUser = async () => {
    try {
        await signOut(auth);
        showMessage('You have been successfully logged out!', false);
        // Redirect to the login page after logout
        window.location.href = 'login.html';
    } catch (error) {
        showMessage(`Logout failed: ${error.message}`, true);
    }
};

// Handle fetching and displaying user data on the resources page
export const fetchUserData = (userId) => {
    if (!userId) return;
    const userDocRef = doc(db, `/artifacts/${appId}/users/${userId}/student_info`, 'profile');

    // Use a real-time listener to get profile updates
    onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('userName').textContent = data.studentname || 'N/A';
            document.getElementById('userCollege').textContent = data.collegename || 'N/A';
            document.getElementById('userBranch').textContent = data.subject || 'N/A';
            document.getElementById('userYear').textContent = data.Enggyear || 'N/A';
        } else {
            console.log('User profile data not found in Firestore.');
        }
    }, (error) => {
        console.error("Error fetching document:", error);
    });
};

// Handle feedback submission
export const submitFeedback = async (e) => {
    e.preventDefault();
    const form = e.target;
    const feedbackText = form.feedback.value;
    const rating = form.rating.value;

    if (!feedbackText && !rating) {
        showMessage("Please provide feedback or a rating before submitting.", true);
        return;
    }

    try {
        const feedbackCollectionRef = collection(db, `/artifacts/${appId}/public/data/feedback`);
        await addDoc(feedbackCollectionRef, {
            feedback: feedbackText,
            rating: rating || null,
            userId: auth.currentUser ? auth.currentUser.uid : 'anonymous',
            timestamp: new Date().toISOString()
        });

        showMessage('Thank you for your valuable feedback!', false);
        form.reset(); // Clear the form after successful submission
    } catch (error) {
        showMessage(`Failed to submit feedback: ${error.message}`, true);
    }
};

// Initial authentication check on page load
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('registration.html')) {
            window.location.href = 'resources.html';
        }
    } else {
        if (window.location.pathname.endsWith('resources.html') && initialAuthToken === null) {
            window.location.href = 'login.html';
        }
    }
});

if (initialAuthToken) {
    signInWithCustomToken(auth, initialAuthToken).catch((error) => {
        console.error("Custom token sign-in failed:", error);
        signInAnonymously(auth).catch((anonError) => {
            console.error("Anonymous sign-in failed:", anonError);
        });
    });
} else {
    signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed:", error);
    });
}
