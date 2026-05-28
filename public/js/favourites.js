const API   = "";
const token = localStorage.getItem("token");
const user  = JSON.parse(localStorage.getItem("user") || "null");

// Redirect guests to login
if (!token || !user) {
    window.location.href = "/login.html";
}

//HELPERS

function authHeaders() {
    return { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
}

function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
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

//AUTH UI

function initAuthUI() {
    if (!user) return;
    document.getElementById("nav-username").textContent = user.username;
    document.getElementById("nav-avatar").src           = avatarUrl(user.username);

    fetch(`${API}/api/profile`, { headers: authHeaders() })
        .then(r => r.json())
        .then(p => {
            document.getElementById("nav-points").textContent = pointsLabel(p.tech_points);
        })
        .catch(() => {});
}

//CARD BUILDER

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

//LOAD FAVOURITES

async function loadFavourites() {

    const grid = document.getElementById("posts-grid");

    try {
        const res   = await fetch(`${API}/api/favourites`, { headers: authHeaders() });
        const posts = await res.json();

        const count = document.getElementById("feed-count");
        count.textContent = `${posts.length} favourite${posts.length !== 1 ? "s" : ""}`;

        if (!posts.length) {
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>No favourites yet.</h3>
                    <p>Go to the <a href="/index.html">feed</a> and 👍 links you love.</p>
                </div>`;
            return;
        }

        grid.innerHTML = "";
        posts.forEach((post, i) => {
            grid.appendChild(buildCard(post, i));
        });

    } catch {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Could not load favourites</h3>
                <p>Make sure the server is running and try again.</p>
            </div>`;
    }
}

//LOGOUT

document.getElementById("logout-btn")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login.html";
});

//INIT

initAuthUI();
loadFavourites();   