import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";

// 🔹 Interface para os dados do usuário logado
interface User {
  id: number;
  nome: string;
  role: string;
}

// 🔹 Interface do contexto de autenticação
interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthLoaded: boolean; // Novo estado para saber se a autenticação foi carregada
}

// 🔹 Criando o contexto de autenticação
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false); // Estado para verificar se a autenticação foi carregada

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user"); // ✅ Busca os dados do usuário no localStorage

    if (token && storedUser) {
      try {
        const decodedUser = JSON.parse(storedUser); // ✅ Recupera os dados salvos
        setUser(decodedUser);
      } catch (error) {
        console.error("Erro ao recuperar usuário do localStorage:", error);
        logout();
      }
    }

    setIsAuthLoaded(true); // Marca que a autenticação foi carregada
  }, []);

  const login = (token: string) => {
    try {
      localStorage.setItem("token", token);
      const decodedUser = jwtDecode<User>(token);
      console.log("✅ Usuário logado:", decodedUser.nome);
      localStorage.setItem("user", JSON.stringify(decodedUser)); // ✅ Salva os dados completos no localStorage
      setUser(decodedUser);
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
    }
  };

  // 🚪 Função para logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user"); // ✅ Remove os dados do usuário ao deslogar
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthLoaded }}>
      {children}
    </AuthContext.Provider>
  );
};

// 🔹 Hook para acessar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
