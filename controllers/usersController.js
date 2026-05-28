import sql from "../config/database.js";

export async function getUserProfile(userId) {

    const result = await sql`
        SELECT
            user_id,
            username,
            email,
            bio,
            profile_image,
            tech_points,
            created_at

        FROM users

        WHERE user_id = ${userId}
    `;

    return result[0];
}
