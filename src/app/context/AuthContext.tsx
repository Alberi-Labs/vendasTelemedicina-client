import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { jwtDecode } from "jwt-decode"; // Biblioteca para decodificar JWT

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
}

// 🔹 Criando o contexto de autenticação
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🔹 Provider do contexto
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 🔍 Verifica se há um token salvo no localStorage ao carregar a página
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedUser = jwtDecode<User>(token);
        setUser(decodedUser);
      } catch (error) {
        console.error("Erro ao decodificar o token:", error);
        logout();
      }
    }
  }, []);

  // 🔑 Função para salvar o usuário no contexto e localStorage
  const login = (token: string) => {
    localStorage.setItem("token", token);
    const decodedUser = jwtDecode<User>(token);
    setUser(decodedUser);
  };

  // 🚪 Função para logout
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
