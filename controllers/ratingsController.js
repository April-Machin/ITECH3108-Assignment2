import sql from "../config/database.js";

export async function ratePost(
    postId,
    userId,
    isLike
) {

    const existingRating = await sql`
        SELECT *
        FROM ratings
        WHERE post_id = ${postId}
        AND user_id = ${userId}
    `;

    if (existingRating.length > 0) {

        return {
            error: "User already rated this post"
        };
    }

    await sql`
        INSERT INTO ratings (
            post_id,
            user_id,
            is_like
        )
        VALUES (
            ${postId},
            ${userId},
            ${isLike}
        )
    `;

    const postOwner = await sql`
        SELECT user_id
        FROM posts
        WHERE post_id = ${postId}
    `;

    const ownerId = postOwner[0].user_id;

    if (isLike) {

        await sql`
            UPDATE users
            SET tech_points = tech_points + 1
            WHERE user_id = ${ownerId}
        `;

    } else {

        await sql`
            UPDATE users
            SET tech_points = tech_points - 1
            WHERE user_id = ${ownerId}
        `;
    }

    return {
        message: "Rating added"
    };
}