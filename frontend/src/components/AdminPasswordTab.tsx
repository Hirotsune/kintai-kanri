import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  Chip
} from '@mui/material';
import { Add, Edit, Delete, Visibility, VisibilityOff } from '@mui/icons-material';
import { adminPasswordApi } from '../services/api';

interface AdminPassword {
  id: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AdminPasswordTab: React.FC = () => {
  const [adminPasswords, setAdminPasswords] = useState<AdminPassword[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPassword, setEditingPassword] = useState<AdminPassword | null>(null);
  const [formData, setFormData] = useState({
    password: '',
    password_confirmation: '',
    description: '',
    is_active: true
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadAdminPasswords();
  }, []);

  const loadAdminPasswords = async () => {
    try {
      setLoading(true);
      const data = await adminPasswordApi.getAll();
      setAdminPasswords(data);
    } catch (error) {
      console.error('パスワード一覧の取得に失敗:', error);
      setError('パスワード一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (password?: AdminPassword) => {
    if (password) {
      setEditingPassword(password);
      setFormData({
        password: '',
        password_confirmation: '',
        description: password.description,
        is_active: password.is_active
      });
    } else {
      setEditingPassword(null);
      setFormData({
        password: '',
        password_confirmation: '',
        description: '',
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPassword(null);
    setFormData({
      password: '',
      password_confirmation: '',
      description: '',
      is_active: true
    });
    setShowPassword(false);
  };

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      setError('説明を入力してください');
      return;
    }

    if (!editingPassword && (!formData.password || !formData.password_confirmation)) {
      setError('パスワードを入力してください');
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setError('パスワードが一致しません');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingPassword) {
        await adminPasswordApi.update(editingPassword.id, formData);
      } else {
        await adminPasswordApi.create(formData);
      }

      await loadAdminPasswords();
      handleCloseDialog();
    } catch (error: any) {
      console.error('パスワードの保存に失敗:', error);
      setError(error.response?.data?.errors?.join(', ') || 'パスワードの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const password = adminPasswords.find(p => p.id === id);
    const passwordDescription = password ? password.description : 'このパスワード';
    
    if (!window.confirm(`${passwordDescription}を削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
      return;
    }

    try {
      setLoading(true);
      await adminPasswordApi.delete(id);
      await loadAdminPasswords();
    } catch (error) {
      console.error('パスワードの削除に失敗:', error);
      setError('パスワードの削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">管理者パスワード管理</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{ fontSize: 'clamp(14px, 2.5vw, 16px)' }}
        >
          新規追加
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: 'clamp(14px, 2.5vw, 16px)', fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ fontSize: 'clamp(14px, 2.5vw, 16px)', fontWeight: 'bold' }}>説明</TableCell>
              <TableCell sx={{ fontSize: 'clamp(14px, 2.5vw, 16px)', fontWeight: 'bold' }}>状態</TableCell>
              <TableCell sx={{ fontSize: 'clamp(14px, 2.5vw, 16px)', fontWeight: 'bold' }}>作成日</TableCell>
              <TableCell sx={{ fontSize: 'clamp(14px, 2.5vw, 16px)', fontWeight: 'bold' }}>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {adminPasswords.map((password) => (
              <TableRow key={password.id}>
                <TableCell sx={{ fontSize: 'clamp(14px, 2.5vw, 16px)' }}>{password.id}</TableCell>
                <TableCell sx={{ fontSize: 'clamp(14px, 2.5vw, 16px)' }}>{password.description}</TableCell>
                <TableCell>
                  <Chip
                    label={password.is_active ? '有効' : '無効'}
                    color={password.is_active ? 'success' : 'default'}
                    size="small"
                    sx={{ fontSize: 'clamp(12px, 2vw, 14px)' }}
                  />
                </TableCell>
                <TableCell sx={{ fontSize: 'clamp(14px, 2.5vw, 16px)' }}>
                  {new Date(password.created_at).toLocaleDateString('ja-JP')}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleOpenDialog(password)}
                    size="small"
                    sx={{ fontSize: 'clamp(16px, 3vw, 20px)' }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(password.id)}
                    size="small"
                    color="error"
                    sx={{ fontSize: 'clamp(16px, 3vw, 20px)' }}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 'clamp(18px, 3.5vw, 24px)' }}>
          {editingPassword ? 'パスワード編集' : '新規パスワード追加'}
        </DialogTitle>
        <DialogContent>
          <form autoComplete="off" style={{ width: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              {/* ダミーフィールドでブラウザの自動保存を無効化 */}
              <input type="text" name="fake-username" style={{ display: 'none' }} autoComplete="username" />
              <input type="password" name="fake-password" style={{ display: 'none' }} autoComplete="current-password" />
              
              <TextField
              fullWidth
              label="説明"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: 'clamp(14px, 2.5vw, 16px)'
                },
                '& .MuiInputLabel-root': {
                  fontSize: 'clamp(14px, 2.5vw, 16px)'
                }
              }}
            />
            
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="パスワード"
              name="new-password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              autoComplete="new-password"
              inputProps={{
                autoComplete: 'new-password',
                autoCorrect: 'off',
                autoCapitalize: 'off',
                spellCheck: 'false',
                'data-form-type': 'other'
              }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: 'clamp(14px, 2.5vw, 16px)'
                },
                '& .MuiInputLabel-root': {
                  fontSize: 'clamp(14px, 2.5vw, 16px)'
                }
              }}
            />
            
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="パスワード確認"
              name="confirm-password"
              value={formData.password_confirmation}
              onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
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
                  fontSize: 'clamp(14px, 2.5vw, 16px)'
                },
                '& .MuiInputLabel-root': {
                  fontSize: 'clamp(14px, 2.5vw, 16px)'
                }
              }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="有効"
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontSize: 'clamp(14px, 2.5vw, 16px)'
                }
              }}
            />
            </Box>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={{ fontSize: 'clamp(14px, 2.5vw, 16px)' }}>
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{ fontSize: 'clamp(14px, 2.5vw, 16px)' }}
          >
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPasswordTab;
