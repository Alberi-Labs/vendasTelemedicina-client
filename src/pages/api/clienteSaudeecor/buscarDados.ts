// pages/api/clienteSaudeecor/buscarDados.ts

import { NextApiRequest, NextApiResponse } from "next";
import pool from "../../../lib/db";

const SaudeECorURL = process.env.SAUDE_E_COR_URL;
const SaudeECorURLPJ = process.env.SAUDE_E_COR_URL_PJ;
const authToken = process.env.SAUDE_E_COR_TOKEN;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido. Use POST." });
  }

  const { cpf } = req.body;

  if (!cpf) {
    return res.status(400).json({ message: "CPF ou CNPJ é obrigatório." });
  }

  const docNumeros = cpf.replace(/\D/g, "");
  const isCPF = docNumeros.length === 11;
  const endpoint = isCPF ? SaudeECorURL : SaudeECorURLPJ;

  const payload = isCPF
    ? {
        app: "backend",
        user: "1",
        auth_token: authToken,
        cpf: docNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
      }
    : {
        app: "backend",
        user: "1",
        auth_token: authToken,
        cnpj: docNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5"),
      };

  try {

    const response = await fetch(endpoint as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ message: "Erro na requisição externa", error: errorText });
    }

    const data = await response.json();
    
    // Verifica se os dados retornados estão vazios
    const isEmpty = !data || (Array.isArray(data) && data.length === 0) || (typeof data === "object" && Object.keys(data).length === 0);
    if (isEmpty) {
      return res.status(404).json({
        message: "Cliente não encontrado na base de dados, por favor contate o suporte.",
      });
    }

    // Se os dados foram encontrados na API, verificar no banco de dados
    if (Array.isArray(data) && data.length > 0) {
      const clienteData = data[0]; // Pega o primeiro cliente dos dados retornados
      const clienteBanco = await verificarOuCriarCliente(clienteData);
      
      // Adicionar informações do banco aos dados da API
      if (clienteBanco) {
        data[0] = {
          ...data[0],
          contrato_assinado: clienteBanco.contrato_assinado,
          primeiro_acesso: clienteBanco.primeiro_acesso
        };
      }
    }

    return res.status(200).json(data);

  } catch (error: any) {
    return res.status(500).json({ message: "Erro ao buscar os dados", error: error.message });
  }
}

// Função para verificar se o cliente existe no banco ou criá-lo
async function verificarOuCriarCliente(clienteData: any) {
  try {
    const cpfLimpo = clienteData.num_cpf.replace(/\D/g, "");
    
    // Verificar se o cliente já existe no banco
    const [rows]: any = await pool.execute(
      "SELECT idCliente, primeiro_acesso, contrato_assinado FROM tb_clientes WHERE cpf = ?",
      [cpfLimpo]
    );

    if (rows.length > 0) {
      // Cliente já existe, verificar primeiro acesso
      const cliente = rows[0];
      if (!cliente.primeiro_acesso) {
        
        // Atualizar para marcar que já fez o primeiro acesso
        await pool.execute(
          "UPDATE tb_clientes SET primeiro_acesso = ? WHERE idCliente = ?",
          [1, cliente.idCliente]
        );
        
        return {
          ...cliente,
          primeiro_acesso: 1
        };
      }
      
      return cliente;
    } else {
      
      // Extrair data de nascimento se disponível nos dados da API
      let dataNascimento = null;
      if (clienteData.dat_nascimento) {
        dataNascimento = clienteData.dat_nascimento;
      }

      // Buscar o ID da instituição pelo nome
      let idInstituicao = null;
      if (clienteData.dsc_instituicao) {
        const [instituicaoRows]: any = await pool.execute(
          "SELECT idInstituicao FROM tb_instituicao WHERE nomeInstituicao LIKE ?",
          [`%${clienteData.dsc_instituicao}%`]
        );
        
        if (instituicaoRows.length > 0) {
          idInstituicao = instituicaoRows[0].idInstituicao;
        }
      }

      await pool.execute(
        `INSERT INTO tb_clientes (
          nome, telefone, email, cpf, data_nascimento, 
          idClienteDependente, data_vinculo, creditos, senha, perfil, 
          id_instituicao, cep, registro_geral, primeiro_acesso, contrato_assinado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          clienteData.nom_cliente,
          clienteData.num_celular,
          clienteData.dsc_email,
          cpfLimpo,
          dataNascimento,
          null, // idClienteDependente
          new Date(), // data_vinculo - data atual
          0, // creditos
          null, // senha
          'cliente', // perfil
          idInstituicao, // ID da instituição encontrada ou null
          null, // cep
          null, // registro_geral
          0, // primeiro_acesso = false (0)
          0  // contrato_assinado = false (0)
        ]
      );
      
      
      return {
        primeiro_acesso: 0,
        contrato_assinado: 0
      };
    }
  } catch (error) {
    console.error("Erro ao verificar/criar cliente:", error);
    return null;
  }
}
