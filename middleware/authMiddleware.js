import {
    verify
} from "djwt";

const SECRET_KEY = "super_secret_key";

export async function authenticate(req) {

    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
        return null;
    }

    const token = authHeader.split(" ")[1];

    try {

        const payload = await verify(
            token,
            SECRET_KEY,
            "HS512"
        );

        return payload;

    } catch {
        return null;
    }
}