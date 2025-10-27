import React from "react";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface TelaCarregamentoProps {
  mensagem?: string;
}

const TelaCarregamento: React.FC<TelaCarregamentoProps> = ({ mensagem = "Carregando..." }) => {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <CircularProgress />
      <Typography
        variant="h6"
        color="white"
        sx={{ marginTop: 2, textAlign: "center" }}
      >
        {mensagem}
      </Typography>
    </Box>
  );
};

export default TelaCarregamento;
