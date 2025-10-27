"use client";
import { createContext, useContext, useState, useEffect } from "react";

interface AtendimentoContextType {
  nome: string;
  cpf: string;
  telefone: string;
  nascimento: string;
  email: string;
  sintomas: string;
  setDados: (dados: Partial<Omit<AtendimentoContextType, "setDados">>) => void;
}

const AtendimentoContext = createContext<AtendimentoContextType | undefined>(undefined);

export function AtendimentoProvider({ children }: { children: React.ReactNode }) {
  const [dados, setDados] = useState<Omit<AtendimentoContextType, "setDados">>({
    nome: "",
    cpf: "",
    telefone: "",
    nascimento: "",
    email: "",
    sintomas: "",
  });

  useEffect(() => {
    const storedDados = localStorage.getItem("dadosAtendimento");
    if (storedDados) {
      setDados(JSON.parse(storedDados));
    }
  }, []);

  const atualizarDados = (novosDados: Partial<Omit<AtendimentoContextType, "setDados">>) => {
    setDados((prev) => {
      const updatedData = { ...prev, ...novosDados };
      localStorage.setItem("dadosAtendimento", JSON.stringify(updatedData)); 
      return updatedData;
    });
  };

  return (
    <AtendimentoContext.Provider value={{ ...dados, setDados: atualizarDados }}>
      {children}
    </AtendimentoContext.Provider>
  );
}

export function useAtendimento() {
  const context = useContext(AtendimentoContext);
  if (!context) {
    throw new Error("useAtendimento deve ser usado dentro de AtendimentoProvider");
  }
  return context;
}