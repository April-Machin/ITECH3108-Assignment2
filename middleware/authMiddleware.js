import {
    verify
} from "djwt";

const SECRET_KEY = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode("super_secret_key"),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign", "verify"]
);

export async function authenticate(req) {

    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
        return null;
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = await verify(token, SECRET_KEY);    
        return payload;

    } catch {
        return null;
    }
}