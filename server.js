import { serve } from "https://deno.land/std/http/server.ts";

import {
    registerUser,
    loginUser,
    generateToken
} from "./controllers/authController.js";

import {
    getAllPosts,
    createPost,
    getFavouritePosts,
    hidePost,
    getUserRatings,
    getCategories,
    getMyPosts
} from "./controllers/postsController.js";

import {
    ratePost
} from "./controllers/ratingsController.js";

import {
    getUserProfile,
    getPublicProfile
} from "./controllers/usersController.js";

import {
    authenticate
} from "./middleware/authMiddleware.js";

import {
    getMyPosts as getUserPostsById
} from "./controllers/postsController.js";

const PORT = 8000;

const MIME_TYPES = {
    ".html": "text/html",
    ".css":  "text/css",
    ".js":   "application/javascript",
    ".json": "application/json",
    ".png":  "image/png",
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg":  "image/svg+xml",
    ".ico":  "image/x-icon",
};

const CORS_HEADERS = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(data, status = 200) {
    return Response.json(data, { status, headers: CORS_HEADERS });
}

async function serveStaticFile(pathname) {

    if (pathname === "/") pathname = "/frontpage.html";

    const filePath = `./public${pathname}`;

    try {
        const file = await Deno.readFile(filePath);
        const ext = pathname.substring(pathname.lastIndexOf("."));
        const contentType = MIME_TYPES[ext] || "application/octet-stream";
        return new Response(file, { headers: { "Content-Type": contentType } });
    } catch {
        return null;
    }
}

serve(async (req) => {

    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {

        // Register

        if (req.method === "POST" && url.pathname === "/api/auth/register") {
            const body = await req.json();
            const user = await registerUser(body);
            if (user.error) return jsonResponse(user, 400);
            return jsonResponse(user, 201);
        }

        // Login

        if (req.method === "POST" && url.pathname === "/api/auth/login") {
            const body = await req.json();
            const user = await loginUser(body);
            if (!user) return jsonResponse({ error: "Invalid credentials" }, 401);
            const token = await generateToken(user);
            return jsonResponse({ token, user });
        }

        // Get Posts

        if (req.method === "GET" && url.pathname === "/api/posts") {
            const sort   = url.searchParams.get("sort") || "recent";
            const user   = await authenticate(req);
            const userId = user ? user.userId : null;
            const posts  = await getAllPosts(sort, userId);
            return jsonResponse(posts);
        }

        // Create Posts

        if (req.method === "POST" && url.pathname === "/api/posts") {
            const user = await authenticate(req);
            if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
            const body = await req.json();
            if (!body.title || !body.tool_url) {
                return jsonResponse({ error: "Title and tool URL are required" }, 400);
            }
            const post = await createPost(body, user.userId);
            return jsonResponse(post, 201);
        }

        // Rate Posts

        if (req.method === "POST" && url.pathname === "/api/ratings") {
            const user = await authenticate(req);
            if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
            const body   = await req.json();
            const result = await ratePost(body.post_id, user.userId, body.is_like);
            if (result.error) return jsonResponse(result, 400);
            return jsonResponse(result);
        }

        // Hide Post

        if (req.method === "POST" && url.pathname === "/api/hide") {
            const user = await authenticate(req);
            if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
            const body = await req.json();
            await hidePost(user.userId, body.post_id);
            return jsonResponse({ message: "Post hidden" });
        }

        // Favourites

        if (req.method === "GET" && url.pathname === "/api/favourites") {
            const user = await authenticate(req);
            if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
            const posts = await getFavouritePosts(user.userId);
            return jsonResponse(posts);
        }

        // My Ratings

        if (req.method === "GET" && url.pathname === "/api/my-ratings") {
            const user = await authenticate(req);
            if (!user) return jsonResponse({});
            const ratings = await getUserRatings(user.userId);
            return jsonResponse(ratings);
        }

        // My Posts

        if (req.method === "GET" && url.pathname === "/api/my-posts") {
            const user = await authenticate(req);
            if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
            const posts = await getMyPosts(user.userId);
            return jsonResponse(posts);
        }

        // Catagories

        if (req.method === "GET" && url.pathname === "/api/categories") {
            const cats = await getCategories();
            return jsonResponse(cats);
        }

        // Own Profile (authenticated)

        if (req.method === "GET" && url.pathname === "/api/profile") {
            const user = await authenticate(req);
            if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
            const profile = await getUserProfile(user.userId);
            return jsonResponse(profile);
        }

        // Public Profile

        const userMatch = url.pathname.match(/^\/api\/users\/(\d+)$/);
        if (req.method === "GET" && userMatch) {
            const targetId = parseInt(userMatch[1]);
            const profile  = await getPublicProfile(targetId);
            if (!profile) return jsonResponse({ error: "User not found" }, 404);
            return jsonResponse(profile);
        }

        // User's Posts For profile

        const userPostsMatch = url.pathname.match(/^\/api\/users\/(\d+)\/posts$/);
        if (req.method === "GET" && userPostsMatch) {
            const targetId = parseInt(userPostsMatch[1]);
            const posts    = await getUserPostsById(targetId);
            return jsonResponse(posts);
        }

        // Static Files

        if (req.method === "GET") {
            const staticResponse = await serveStaticFile(url.pathname);
            if (staticResponse) return staticResponse;
        }

        return new Response("Not Found", { status: 404, headers: CORS_HEADERS });

    } catch (error) {
        console.error(error);
        return jsonResponse({ error: "Internal server error" }, 500);
    }

}, { port: PORT });

console.log(`Server running on http://localhost:${PORT}`);