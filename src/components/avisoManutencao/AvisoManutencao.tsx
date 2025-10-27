import React from 'react';
import { Alert, Box, Typography, Container } from '@mui/material';

interface AvisoManutencaoProps {
  show: boolean;
}

const AvisoManutencao: React.FC<AvisoManutencaoProps> = ({ show }) => {
  if (!show) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: '#fff3cd',
        borderBottom: '2px solid #ffc107',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        minHeight: '70px',
      }}
    >
      <Container maxWidth="lg" sx={{ py: 1 }}>
        <Alert 
          severity="warning"
          sx={{
            backgroundColor: 'transparent',
            border: 'none',
            '& .MuiAlert-icon': {
              fontSize: { xs: '1.5rem', sm: '2rem' },
              color: '#f57c00',
            },
            '& .MuiAlert-message': {
              width: '100%',
            },
            py: { xs: 1, sm: 2 },
          }}
        >
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 'bold', 
              mb: 0.5,
              fontSize: { xs: '1rem', sm: '1.25rem' },
              color: '#e65100',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            🚧 Sistema em Manutenção
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: { xs: '0.875rem', sm: '0.95rem' },
              color: '#bf6000',
            }}
          >
            O sistema está temporariamente em manutenção. Algumas funcionalidades podem estar indisponíveis.
            Agradecemos sua compreensão!
          </Typography>
        </Alert>
      </Container>
    </Box>
  );
};

export default AvisoManutencao;