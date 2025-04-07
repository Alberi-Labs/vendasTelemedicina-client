// pages/api/usuarios/buscarUsuario.ts
import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

// Interface do usuário
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  perfil: string;
  imagem: string | null;
  cpf: string;
  creditos: number | null;
  data_nascimento: string | null;
  id_empresa: number;
  criado_em: string;
  plano_telemedicina: boolean | number;
  cep: string | null;
  endereco: string | null;
  uf: string | null;
  cidade: string | null;
  sexo: string | null;
}


const formatarDataParaBrasileiro = (data: string | null) => {
  if (!data) return null;
  const dataObj = new Date(data);
  return dataObj.toLocaleDateString("pt-BR");
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    const { idUsuario } = req.query;
    let query = "SELECT * FROM tb_usuarios";
    const params: any[] = [];

    if (idUsuario) {
      query += " WHERE idUsuario = ?";
    }

    const [rows]: any = await pool.query(query, params);

    if (idUsuario && rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const usuarios: Usuario[] = rows.map((u: any) => ({
      id: u.idUsuario,
      nome: u.nome,
      email: u.email,
      telefone: u.telefone,
      perfil: u.perfil,
      imagem: u.imagem,
      cpf: u.cpf,
      creditos: u.creditos,
      data_nascimento: formatarDataParaBrasileiro(u.data_nascimento),
      id_empresa: u.id_empresa,
      criado_em: formatarDataParaBrasileiro(u.criado_em),
      plano_telemedicina: !!u.plano_telemedicina,
      cep: u.cep,
      endereco: u.endereco,
      uf: u.uf,
      cidade: u.cidade,
      sexo: u.sexo
    }));
    
    return res.status(200).json({ success: true, usuarios });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return res.status(500).json({ message: "Erro interno no servidor" });
  }
}
