import pool from "@/lib/db";

interface ConsultaDependenteParams {
  idTitular?: number;
  cpfTitular?: string;
}

export async function consultarDependente({ idTitular, cpfTitular }: ConsultaDependenteParams) {
  if (!idTitular && !cpfTitular) {
    throw new Error("É necessário informar o idTitular ou cpfTitular.");
  }

  let query = `
    SELECT d.idDependente, d.nome, d.cpf, d.dt_nascimento
    FROM tb_dependentes d
    JOIN tb_clientes c ON d.id_titular = c.idCliente
  `;
  const params: any[] = [];

  if (idTitular) {
    query += ` WHERE d.id_titular = ?`;
    params.push(idTitular);
  } else if (cpfTitular) {
    query += ` WHERE c.cpf = ?`;
    params.push(cpfTitular);
  }

  const [rows]: any = await pool.query(query, params);

  return rows; // array de dependentes
}
