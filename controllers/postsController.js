import sql from "../config/database.js";

export async function getAllPosts(sort = "recent") {

    let orderBy = "posts.created_at DESC";

    if (sort === "top") {
        orderBy = "likes DESC";
    }

    const result = await sql.unsafe(`
        SELECT
            posts.post_id,
            posts.title,
            posts.description,
            posts.tool_url,
            posts.image_url,
            posts.created_at,
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

        GROUP BY
            posts.post_id,
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
            ${data.category_id},
            ${data.title},
            ${data.description},
            ${data.tool_url},
            ${data.image_url}
        )
        RETURNING *
    `;

    return result[0];
}

export async function getFavouritePosts(userId) {

    return await sql`
        SELECT
            posts.*,
            users.username

        FROM posts

        JOIN ratings
            ON posts.post_id = ratings.post_id

        JOIN users
            ON posts.user_id = users.user_id

        WHERE ratings.user_id = ${userId}
        AND ratings.is_like = true
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
    `;
}
