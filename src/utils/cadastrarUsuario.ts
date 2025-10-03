export const cadastrarOuAtualizarUsuario = async ({
  nome,
  cpf,
  data_nascimento,
  email,
  senha,
  telefone,
}: {
  nome: string;
  cpf: string;
  data_nascimento: string;
  senha: string;
  email: string;
  telefone: string;
}) => {
  try {
    const response = await fetch("/api/usuario/cadastrarClienteUsuario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        cpf,
        data_nascimento, 
        email,
        senha,
        telefone,
      }),
    });

    const resultado = await response.json();

    // ✅ Retorna o objeto do usuário completo com id
    return resultado.usuario;
  } catch (error) {
    return { error: "Erro ao cadastrar ou atualizar usuário." };
  }
};
