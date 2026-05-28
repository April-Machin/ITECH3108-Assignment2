import sql from "../config/database.js";

import {
    hash,
    compare
} from "bcrypt";

import {
    create,
    getNumericDate
} from "djwt";

const SECRET_KEY = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode("super_secret_key"),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign", "verify"]
);

export async function registerUser(data) {

    const existingUser = await sql`
        SELECT *
        FROM users
        WHERE email = ${data.email}
        OR username = ${data.username}
    `;

    if (existingUser.length > 0) {

        return {
            error: "User already exists"
        };
    }

    const passwordHash = await hash(data.password);

    const result = await sql`
        INSERT INTO users (
            username,
            email,
            password_hash
        )
        VALUES (
            ${data.username},
            ${data.email},
            ${passwordHash}
        )
        RETURNING user_id, username, email
    `;

    return result[0];
}

export async function loginUser(data) {

    const users = await sql`
        SELECT *
        FROM users
        WHERE email = ${data.email}
    `;

    const user = users[0];

    if (!user) {
        return null;
    }

    const passwordMatch = await compare(
        data.password,
        user.password_hash
    );

    if (!passwordMatch) {
        return null;
    }

    return {
        user_id: user.user_id,
        username: user.username,
        email: user.email
    };
}

export async function generateToken(user) {

    return await create(
        {
            alg: "HS512",
            typ: "JWT"
        },
        {
            userId: user.user_id,
            username: user.username,
            exp: getNumericDate(60 * 60 * 24)
        },
        SECRET_KEY
    );
}
