import pool from "@/lib/db";
import { NextApiRequest, NextApiResponse } from "next";

interface DadosClientePfDB {
  nomeCliente: string;
  email: string;
  cpf: string;
  celular: string;
  dataNascimento: string;
  cep: string;
  endereco: string;
  casa: string;
  sexo: string;
  uf: string;
  cidade: string;
  instituicao: string;
  idUsuario: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const dados: DadosClientePfDB = req.body;
  console.log("🔸 Requisição recebida para cadastro no banco:", req.body);

  try {
    console.log("🔸 Inserindo cliente no banco de dados...");
    
    // Formatar data de nascimento para MySQL (YYYY-MM-DD)
    const formatarDataParaMySQL = (data: string): string => {
      const [dia, mes, ano] = data.split("/");
      return `${ano}-${mes}-${dia}`;
    };

    // Buscar ID da instituição pelo nome
    let idInstituicao = null;
    if (dados.instituicao) {
      const [instituicaoRows]: any = await pool.execute(
        "SELECT idInstituicao FROM tb_instituicao WHERE nomeInstituicao LIKE ?",
        [`%${dados.instituicao}%`]
      );
      
      if (instituicaoRows.length > 0) {
        idInstituicao = instituicaoRows[0].idInstituicao;
        console.log(`✅ Instituição encontrada: ${dados.instituicao} (ID: ${idInstituicao})`);
      } else {
        console.log(`⚠️ Instituição não encontrada: ${dados.instituicao}, usando null`);
      }
    }

    // Verificar se cliente já existe
    const [clienteExistente]: any = await pool.execute(
      "SELECT idCliente FROM tb_clientes WHERE cpf = ?",
      [dados.cpf.replace(/\D/g, "")]
    );

    let clienteId;

    if (clienteExistente.length > 0) {
      // Cliente já existe, atualizar dados
      clienteId = clienteExistente[0].idCliente;
      console.log(`✅ Cliente já existe com ID: ${clienteId}, atualizando dados...`);

      const updateClienteQuery = `
        UPDATE tb_clientes SET
          nome = ?, telefone = ?, email = ?, data_nascimento = ?,
          id_instituicao = ?, cep = ?
        WHERE idCliente = ?
      `;

      await pool.execute(updateClienteQuery, [
        dados.nomeCliente,
        dados.celular,
        dados.email,
        formatarDataParaMySQL(dados.dataNascimento),
        idInstituicao,
        dados.cep,
        clienteId
      ]);

      console.log("✅ Dados do cliente atualizados no banco!");

    } else {
      // Cliente não existe, inserir novo
      console.log("📝 Inserindo novo cliente no banco...");

      const insertClienteQuery = `
        INSERT INTO tb_clientes (
          nome, telefone, email, cpf, data_nascimento, 
          idClienteDependente, data_vinculo, creditos, senha, perfil, 
          id_instituicao, cep, registro_geral, primeiro_acesso, contrato_assinado,
          cadastroSulamerica
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [resultCliente] = await pool.execute(insertClienteQuery, [
        dados.nomeCliente,          // nome
        dados.celular,              // telefone
        dados.email,                // email
        dados.cpf.replace(/\D/g, ""), // cpf (apenas números)
        formatarDataParaMySQL(dados.dataNascimento), // data_nascimento
        null,                       // idClienteDependente
        new Date(),                 // data_vinculo (data atual)
        0,                          // creditos
        null,                       // senha
        'cliente',                  // perfil
        idInstituicao,              // id_instituicao
        dados.cep,                  // cep
        null,                       // registro_geral
        0,                          // primeiro_acesso (false)
  0,                          // contrato_assinado (false)
  0                           // cadastroSulamerica (false)
      ]);

      clienteId = (resultCliente as any).insertId;
      console.log("✅ Cliente inserido no banco com ID:", clienteId);
    }

    return res.status(200).json({
      success: true,
      message: "Cliente cadastrado no banco de dados com sucesso!",
      clienteId,
      cliente: {
        id: clienteId,
        nome: dados.nomeCliente,
        cpf: dados.cpf,
        email: dados.email,
        telefone: dados.celular,
        instituicao: dados.instituicao,
        idInstituicao
      }
    });

  } catch (error) {
    console.error("❌ Erro ao cadastrar cliente no banco:", error);
    return res.status(500).json({ 
      error: "Erro ao cadastrar cliente no banco de dados",
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
