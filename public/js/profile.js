/* ═══════════════════════════════════════════════════════════════════════════
   profile.js — AI Art & Creative Tools Pals · Profile Page
   ═══════════════════════════════════════════════════════════════════════════ */

const API   = "";
const token = localStorage.getItem("token");
const user  = JSON.parse(localStorage.getItem("user") || "null");

// Guests get redirected to login
if (!token || !user) {
    window.location.href = "/login.html";
}

/* ── HELPERS ─────────────────────────────────────────────────────────────── */

function authHeaders() {
    return { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
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
    if (num > 0)  return "points-positive";
    if (num < 0)  return "points-negative";
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

/* ── RENDER PROFILE HERO ─────────────────────────────────────────────────── */

function renderProfile(profile) {

    document.title = `${profile.username} — AI Art & Creative Tools Pals`;

    document.getElementById("profile-avatar").src =
        profile.profile_image || avatarUrl(profile.username);

    document.getElementById("profile-username").textContent = profile.username;
    document.getElementById("profile-email").textContent    = profile.email;

    const bioEl = document.getElementById("profile-bio");
    if (profile.bio) {
        bioEl.textContent = profile.bio;
    } else {
        bioEl.style.display = "none";
    }

    const pointsEl = document.getElementById("stat-points");
    pointsEl.textContent = pointsLabel(profile.tech_points);
    pointsEl.className   = `pstat-num ${pointsClass(profile.tech_points)}`;

    document.getElementById("stat-joined").textContent = formatJoined(profile.created_at);
}

/* ── RENDER MY POSTS ─────────────────────────────────────────────────────── */

function buildCard(post, index) {

    const card = document.createElement("div");
    card.className = "post-card own-post";
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
            </div>
        </div>
        <div class="post-card-footer">
            <div class="rating-group">
                <button class="rate-btn liked" disabled>
                    👍 <span class="count">${post.likes}</span>
                </button>
                <button class="rate-btn disliked" disabled>
                    👎 <span class="count">${post.dislikes}</span>
                </button>
            </div>
        </div>`;

    return card;
}

function renderPosts(posts) {

    const grid  = document.getElementById("posts-grid");
    const count = document.getElementById("feed-count");

    // Update stats
    const totalLikes = posts.reduce((sum, p) => sum + Number(p.likes), 0);
    document.getElementById("stat-posts").textContent = posts.length;
    document.getElementById("stat-likes").textContent = totalLikes;

    count.textContent = `${posts.length} link${posts.length !== 1 ? "s" : ""} shared`;

    if (!posts.length) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No links shared yet.</h3>
                <p>Head to the <a href="/index.html">feed</a> and share your first AI tool.</p>
            </div>`;
        return;
    }

    grid.innerHTML = "";
    posts.forEach((post, i) => grid.appendChild(buildCard(post, i)));
}

/* ── LOAD DATA ───────────────────────────────────────────────────────────── */

async function loadProfile() {

    try {
        const [profileRes, postsRes] = await Promise.all([
            fetch(`${API}/api/profile`,  { headers: authHeaders() }),
            fetch(`${API}/api/my-posts`, { headers: authHeaders() })
        ]);

        if (!profileRes.ok) {
            // Token likely expired
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login.html";
            return;
        }

        const profile = await profileRes.json();
        const posts   = await postsRes.json();

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

loadProfile();