const API   = "";
const token = localStorage.getItem("token");
const user  = JSON.parse(localStorage.getItem("user") || "null");

// Auth check

if (!token || !user) {
    document.addEventListener("DOMContentLoaded", () => {
        const grid = document.getElementById("posts-grid");
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>Sign in to view your favourites</h3>
                    <p><a href="/login.html">Sign in</a> or <a href="/login.html">create an account</a> to start saving links.</p>
                </div>`;
        }
        const count = document.getElementById("feed-count");
        if (count) count.textContent = "";
    });
}

// Helpers

function authHeaders() {
    return token
        ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
        : { "Content-Type": "application/json" };
}

function formatDate(iso) {
    return new Date(iso).toLocaleDateString("en-AU", {
        day: "numeric", month: "short", year: "numeric"
    });
}

function avatarUrl(username) {
    return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(username)}`;
}

function pointsLabel(n) {
    const num = Number(n);
    return num >= 0 ? `+${num} pts` : `${num} pts`;
}

function escHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// Nav

function initNav() {
    if (!user) return;

    const avatarEl = document.getElementById("nav-avatar");
    const nameEl   = document.getElementById("nav-username");
    const pointsEl = document.getElementById("nav-points");

    if (avatarEl) avatarEl.src       = avatarUrl(user.username);
    if (nameEl)   nameEl.textContent = user.username;

    fetch(`${API}/api/profile`, { headers: authHeaders() })
        .then(r => r.json())
        .then(p => { if (pointsEl) pointsEl.textContent = pointsLabel(p.tool_points); })
        .catch(() => {});
}

// Logout

document.getElementById("logout-btn")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login.html";
});

// Card Builder

function buildCard(post, index) {
    const card = document.createElement("div");
    card.className = "post-card";
    card.style.animationDelay = `${index * 40}ms`;
    card.dataset.postId = post.post_id;

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
            <a class="post-author" href="/profile.html?id=${post.user_id}">
                <img class="author-avatar" src="${avatarUrl(post.username)}" alt="">
                <span class="author-name">${escHtml(post.username)}</span>
                <span class="author-points">${pointsLabel(post.tool_points)}</span>
            </a>
        </div>
        <div class="post-card-footer">
            <div class="rating-group">
                <button class="rate-btn liked" disabled title="You liked this">
                    👍 <span class="count">${post.likes}</span>
                </button>
                <button class="rate-btn" disabled title="Dislike count">
                    👎 <span class="count">${post.dislikes}</span>
                </button>
            </div>
        </div>`;

    return card;
}

// Load & render

async function loadFavourites() {
    if (!token || !user) return;

    const grid = document.getElementById("posts-grid");

    try {
        const res = await fetch(`${API}/api/favourites`, { headers: authHeaders() });

        if (res.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>Session expired</h3>
                    <p><a href="/login.html">Sign in again</a> to view your favourites.</p>
                </div>`;
            return;
        }

        const posts = await res.json();
        const count = document.getElementById("feed-count");

        if (!posts.length) {
            if (count) count.textContent = "0 favourites";
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>No favourites yet.</h3>
                    <p>Head to the <a href="/frontpage.html">feed</a> and 👍 some links to save them here.</p>
                </div>`;
            return;
        }

        if (count) count.textContent = `${posts.length} favourite${posts.length !== 1 ? "s" : ""}`;
        grid.innerHTML = "";
        posts.forEach((post, i) => grid.appendChild(buildCard(post, i)));

    } catch {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Could not load favourites</h3>
                <p>Make sure the server is running and try again.</p>
            </div>`;
    }
}

// Init

initNav();
loadFavourites();