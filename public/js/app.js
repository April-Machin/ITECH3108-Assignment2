const API = "";          // same origin
const token = localStorage.getItem("token");
const user  = JSON.parse(localStorage.getItem("user") || "null");

let currentSort     = "recent";
let currentCategory = "";
let allPosts        = [];
let myRatings       = {};   // { post_id: true/false }

function authHeaders() {
    return token
        ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
        : { "Content-Type": "application/json" };
}

function toast(msg, type = "default") {
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
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

/* ── AUTH UI SETUP ───────────────────────────────────────────────────────── */

function initAuthUI() {

    const authEls  = document.querySelectorAll(".auth-only");
    const guestEls = document.querySelectorAll(".guest-only");

    if (user) {
        authEls.forEach(el  => el.classList.remove("hidden"));
        guestEls.forEach(el => el.classList.add("hidden"));

        document.getElementById("nav-username").textContent = user.username;
        document.getElementById("nav-avatar").src = avatarUrl(user.username);

        // Refresh points from API
        fetch(`${API}/api/profile`, { headers: authHeaders() })
            .then(r => r.json())
            .then(p => {
                document.getElementById("nav-points").textContent = pointsLabel(p.tech_points);
            })
            .catch(() => {});

    } else {
        authEls.forEach(el  => el.classList.add("hidden"));
        guestEls.forEach(el => el.classList.remove("hidden"));
    }
}

//CATEGORIES

async function loadCategories() {

    try {
        const res  = await fetch(`${API}/api/categories`);
        const cats = await res.json();

        const filter = document.getElementById("category-filter");

        // Wire up the static "All" button here, alongside the dynamic ones
        filter.querySelector("[data-cat='']")?.addEventListener("click", () => setCategory(""));

        cats.forEach(cat => {
            const btn = document.createElement("button");
            btn.className   = "cat-btn";
            btn.dataset.cat = cat.name;
            btn.textContent = cat.name;
            btn.addEventListener("click", () => setCategory(cat.name));
            filter.appendChild(btn);
        });

    } catch {}
}

function setCategory(cat) {
    currentCategory = (currentCategory === cat) ? "" : cat;
    document.querySelectorAll(".cat-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.cat === currentCategory);
    });
    renderPosts();
}

//POSTS
async function loadMyRatings() {
    if (!token) return;
    try {
        const res = await fetch(`${API}/api/my-ratings`, { headers: authHeaders() });
        myRatings = await res.json();
    } catch { myRatings = {}; }
}

async function loadPosts() {

    document.getElementById("posts-grid").innerHTML = `
        <div class="loading-state">
            <div class="spinner-lg"></div>
            <p>Loading links…</p>
        </div>`;

    try {
        const [postsRes] = await Promise.all([
            fetch(`${API}/api/posts?sort=${currentSort}`, { headers: authHeaders() }),
            loadMyRatings()
        ]);

        allPosts = await postsRes.json();
        renderPosts();

    } catch {
        document.getElementById("posts-grid").innerHTML = `
            <div class="empty-state">
                <h3>Could not load posts</h3>
                <p>Make sure the server is running and try again.</p>
            </div>`;
    }
}

function renderPosts() {

    const grid = document.getElementById("posts-grid");

    const filtered = currentCategory
        ? allPosts.filter(p => p.category === currentCategory)
        : allPosts;

    const count = document.getElementById("feed-count");
    count.textContent = `${filtered.length} link${filtered.length !== 1 ? "s" : ""}`;

    if (!filtered.length) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Nothing here yet.</h3>
                <p>${user ? "Be the first to share a link!" : '<a href="/login.html">Sign in</a> and share the first link!'}</p>
            </div>`;
        return;
    }

    grid.innerHTML = "";

    filtered.forEach((post, i) => {
        const card = buildCard(post, i);
        grid.appendChild(card);
    });
}

function buildCard(post, index) {

    const myRating = myRatings[post.post_id]; // true=liked, false=disliked, undefined=unrated
    const isOwner  = user && Number(user.user_id) === Number(post.user_id);

    const card = document.createElement("div");
    card.className = "post-card";
    card.style.animationDelay = `${index * 40}ms`;
    card.dataset.postId = post.post_id;

    // Image
    const imgHtml = post.image_url
        ? `<img class="post-card-image" src="${escHtml(post.image_url)}" alt="" loading="lazy" onerror="this.style.display='none'">`
        : "";

    // Category badge
    const catHtml = post.category
        ? `<span class="post-category">${escHtml(post.category)}</span>`
        : "";

    // Description
    const descHtml = post.description
        ? `<p class="post-desc">${escHtml(post.description)}</p>`
        : "";

    // Rating area
    let footerHtml;

    if (user) {
        const alreadyRated = myRating !== undefined;
        const likedClass   = myRating === true  ? "rate-btn liked"    : "rate-btn";
        const dislikeCls   = myRating === false ? "rate-btn disliked" : "rate-btn";
        const disabled     = (alreadyRated || isOwner) ? "disabled" : "";
        const likeTitle    = isOwner ? "Can't rate your own post" : alreadyRated ? "Already rated" : "Like";
        const dislikeTitle = isOwner ? "Can't rate your own post" : alreadyRated ? "Already rated" : "Dislike";

        footerHtml = `
            <div class="rating-group">
                <button class="${likedClass}" data-action="like" title="${likeTitle}" ${disabled}>
                    👍 <span class="count">${post.likes}</span>
                </button>
                <button class="${dislikeCls}" data-action="dislike" title="${dislikeTitle}" ${disabled}>
                    👎 <span class="count">${post.dislikes}</span>
                </button>
            </div>
            <button class="hide-btn" data-action="hide" title="Hide this post">🙈</button>`;
    } else {
        footerHtml = `
            <div class="rating-group">
                <button class="rate-btn" disabled title="Sign in to rate">
                    👍 <span class="count">${post.likes}</span>
                </button>
                <button class="rate-btn" disabled title="Sign in to rate">
                    👎 <span class="count">${post.dislikes}</span>
                </button>
            </div>
            <span class="guest-rate-msg"><a href="/login.html">Sign in</a> to rate</span>`;
    }

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
            ${footerHtml}
        </div>`;

    // Wire up events
    card.querySelector("[data-action='like']")?.addEventListener("click", () => ratePost(post.post_id, true, card));
    card.querySelector("[data-action='dislike']")?.addEventListener("click", () => ratePost(post.post_id, false, card));
    card.querySelector("[data-action='hide']")?.addEventListener("click", () => hidePost(post.post_id, card));

    return card;
}

function escHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

//RATINGS
async function ratePost(postId, isLike, card) {

    if (!token) { window.location.href = "/login.html"; return; }

    const likeBtn    = card.querySelector("[data-action='like']");
    const dislikeBtn = card.querySelector("[data-action='dislike']");

    // Optimistic UI
    const oldLikes    = Number(likeBtn.querySelector(".count").textContent);
    const oldDislikes = Number(dislikeBtn.querySelector(".count").textContent);

    if (isLike) {
        likeBtn.querySelector(".count").textContent = oldLikes + 1;
        likeBtn.classList.add("liked");
    } else {
        dislikeBtn.querySelector(".count").textContent = oldDislikes + 1;
        dislikeBtn.classList.add("disliked");
    }

    likeBtn.disabled    = true;
    dislikeBtn.disabled = true;

    try {
        const res = await fetch(`${API}/api/ratings`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ post_id: postId, is_like: isLike })
        });

        const data = await res.json();

        if (!res.ok) {
            // Revert optimistic update
            likeBtn.querySelector(".count").textContent    = oldLikes;
            dislikeBtn.querySelector(".count").textContent = oldDislikes;
            likeBtn.classList.remove("liked");
            dislikeBtn.classList.remove("disliked");
            likeBtn.disabled    = false;
            dislikeBtn.disabled = false;
            toast(data.error || "Could not rate post", "error");
            return;
        }

        myRatings[postId] = isLike;
        toast(isLike ? "👍 Liked!" : "👎 Disliked", "success");

        // Refresh nav points
        fetch(`${API}/api/profile`, { headers: authHeaders() })
            .then(r => r.json())
            .then(p => {
                document.getElementById("nav-points").textContent = pointsLabel(p.tech_points);
            }).catch(() => {});

    } catch {
        toast("Network error — please try again", "error");
    }
}

//HIDE
async function hidePost(postId, card) {

    if (!token) { window.location.href = "/login.html"; return; }

    const btn = card.querySelector("[data-action='hide']");
    btn.disabled = true;

    try {
        const res = await fetch(`${API}/api/hide`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ post_id: postId })
        });

        if (res.ok) {
            card.style.transition = "opacity 0.3s, transform 0.3s";
            card.style.opacity    = "0";
            card.style.transform  = "scale(0.95)";
            setTimeout(() => {
                card.remove();
                allPosts = allPosts.filter(p => p.post_id !== postId);
                // Update count
                const filtered = currentCategory
                    ? allPosts.filter(p => p.category === currentCategory)
                    : allPosts;
                document.getElementById("feed-count").textContent =
                    `${filtered.length} link${filtered.length !== 1 ? "s" : ""}`;
            }, 300);
            toast("Post hidden", "default");
        } else {
            btn.disabled = false;
            toast("Could not hide post", "error");
        }
    } catch {
        btn.disabled = false;
        toast("Network error", "error");
    }
}

//CREATE POST MODAL

async function loadCategoriesForModal() {

    const select = document.getElementById("post-cat");
    if (!select) return;

    try {
        const res  = await fetch(`${API}/api/categories`);
        const cats = await res.json();

        cats.forEach(cat => {
            const opt = document.createElement("option");
            opt.value       = cat.category_id;
            opt.textContent = cat.name;
            select.appendChild(opt);
        });
    } catch {}
}

function openPostModal() {
    document.getElementById("post-modal-backdrop").classList.remove("hidden");
    document.getElementById("post-title").focus();
}

function closePostModal() {
    document.getElementById("post-modal-backdrop").classList.add("hidden");
    clearPostModal();
}

function clearPostModal() {
    ["post-title", "post-url", "post-desc", "post-img"].forEach(id => {
        document.getElementById(id).value = "";
    });
    document.getElementById("post-cat").value = "";
    const msg = document.getElementById("post-msg");
    msg.className = "msg";
    msg.textContent = "";
}

function showPostMsg(text, type) {
    const msg = document.getElementById("post-msg");
    msg.textContent = text;
    msg.className   = `msg ${type}`;
}

async function submitPost() {

    const title   = document.getElementById("post-title").value.trim();
    const toolUrl = document.getElementById("post-url").value.trim();
    const desc    = document.getElementById("post-desc").value.trim();
    const catId   = document.getElementById("post-cat").value;
    const imgUrl  = document.getElementById("post-img").value.trim();

    if (!title)   { showPostMsg("Please enter a title.", "error");    return; }
    if (!toolUrl) { showPostMsg("Please enter the tool URL.", "error"); return; }

    const btn = document.getElementById("post-submit-btn");
    btn.disabled    = true;
    btn.textContent = "Sharing…";

    try {
        const res = await fetch(`${API}/api/posts`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
                title,
                tool_url:    toolUrl,
                description: desc   || null,
                category_id: catId  || null,
                image_url:   imgUrl || null
            })
        });

        const data = await res.json();

        if (!res.ok) {
            showPostMsg(data.error || "Could not create post.", "error");
            return;
        }

        showPostMsg("Link shared! ✓", "success");
        setTimeout(() => {
            closePostModal();
            loadPosts();
        }, 800);

    } catch {
        showPostMsg("Network error — please try again.", "error");
    } finally {
        btn.disabled    = false;
        btn.textContent = "Share Link";
    }
}

//SORT

function initSortTabs() {
    document.querySelectorAll(".sort-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            currentSort = btn.dataset.sort;
            document.querySelectorAll(".sort-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            loadPosts();
        });
    });
}

//LOGOUT

document.getElementById("logout-btn")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
});

//POST MODAL EVENTS

document.getElementById("open-post-modal")?.addEventListener("click", openPostModal);
document.getElementById("close-post-modal")?.addEventListener("click", closePostModal);

document.getElementById("post-modal-backdrop")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("post-modal-backdrop")) {
        closePostModal();
    }
});

document.getElementById("post-submit-btn")?.addEventListener("click", submitPost);

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePostModal();
});

//INIT

initAuthUI();
initSortTabs();
loadCategories();
loadCategoriesForModal();
loadPosts();