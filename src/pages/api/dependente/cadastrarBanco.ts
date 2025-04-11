import pool from "@/lib/db";

export async function consultarDependente() {
  const [rows]: any = await pool.query(`
    SELECT nome, cpf, data_nascimento
    FROM tb_vidas
    WHERE titular = 1 AND idVida NOT IN (
      SELECT id_titular FROM tb_dependentes GROUP BY id_titular HAVING COUNT(*) >= 3
    )
    LIMIT 1
  `);

  if (rows.length === 0) {
    throw new Error("Nenhum titular elegível encontrado.");
  }

  return rows[0]; // { nome, cpf, data_nascimento }
}
