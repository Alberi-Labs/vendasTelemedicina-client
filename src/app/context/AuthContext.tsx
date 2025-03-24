import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";

interface User {
  id: number;
  nome: string;
  role: string;
  id_empresa: number;
}


interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthLoaded: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false); 

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user"); 

    if (token && storedUser) {
      try {
        const decodedUser = JSON.parse(storedUser); 
        setUser(decodedUser);
      } catch (error) {
        console.error("Erro ao recuperar usuário do localStorage:", error);
        logout();
      }
    }

    setIsAuthLoaded(true); 
  }, []);

  const login = (token: string) => {
    try {
      localStorage.setItem("token", token);
      const decodedUser = jwtDecode<User>(token);
      localStorage.setItem("user", JSON.stringify(decodedUser)); 
      setUser(decodedUser);
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user"); 
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthLoaded }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
