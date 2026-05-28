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
    hidePost
} from "./controllers/postsController.js";

import {
    ratePost
} from "./controllers/ratingsController.js";

import {
    getUserProfile
} from "./controllers/usersController.js";

import {
    authenticate
} from "./middleware/authMiddleware.js";

const PORT = 8000;

serve(async (req) => {

    const url = new URL(req.url);

    try {

        // =========================
        // REGISTER
        // =========================

        if (
            req.method === "POST" &&
            url.pathname === "/api/auth/register"
        ) {

            const body = await req.json();

            const user = await registerUser(body);

            if (user.error) {

                return Response.json(user, {
                    status: 400
                });
            }

            return Response.json(user, {
                status: 201
            });
        }

        // =========================
        // LOGIN
        // =========================

        if (
            req.method === "POST" &&
            url.pathname === "/api/auth/login"
        ) {

            const body = await req.json();

            const user = await loginUser(body);

            if (!user) {

                return Response.json({
                    error: "Invalid credentials"
                }, {
                    status: 401
                });
            }

            const token = await generateToken(user);

            return Response.json({
                token,
                user
            });
        }

        // =========================
        // GET POSTS
        // =========================

        if (
            req.method === "GET" &&
            url.pathname === "/api/posts"
        ) {

            const sort = url.searchParams.get("sort") || "recent";

            const posts = await getAllPosts(sort);

            return Response.json(posts);
        }

        // =========================
        // CREATE POST
        // =========================

        if (
            req.method === "POST" &&
            url.pathname === "/api/posts"
        ) {

            const user = await authenticate(req);

            if (!user) {

                return Response.json({
                    error: "Unauthorized"
                }, {
                    status: 401
                });
            }

            const body = await req.json();

            const post = await createPost(
                body,
                user.userId
            );

            return Response.json(post, {
                status: 201
            });
        }

        // =========================
        // RATE POST
        // =========================

        if (
            req.method === "POST" &&
            url.pathname === "/api/ratings"
        ) {

            const user = await authenticate(req);

            if (!user) {

                return Response.json({
                    error: "Unauthorized"
                }, {
                    status: 401
                });
            }

            const body = await req.json();

            const result = await ratePost(
                body.post_id,
                user.userId,
                body.is_like
            );

            if (result.error) {

                return Response.json(result, {
                    status: 400
                });
            }

            return Response.json(result);
        }

        // =========================
        // HIDE POST
        // =========================

        if (
            req.method === "POST" &&
            url.pathname === "/api/hide"
        ) {

            const user = await authenticate(req);

            if (!user) {

                return Response.json({
                    error: "Unauthorized"
                }, {
                    status: 401
                });
            }

            const body = await req.json();

            await hidePost(
                user.userId,
                body.post_id
            );

            return Response.json({
                message: "Post hidden"
            });
        }

        // =========================
        // FAVOURITES
        // =========================

        if (
            req.method === "GET" &&
            url.pathname === "/api/favourites"
        ) {

            const user = await authenticate(req);

            if (!user) {

                return Response.json({
                    error: "Unauthorized"
                }, {
                    status: 401
                });
            }

            const posts = await getFavouritePosts(
                user.userId
            );

            return Response.json(posts);
        }

        // =========================
        // USER PROFILE
        // =========================

        if (
            req.method === "GET" &&
            url.pathname === "/api/profile"
        ) {

            const user = await authenticate(req);

            if (!user) {

                return Response.json({
                    error: "Unauthorized"
                }, {
                    status: 401
                });
            }

            const profile = await getUserProfile(
                user.userId
            );

            return Response.json(profile);
        }

        return new Response("Not Found", {
            status: 404
        });

    } catch (error) {

        console.log(error);

        return Response.json({
            error: "Internal server error"
        }, {
            status: 500
        });
    }

}, { port: PORT });

console.log(`Server running on http://localhost:${PORT}`);
