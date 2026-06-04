import sql from "../db/database.js";

export async function getUserProfile(userId) {

    const result = await sql`
        SELECT
            user_id,
            username,
            email,
            bio,
            profile_image,
            tool_points,
            created_at
        FROM users
        WHERE user_id = ${userId}
    `;

    return result[0];
}

export async function getPublicProfile(userId) {

    // Returns profile without email — safe for public viewing
    const result = await sql`
        SELECT
            user_id,
            username,
            bio,
            profile_image,
            tool_points,
            created_at
        FROM users
        WHERE user_id = ${userId}
    `;

    return result[0];
}