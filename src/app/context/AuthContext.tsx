import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { Cobranca } from "@/types/dadosSaudeECor";

export interface User {
  dsc_email: string | undefined;
  id?: number;
  nome: string;
  role: string;
  id_empresa?: number;
  cpf?: string;
  telefone?: string;
  num_celular: string | undefined;
  email?: string;
  saude_cor?: boolean;
  dt_nascimento?: string;
  data_contrato_vigencia_inicio?: string;
  data_contrato_vigencia_final?: string;
  num_contrato_retorno_apolice?: string;
  num_contrato_retorno_certificado?: string;
  cod_contrato_retorno_operacao?: string;
  dsc_instituicao?: string;
  tip_pagamento?: string;
  imagem_empresa?: string;
  cobrancas?: Cobranca[];
  dsc_link_pagamento?: string;
  ind_status_pagamento?: string;
  tip_status_pagamento?: string;
}

interface AuthContextType {
  user: User | null;
  login: (tokenOrUserData: string | User, isCliente?: boolean) => void;
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

  const login = (tokenOrUserData: string | User, isCliente: boolean = false) => {
    try {
      if (isCliente && typeof tokenOrUserData !== "string") {
        localStorage.setItem("user", JSON.stringify(tokenOrUserData));
        setUser(tokenOrUserData);
      } else if (!isCliente && typeof tokenOrUserData === "string") {
        localStorage.setItem("token", tokenOrUserData);
        const decodedUser = jwtDecode<User>(tokenOrUserData);
        localStorage.setItem("user", JSON.stringify(decodedUser));
        setUser(decodedUser);
      } else {
        throw new Error("Formato de login inválido.");
      }
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
