// --- TOAST NOTIFICATION SYSTEM ---
function showToast(message, type) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    const prefix = type === 'success' ? "🎉 " : "⚠️ ";
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${prefix} ${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 4000);
}

// --- LOGIN LOGIC ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            
            if (response.ok && data.token) {
                showToast("Login successful!", 'success');
                localStorage.setItem('token', data.token); // Save session
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
            } else {
                showToast(data.message || "Login failed", 'error');
            }
        } catch (error) {
            showToast('Network error occurred.', 'error');
        }
    });
}

// --- REGISTER LOGIC ---
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await response.json();

            if (response.ok) {
                showToast("Registration successful! Redirecting...", 'success');
                setTimeout(() => { window.location.href = 'index.html'; }, 1500);
            } else {
                showToast(data.message || "Registration failed.", 'error');
            }
        } catch (error) {
            showToast('Network error occurred.', 'error');
        }
    });
}

// --- FORGOT PASSWORD LOGIC ---
const forgotForm = document.getElementById('forgotForm');
if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value;
        
        try {
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (response.ok) showToast(data.message, 'success');
            else showToast(data.message, 'error');
        } catch (error) {
            showToast('Network error occurred.', 'error');
        }
    });
}

// --- RESET PASSWORD LOGIC ---
const resetForm = document.getElementById('resetPasswordForm');
if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Get token from URL (e.g., reset-password.html?token=12345)
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const password = document.getElementById('new-password').value;

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });
            const data = await response.json();
            if (response.ok) {
                showToast("Password updated! Redirecting...", 'success');
                setTimeout(() => { window.location.href = 'index.html'; }, 1500);
            } else {
                showToast(data.message, 'error');
            }
        } catch (error) {
            showToast('Network error occurred.', 'error');
        }
    });
}

// --- DASHBOARD LOGIC ---
if (window.location.pathname.includes('dashboard.html')) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html'; // Kick out if not logged in
    } else {
        // Fetch secure user data
        fetch('/api/user-data', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById('user-name').innerText = data.user.username;
                document.getElementById('count').innerText = data.user.loginCount;
                
                // Populate login history
                const historyHtml = data.user.loginHistory.map(log => 
                    `<p>🕒 ${new Date(log.time).toLocaleString()} - IP: ${log.ip}</p>`
                ).join('');
                document.getElementById('history-list').innerHTML = historyHtml;
            } else {
                localStorage.removeItem('token');
                window.location.href = 'index.html';
            }
        });
    }

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
}