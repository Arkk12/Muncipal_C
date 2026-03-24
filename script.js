// Global variables
// Note: Local state is removed. All operations now rely on fetching from the server.
let complaintCounter = parseInt(localStorage.getItem('complaintCounter')) || 1; // Kept only for legacy or if still used elsewhere.

// Admin authentication variables
// DOM elements
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const successModal = document.getElementById('successModal');
const closeModalBtn = document.querySelector('.close');

// --- Initialization ---

document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeFormValidation();
    initializeModal();
    
    // REMOVE or comment out populateSampleData() to avoid old local storage logic
    // populateSampleData(); 
});


// --- Helper Functions ---

function showError(message) {
    alert("Error: " + message);
}

function showSuccess(message) {
    alert("Success: " + message);
}


// --- API Interaction Functions ---

// Function to fetch all complaints from the backend
async function fetchComplaints() {
    try {
        const res = await fetch("http://localhost:5000/complaints");
        if (!res.ok) {
            throw new Error("Failed to fetch data from server");
        }
        return await res.json();
    } catch (err) {
        console.error("❌ Failed to fetch complaints:", err);
        showError("Error loading complaints from server.");
        return [];
    }
}


/*async function handleComplaintSubmission(e) {
    e.preventDefault();

    const form = document.getElementById("complaintForm");

    const data = {
        fullName: form.fullName.value,
        email: form.email.value,
        phone: form.phone.value,
        category: form.category.value,
        address: form.address.value,
        description: form.description.value,
        date: new Date().toISOString(),
        status: "pending"
    };

    try {
        const docRef = await addDoc(collection(db, "complaints"), data);

        document.getElementById("generatedComplaintId").textContent = docRef.id;
        showModal();
        form.reset();

    } catch (error) {
        alert("Error saving data: " + error.message);
    }
}*/
async function handleComplaintSubmission(e) {
    e.preventDefault();

    const form = document.getElementById("complaintForm");

    try {
        // 🔥 STEP 1: Get all complaints count
        const querySnapshot = await getDocs(collection(db, "complaints"));
        const count = querySnapshot.size + 1;

        // 🔥 STEP 2: Create custom ID
        const year = new Date().getFullYear();
        const complaintId = `MC${year}${String(count).padStart(3, '0')}`;

        // 🔥 STEP 3: Prepare data
        const data = {
            complaintId: complaintId,
            fullName: form.fullName.value,
            email: form.email.value,
            phone: form.phone.value,
            category: form.category.value,
            address: form.address.value,
            description: form.description.value,
            date: new Date().toISOString(),
            status: "pending"
        };

        // 🔥 STEP 4: Save in Firebase
        await addDoc(collection(db, "complaints"), data);

        // 🔥 STEP 5: Show YOUR ID (not Firebase one)
        document.getElementById("generatedComplaintId").textContent = complaintId;

        showModal();
        form.reset();

    } catch (error) {
        alert("Error saving data: " + error.message);
    }
}
// ... (rest of script.js remains the same)
// Track complaint functionality
async function trackComplaint() {
    const complaintId = document.getElementById('complaintId').value.trim();

    if (!complaintId) {
        showError('Please enter a complaint ID');
        return;
    }

    const trackResult = document.getElementById('trackResult');
    trackResult.innerHTML = '<p>Loading...</p>';
    trackResult.style.display = 'block';

    try {
        // 🔥 Query Firebase
        const q = query(
            collection(db, "complaints"),
            where("complaintId", "==", complaintId)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const complaint = querySnapshot.docs[0].data();

            const status = complaint.status.toLowerCase();

            trackResult.innerHTML = `
                <div class="complaint-status">
                    <h3>Complaint Details</h3>
                    <p><strong>ID:</strong> ${complaint.complaintId}</p>
                    <p><strong>Name:</strong> ${complaint.fullName}</p>
                    <p><strong>Category:</strong> ${complaint.category}</p>
                    <p><strong>Description:</strong> ${complaint.description}</p>
                    <p><strong>Date Submitted:</strong> ${new Date(complaint.date).toLocaleDateString()}</p>
                    <div style="margin-top: 1rem;">
                        <strong>Status:</strong> ${status.toUpperCase()}
                    </div>
                </div>
            `;
        } else {
            trackResult.innerHTML = `
                <div class="error-message">
                    <p>Complaint not found. Please check the ID.</p>
                </div>
            `;
        }

    } catch (error) {
        console.error(error);
        trackResult.innerHTML = `
            <div class="error-message">
                <p>Error fetching data</p>
            </div>
        `;
    }
}


// --- Other Initializers (Kept for completeness) ---

function initializeNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');
            
            // Check if trying to access admin page
            if (targetPage === 'admin') {
                // Check if admin is authenticated
                if (isAdminAuthenticated()) {
                    showPage(targetPage);
                    showAdminDashboard();
                } else {
                    showPage(targetPage);
                    showAdminLogin();
                }
            } else {
                showPage(targetPage);
            }
            
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function showPage(pageId) {
    pages.forEach(page => page.classList.remove('active'));
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
}

function initializeFormValidation() {
    const complaintForm = document.getElementById('complaintForm');
    if (complaintForm) {
        complaintForm.addEventListener('submit', handleComplaintSubmission);
    }
    
    const trackForm = document.getElementById('trackForm');
    if (trackForm) {
        trackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            trackComplaint();
        });
    }
}

function initializeModal() {
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    if (successModal) {
        window.addEventListener('click', function(event) {
            if (event.target === successModal) {
                closeModal();
            }
        });
    }
}

function showModal() {
    if (successModal) {
        successModal.style.display = 'block';
    }
}

function closeModal() {
    if (successModal) {
        successModal.style.display = 'none';
    }
}

window.addEventListener('load', function() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        showPage(hash);
        navLinks.forEach(nav => {
            if (nav.getAttribute('data-page') === hash) {
                nav.classList.add('active');
            } else {
                nav.classList.remove('active');
            }
        });
    }
    if (document.getElementById('adminPage') && document.getElementById('adminPage').classList.contains('active')) {
        loadComplaintsTable();
    }
});

// Add event listeners for admin search and filter
document.addEventListener('DOMContentLoaded', function() {
    const adminSearch = document.getElementById('adminSearch');
    const statusFilter = document.getElementById('statusFilter');
    
    if (adminSearch) {
        adminSearch.addEventListener('input', filterComplaints);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', filterComplaints);
    }
});

// --- Admin Authentication Functions ---

function initializeAdminAuth() {
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
    
    // Check if admin is already logged in (from session storage)
    checkAdminSession();
}

function checkAdminSession() {
    const sessionData = sessionStorage.getItem('adminSession');
    if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.isLoggedIn && session.username) {
            isAdminLoggedIn = true;
            currentAdminUser = session.username;
            showAdminDashboard();
            updateNavigationState();
        }
    }
}

function handleAdminLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value.trim();
    const errorDiv = document.getElementById('loginError');
    
    // Hide any previous error messages
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
    
    // Validate credentials
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        // Successful login
        isAdminLoggedIn = true;
        currentAdminUser = username;
        
        // Store session data
        sessionStorage.setItem('adminSession', JSON.stringify({
            isLoggedIn: true,
            username: username,
            loginTime: new Date().toISOString()
        }));
        
        // Show dashboard
        showAdminDashboard();
        
        // Update navigation
        updateNavigationState();
        
        // Clear form
        document.getElementById('adminLoginForm').reset();
        
    } else {
        // Failed login
        isAdminLoggedIn = false;
        currentAdminUser = null;
        
        // Show error message
        if (errorDiv) {
            errorDiv.style.display = 'flex';
        }
        
        // Clear password field
        document.getElementById('adminPassword').value = '';
        
        // Focus on username field
        document.getElementById('adminUsername').focus();
    }
}

function showAdminDashboard() {
    const loginContainer = document.getElementById('adminLogin');
    const dashboardContainer = document.getElementById('adminDashboard');
    const adminUserNameSpan = document.getElementById('adminUserName');
    
    if (loginContainer && dashboardContainer) {
        // Hide login form
        loginContainer.style.display = 'none';
        
        // Show dashboard
        dashboardContainer.style.display = 'block';
        
        // Update welcome message
        if (adminUserNameSpan) {
            adminUserNameSpan.textContent = currentAdminUser;
        }
        
        // Load complaints table
        loadComplaintsTable();
    }
}

function showAdminLogin() {
    const loginContainer = document.getElementById('adminLogin');
    const dashboardContainer = document.getElementById('adminDashboard');
    
    if (loginContainer && dashboardContainer) {
        // Show login form
        loginContainer.style.display = 'block';
        
        // Hide dashboard
        dashboardContainer.style.display = 'none';
        
        // Clear form
        const adminLoginForm = document.getElementById('adminLoginForm');
        if (adminLoginForm) {
            adminLoginForm.reset();
        }
        
        // Hide any error messages
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        
        // Focus on username field
        const usernameField = document.getElementById('adminUsername');
        if (usernameField) {
            usernameField.focus();
        }
    }
}

function adminLogout() {
    // Clear session data
    sessionStorage.removeItem('adminSession');
    
    // Reset authentication state
    isAdminLoggedIn = false;
    currentAdminUser = null;
    
    // Show login form
    showAdminLogin();
    
    // Navigate to home page
    showPage('home');
    
    // Update navigation
    updateNavigationState();
}

function isAdminAuthenticated() {
    return isAdminLoggedIn;
}

function updateNavigationState() {
    const adminNavLink = document.querySelector('[data-page="admin"]');
    if (adminNavLink) {
        if (isAdminAuthenticated()) {
            adminNavLink.innerHTML = '<i class="fas fa-user-shield"></i> Admin (Logged In)';
            adminNavLink.style.color = '#10b981';
        } else {
            adminNavLink.innerHTML = '<i class="fas fa-shield-alt"></i> Admin';
            adminNavLink.style.color = 'white';
        }
    }
}