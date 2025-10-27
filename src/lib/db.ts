import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST, 
  user: process.env.DB_USER, 
  password: process.env.DB_PASS, 
  database: process.env.DB_NAME,
  connectionLimit: 4,
  queueLimit: 0, 
});

export default pool;
