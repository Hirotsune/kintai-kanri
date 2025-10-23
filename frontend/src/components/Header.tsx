import React from 'react';
import { Typography, Box } from '@mui/material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = '三好食品管理システムメニュー' }) => {
  return (
    <Box sx={{ 
      backgroundColor: '#003366',
      color: 'white',
      padding: '8px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '40px'
    }}>
      <Typography variant="h6" sx={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: '16px', fontWeight: 'normal' }}>
        {new Date().toLocaleDateString('ja-JP', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          weekday: 'short'
        })}
      </Typography>
    </Box>
  );
};

export default Header;