import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST, 
  user: process.env.DB_USER, 
  password: process.env.DB_PASS, 
  database: process.env.DB_NAME,
  // Configurações para otimizar o uso de conexões
  connectionLimit: 8, // Limita a 8 conexões simultâneas (bem abaixo do limite de 25)
  queueLimit: 0, // Sem limite na fila de espera
});

// Função helper para executar queries com melhor gerenciamento de conexões
export const executeQuery = async (query: string, params: any[] = []) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.execute(query, params);
    return result;
  } catch (error) {
    console.error('Erro na query:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release(); // Sempre libera a conexão de volta ao pool
    }
  }
};

export default pool;
