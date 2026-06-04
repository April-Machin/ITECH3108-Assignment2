import postgres from "postgres";

const sql = postgres({
    host: "localhost",
    port: 5432,
    database: "ITECH3108_30438140_a2",
    username: "itech3108",
    password: "itech3108pass"
});

export default sql;