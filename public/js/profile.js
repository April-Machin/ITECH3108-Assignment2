/* ═══════════════════════════════════════════════════════════════════════════
   profile.js — handles both /profile.html (own) and /profile.html?id=X (other)
   ═══════════════════════════════════════════════════════════════════════════ */

const API   = "";
const token = localStorage.getItem("token");
const user  = JSON.parse(localStorage.getItem("user") || "null");

// Which profile are we viewing?
const params   = new URLSearchParams(window.location.search);
const targetId = params.get("id") ? parseInt(params.get("id")) : null;
const isOwnProfile = !targetId || (user && targetId === user.user_id);

// Guests viewing someone else's profile is fine.
// Guests trying to view /profile.html with no id → redirect to login.
if (!targetId && (!token || !user)) {
    window.location.href = "/login.html";
}

/* ── HELPERS ─────────────────────────────────────────────────────────────── */

function authHeaders() {
    return token
        ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
        : { "Content-Type": "application/json" };
}

function avatarUrl(username) {
    return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(username)}`;
}

function formatDate(iso) {
    return new Date(iso).toLocaleDateString("en-AU", {
        day: "numeric", month: "short", year: "numeric"
    });
}

function formatJoined(iso) {
    return new Date(iso).toLocaleDateString("en-AU", {
        month: "short", year: "numeric"
    });
}

function pointsLabel(n) {
    const num = Number(n);
    return num >= 0 ? `+${num}` : `${num}`;
}

function pointsClass(n) {
    const num = Number(n);
    if (num > 0) return "points-positive";
    if (num < 0) return "points-negative";
    return "points-zero";
}

function escHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/* ── NAV — populate immediately from localStorage ────────────────────────── */

function initNav() {
    if (!user) return;

    const navUser = document.getElementById("nav-user-info");
    if (navUser) {
        navUser.classList.remove("hidden");
        // If viewing own profile, keep nav-link-active; otherwise link away
        if (!isOwnProfile) {
            navUser.classList.remove("nav-link-active");
            navUser.href = "/profile.html";
        }
    }

    const avatarEl = document.getElementById("nav-avatar");
    const nameEl   = document.getElementById("nav-username");
    const pointsEl = document.getElementById("nav-points");

    if (avatarEl) avatarEl.src         = avatarUrl(user.username);
    if (nameEl)   nameEl.textContent   = user.username;
    if (pointsEl) pointsEl.textContent = "";  // will refresh below

    // Fetch fresh points
    fetch(`${API}/api/profile`, { headers: authHeaders() })
        .then(r => r.json())
        .then(p => { if (pointsEl) pointsEl.textContent = `${pointsLabel(p.tech_points)} pts`; })
        .catch(() => {});

    // Show nav links that need auth
    document.querySelectorAll(".auth-only").forEach(el => el.classList.remove("hidden"));
    document.querySelectorAll(".guest-only").forEach(el => el.classList.add("hidden"));
}

/* ── RENDER PROFILE HERO ─────────────────────────────────────────────────── */

function renderProfile(profile) {

    document.title = `${profile.username} — AI Art & Creative Tools Pals`;

    // Page hero avatar + username
    const heroAvatar = document.getElementById("profile-avatar");
    if (heroAvatar) heroAvatar.src = profile.profile_image || avatarUrl(profile.username);

    const usernameEl = document.getElementById("profile-username");
    if (usernameEl) usernameEl.textContent = profile.username;

    // Email only shown on own profile
    const emailEl = document.getElementById("profile-email");
    if (emailEl) {
        if (profile.email) {
            emailEl.textContent = profile.email;
        } else {
            emailEl.style.display = "none";
        }
    }

    const bioEl = document.getElementById("profile-bio");
    if (bioEl) {
        if (profile.bio) {
            bioEl.textContent = profile.bio;
        } else {
            bioEl.style.display = "none";
        }
    }

    const pointsNumEl = document.getElementById("stat-points");
    if (pointsNumEl) {
        pointsNumEl.textContent = pointsLabel(profile.tech_points);
        pointsNumEl.className   = `pstat-num ${pointsClass(profile.tech_points)}`;
    }

    const joinedEl = document.getElementById("stat-joined");
    if (joinedEl) joinedEl.textContent = formatJoined(profile.created_at);

    // Show/hide "My Links" vs "their links" label
    const sectionTitle = document.getElementById("section-title");
    if (sectionTitle) {
        sectionTitle.textContent = isOwnProfile
            ? "My Links"
            : `${profile.username}'s Links`;
    }
}

/* ── BUILD POST CARD ─────────────────────────────────────────────────────── */

function buildCard(post, index) {

    const card = document.createElement("div");
    card.className = "post-card";
    card.style.animationDelay = `${index * 40}ms`;

    const imgHtml = post.image_url
        ? `<img class="post-card-image" src="${escHtml(post.image_url)}" alt="" loading="lazy" onerror="this.style.display='none'">`
        : "";

    const catHtml = post.category
        ? `<span class="post-category">${escHtml(post.category)}</span>`
        : "";

    const descHtml = post.description
        ? `<p class="post-desc">${escHtml(post.description)}</p>`
        : "";

    card.innerHTML = `
        ${imgHtml}
        <div class="post-card-body">
            <div class="post-card-meta">
                ${catHtml}
                <span class="post-date">${formatDate(post.created_at)}</span>
            </div>
            <h2 class="post-title">
                <a href="${escHtml(post.tool_url)}" target="_blank" rel="noopener">${escHtml(post.title)}</a>
            </h2>
            ${descHtml}
            <div class="post-author">
                <img class="author-avatar" src="${avatarUrl(post.username)}" alt="">
                <span class="author-name">${escHtml(post.username)}</span>
                <span class="author-points">${pointsLabel(post.tech_points)}</span>
            </div>
        </div>
        <div class="post-card-footer">
            <div class="rating-group">
                <button class="rate-btn liked" disabled>
                    👍 <span class="count">${post.likes}</span>
                </button>
                <button class="rate-btn" disabled>
                    👎 <span class="count">${post.dislikes}</span>
                </button>
            </div>
        </div>`;

    return card;
}

/* ── RENDER POSTS ────────────────────────────────────────────────────────── */

function renderPosts(posts) {

    const grid  = document.getElementById("posts-grid");
    const count = document.getElementById("feed-count");

    const totalLikes = posts.reduce((sum, p) => sum + Number(p.likes), 0);

    const postsEl = document.getElementById("stat-posts");
    const likesEl = document.getElementById("stat-likes");
    if (postsEl) postsEl.textContent = posts.length;
    if (likesEl) likesEl.textContent = totalLikes;

    if (count) count.textContent = `${posts.length} link${posts.length !== 1 ? "s" : ""} shared`;

    if (!posts.length) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No links shared yet.</h3>
                <p>${isOwnProfile
                    ? 'Head to the <a href="/index.html">feed</a> and share your first AI tool.'
                    : "This member hasn't shared any links yet."
                }</p>
            </div>`;
        return;
    }

    grid.innerHTML = "";
    posts.forEach((post, i) => grid.appendChild(buildCard(post, i)));
}

/* ── LOAD DATA ───────────────────────────────────────────────────────────── */

async function loadProfile() {

    try {
        let profile, posts;

        if (isOwnProfile) {
            // Own profile — uses authenticated endpoints
            const [profileRes, postsRes] = await Promise.all([
                fetch(`${API}/api/profile`,  { headers: authHeaders() }),
                fetch(`${API}/api/my-posts`, { headers: authHeaders() })
            ]);

            if (!profileRes.ok) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login.html";
                return;
            }

            profile = await profileRes.json();
            posts   = await postsRes.json();

        } else {
            // Someone else's profile — public endpoints
            const [profileRes, postsRes] = await Promise.all([
                fetch(`${API}/api/users/${targetId}`),
                fetch(`${API}/api/users/${targetId}/posts`)
            ]);

            if (!profileRes.ok) {
                document.getElementById("posts-grid").innerHTML = `
                    <div class="empty-state"><h3>User not found.</h3></div>`;
                return;
            }

            profile = await profileRes.json();
            posts   = await postsRes.json();
        }

        renderProfile(profile);
        renderPosts(posts);

    } catch {
        document.getElementById("posts-grid").innerHTML = `
            <div class="empty-state">
                <h3>Could not load profile</h3>
                <p>Make sure the server is running and try again.</p>
            </div>`;
    }
}

/* ── LOGOUT ──────────────────────────────────────────────────────────────── */

document.getElementById("logout-btn")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login.html";
});

/* ── INIT ────────────────────────────────────────────────────────────────── */

initNav();
loadProfile();