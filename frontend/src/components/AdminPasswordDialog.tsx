import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { adminPasswordApi } from '../services/api';

interface AdminPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AdminPasswordDialog: React.FC<AdminPasswordDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password.trim()) {
      setError('パスワードを入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 管理者画面では管理者専用パスワード（3441）のみをチェック
      if (password === '3441') {
        setPassword('');
        onSuccess();
      } else {
        setError('管理者専用パスワードが正しくありません');
      }
    } catch (error: any) {
      console.error('認証エラー:', error);
      setError('認証に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError(null);
    onClose();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          padding: '20px'
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          認証
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        <form autoComplete="off" style={{ width: '100%' }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
              アクセスするにはパスワードが必要です
            </Typography>
            
            {/* ダミーフィールドでブラウザの自動保存を無効化 */}
            <input type="text" name="fake-username" style={{ display: 'none' }} autoComplete="username" />
            <input type="password" name="fake-password" style={{ display: 'none' }} autoComplete="current-password" />
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <TextField
            fullWidth
            type="password"
            label="パスワード"
            name="admin-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            autoFocus
            autoComplete="new-password"
            inputProps={{
              autoComplete: 'new-password',
              autoCorrect: 'off',
              autoCapitalize: 'off',
              spellCheck: 'false',
              'data-form-type': 'other'
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: 'clamp(16px, 3vw, 20px)',
                '& input': {
                  padding: '16px 14px'
                }
              },
              '& .MuiInputLabel-root': {
                fontSize: 'clamp(14px, 2.5vw, 16px)'
              }
            }}
          />
          </Box>
        </form>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'center', gap: 2, pt: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          sx={{
            minWidth: '120px',
            fontSize: 'clamp(14px, 2.5vw, 16px)',
            py: 1.5
          }}
        >
          キャンセル
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || !password.trim()}
          variant="contained"
          sx={{
            minWidth: '120px',
            fontSize: 'clamp(14px, 2.5vw, 16px)',
            py: 1.5
          }}
        >
          {loading ? '認証中...' : '認証'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminPasswordDialog;
