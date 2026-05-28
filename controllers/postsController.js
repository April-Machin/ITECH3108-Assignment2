import sql from "../config/database.js";

export async function getAllPosts(sort = "recent", userId = null) {

    const orderBy = sort === "top" ? "likes DESC, posts.created_at DESC" : "posts.created_at DESC";

    const hiddenFilter = userId
        ? `AND posts.post_id NOT IN (
               SELECT post_id FROM hidden_posts WHERE user_id = ${userId}
           )`
        : "";

    const result = await sql.unsafe(`
        SELECT
            posts.post_id,
            posts.title,
            posts.description,
            posts.tool_url,
            posts.image_url,
            posts.created_at,
            users.user_id,
            users.username,
            users.tech_points,
            categories.name AS category,

            COUNT(ratings.rating_id)
            FILTER (
                WHERE ratings.is_like = true
            ) AS likes,

            COUNT(ratings.rating_id)
            FILTER (
                WHERE ratings.is_like = false
            ) AS dislikes

        FROM posts

        JOIN users
            ON posts.user_id = users.user_id

        LEFT JOIN categories
            ON posts.category_id = categories.category_id

        LEFT JOIN ratings
            ON posts.post_id = ratings.post_id

        WHERE 1=1
        ${hiddenFilter}

        GROUP BY
            posts.post_id,
            users.user_id,
            users.username,
            users.tech_points,
            categories.name

        ORDER BY ${orderBy}
    `);

    return result;
}

export async function createPost(data, userId) {

    const result = await sql`
        INSERT INTO posts (
            user_id,
            category_id,
            title,
            description,
            tool_url,
            image_url
        )
        VALUES (
            ${userId},
            ${data.category_id || null},
            ${data.title},
            ${data.description || null},
            ${data.tool_url},
            ${data.image_url || null}
        )
        RETURNING *
    `;

    return result[0];
}

export async function getFavouritePosts(userId) {

    return await sql`
        SELECT
            posts.post_id,
            posts.title,
            posts.description,
            posts.tool_url,
            posts.image_url,
            posts.created_at,
            users.user_id,
            users.username,
            users.tech_points,
            categories.name AS category,

            COUNT(r2.rating_id)
            FILTER (WHERE r2.is_like = true) AS likes,

            COUNT(r2.rating_id)
            FILTER (WHERE r2.is_like = false) AS dislikes

        FROM posts

        JOIN ratings
            ON posts.post_id = ratings.post_id

        JOIN users
            ON posts.user_id = users.user_id

        LEFT JOIN categories
            ON posts.category_id = categories.category_id

        LEFT JOIN ratings r2
            ON posts.post_id = r2.post_id

        WHERE ratings.user_id = ${userId}
        AND ratings.is_like = true

        GROUP BY
            posts.post_id,
            users.user_id,
            users.username,
            users.tech_points,
            categories.name
    `;
}

export async function hidePost(userId, postId) {

    return await sql`
        INSERT INTO hidden_posts (
            user_id,
            post_id
        )
        VALUES (
            ${userId},
            ${postId}
        )
        ON CONFLICT (user_id, post_id) DO NOTHING
    `;
}

export async function getUserRatings(userId) {

    const result = await sql`
        SELECT post_id, is_like
        FROM ratings
        WHERE user_id = ${userId}
    `;

    // Return as a map: { postId: true/false }
    const map = {};
    for (const row of result) {
        map[row.post_id] = row.is_like;
    }
    return map;
}

export async function getCategories() {
    return await sql`SELECT * FROM categories ORDER BY name`;
}