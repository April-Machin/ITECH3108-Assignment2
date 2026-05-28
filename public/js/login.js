// Redirect if already logged in
if (localStorage.getItem("token")) {
    window.location.href = "/index.html";
}

function switchTab(tab) {
    const isLogin = tab === "login";
    document.getElementById("login-section").classList.toggle("active", isLogin);
    document.getElementById("register-section").classList.toggle("active", !isLogin);
    document.querySelectorAll(".tab-btn").forEach((btn, i) => {
        btn.classList.toggle("active", isLogin ? i === 0 : i === 1);
    });
    clearMessages();
}

function clearMessages() {
    document.querySelectorAll(".msg").forEach(el => {
        el.className = "msg";
        el.textContent = "";
    });
    document.querySelectorAll("input").forEach(el => el.classList.remove("error-input"));
}

function showMsg(id, text, type) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = "msg " + type;
}

function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (loading) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Please wait…';
    } else {
        btn.disabled = false;
        btn.innerHTML = btnId === "login-btn" ? "Sign in" : "Create account";
    }
}

async function handleLogin() {
    clearMessages();

    const email    = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
        showMsg("login-msg", "Please fill in all fields.", "error");
        return;
    }

    setLoading("login-btn", true);

    try {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            showMsg("login-msg", data.error || "Login failed.", "error");
            return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user",  JSON.stringify(data.user));

        showMsg("login-msg", "Signed in! Redirecting…", "success");
        setTimeout(() => window.location.href = "/index.html", 700);

    } catch {
        showMsg("login-msg", "Could not reach the server. Please try again.", "error");
    } finally {
        setLoading("login-btn", false);
    }
}

async function handleRegister() {
    clearMessages();

    const username = document.getElementById("reg-username").value.trim();
    const email    = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;

    if (!username || !email || !password) {
        showMsg("register-msg", "Please fill in all fields.", "error");
        return;
    }

    if (password.length < 8) {
        showMsg("register-msg", "Password must be at least 8 characters.", "error");
        document.getElementById("reg-password").classList.add("error-input");
        return;
    }

    setLoading("register-btn", true);

    try {
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            showMsg("register-msg", data.error || "Registration failed.", "error");
            return;
        }

        showMsg("register-msg", "Account created! Signing you in…", "success");

        // Auto-login after register
        const loginRes = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const loginData = await loginRes.json();

        if (loginRes.ok) {
            localStorage.setItem("token", loginData.token);
            localStorage.setItem("user",  JSON.stringify(loginData.user));
            setTimeout(() => window.location.href = "/index.html", 900);
        } else {
            setTimeout(() => switchTab("login"), 1200);
        }

    } catch {
        showMsg("register-msg", "Could not reach the server. Please try again.", "error");
    } finally {
        setLoading("register-btn", false);
    }
}

function continueAsGuest() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/index.html";
}

// Allow Enter key to submit
document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    if (document.getElementById("login-section").classList.contains("active")) {
        handleLogin();
    } else {
        handleRegister();
    }
});