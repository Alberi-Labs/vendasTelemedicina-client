import React from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import BadgeIcon from '@mui/icons-material/Badge';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CancelIcon from '@mui/icons-material/Cancel';
import Stack from '@mui/material/Stack';

export interface ActionButtonsProps {
  onView: () => void;
  onEdit: () => void;
  onCharges: () => void;
  onCarteirinha: () => void;
  onCancel?: () => void;
  size?: 'small' | 'medium';
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onView, onEdit, onCharges, onCarteirinha, onCancel, size='small' }) => {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Tooltip title="Editar">
        <IconButton size={size} color="info" onClick={onEdit}>
          <EditIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Cobranças">
        <IconButton size={size} color="secondary" onClick={onCharges}>
          <ReceiptLongIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Gerar Carteirinha">
        <IconButton size={size} color="success" onClick={onCarteirinha}>
          <BadgeIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
      {onCancel && (
        <Tooltip title="Cancelar Assinatura">
          <IconButton size={size} color="error" onClick={onCancel}>
            <CancelIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
};
