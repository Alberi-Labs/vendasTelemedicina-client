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
  isAuthLoaded: boolean; // Novo estado para saber se o token já foi verificado
}

// 🔹 Criando o contexto de autenticação
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🔹 Provider do contexto
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false); // Estado para verificar se a autenticação foi carregada

  useEffect(() => {
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

    setIsAuthLoaded(true); // Marca que a autenticação foi carregada
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
