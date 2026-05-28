import sql from "../config/database.js";

try {
    const result = await sql`SELECT NOW()`;

    console.log("Database connected");
    console.log(result);

} catch (error) {
    console.log("Database connection failed");
    console.log(error);
}