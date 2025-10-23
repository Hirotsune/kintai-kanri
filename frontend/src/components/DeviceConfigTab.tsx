import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem,
  Checkbox, FormControlLabel, Grid, Card, CardContent, CardHeader, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, IconButton
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { deviceConfigApi, lineApi } from '../services/api';

interface DeviceConfig {
  id?: number;
  device_id: string;
  device_name: string;
  device_type: 'kiosk' | 'admin' | 'mobile';
  location: string;
  show_factory_selection: boolean;
  show_line_selection: boolean;
  punch_buttons: string[];
  line_ids: number[];
}

interface Line {
  id: number;
  name: string;
  factory_id: string;
}

const DeviceConfigTab: React.FC = () => {
  const [configs, setConfigs] = useState<DeviceConfig[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [editingConfig, setEditingConfig] = useState<DeviceConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showDefaultConfig, setShowDefaultConfig] = useState(true);

  const punchButtonOptions = [
    { value: '出社', label: '出社' },
    { value: '昼休出1', label: '昼休出1' },
    { value: '昼休入1', label: '昼休入1' },
    { value: '昼休出2', label: '昼休出2' },
    { value: '昼休入2', label: '昼休入2' },
    { value: '退社', label: '退社' }
  ];

  const deviceTypeOptions = [
    { value: 'kiosk', label: 'キオスク端末' },
    { value: 'admin', label: '管理用端末' },
    { value: 'mobile', label: 'モバイル端末' }
  ];

  useEffect(() => {
    loadConfigs();
    loadLines();
  }, []);

  const loadConfigs = async () => {
    try {
      const data = await deviceConfigApi.getAll();
      
      // DEFAULT設定がデータベースに存在するかチェック
      const defaultConfigExists = data.some((config: DeviceConfig) => config.device_id === 'DEFAULT');
      
      if (!defaultConfigExists && showDefaultConfig) {
        // DEFAULT設定が存在しない場合は作成
        const defaultConfig: DeviceConfig = {
          device_id: 'DEFAULT',
          device_name: 'DEFAULT (デフォルト)',
          device_type: 'kiosk',
          location: '未設定',
          show_factory_selection: true,
          show_line_selection: true,
          punch_buttons: ['出社', '退社', '昼休出1', '昼休入1', '昼休出2', '昼休入2'],
          line_ids: []
        };
        
        try {
          await deviceConfigApi.create(defaultConfig);
          // 作成後に再読み込み
          const updatedData = await deviceConfigApi.getAll();
          setConfigs(updatedData);
          return;
        } catch (error) {
          console.error('DEFAULT設定の作成に失敗:', error);
        }
      }
      
      setConfigs(data);
    } catch (error) {
      console.error('設定の読み込みに失敗:', error);
      setMessage({ type: 'error', text: '設定の読み込みに失敗しました' });
    }
  };

  const loadLines = async () => {
    try {
      const data = await lineApi.getAll();
      setLines(data);
    } catch (error) {
      console.error('ラインの読み込みに失敗:', error);
    }
  };

  const handleSave = async (config: DeviceConfig) => {
    setLoading(true);
    try {
      // DEFAULT設定の場合はデータベースに保存
      if (config.device_id === 'DEFAULT') {
        try {
          // 既存のDEFAULT設定を更新
          await deviceConfigApi.update('DEFAULT', config);
          setMessage({ type: 'success', text: 'DEFAULT設定を保存しました' });
        } catch (error: any) {
          if (error.response?.status === 404) {
            // DEFAULT設定が存在しない場合は新規作成
            await deviceConfigApi.create(config);
            setMessage({ type: 'success', text: 'DEFAULT設定を作成しました' });
          } else {
            throw error;
          }
        }
        setEditingConfig(null);
        // 設定を再読み込み
        await loadConfigs();
        return;
      }
      
      if (config.id) {
        await deviceConfigApi.update(config.device_id, config);
      } else {
        await deviceConfigApi.create(config);
      }
      
      await loadConfigs();
      setEditingConfig(null);
      setMessage({ type: 'success', text: '設定を保存しました' });
      setTimeout(() => setMessage(null), 1500);
    } catch (error: any) {
      console.error('保存エラー:', error);
      const errorMessage = error.response?.data?.errors?.join(', ') || '保存に失敗しました';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (deviceId: string) => {
    // DEFAULT設定の場合は削除をスキップ
    if (deviceId === 'DEFAULT') {
      setMessage({ type: 'error', text: 'DEFAULT設定は削除できません' });
      return;
    }
    
    if (!window.confirm('この設定を削除しますか？')) return;
    
    try {
      await deviceConfigApi.delete(deviceId);
      await loadConfigs();
      setMessage({ type: 'success', text: '設定を削除しました' });
      setTimeout(() => setMessage(null), 1500);
    } catch (error) {
      console.error('削除エラー:', error);
      setMessage({ type: 'error', text: '削除に失敗しました' });
    }
  };

  const createNewConfig = () => {
    setEditingConfig({
      device_id: '',
      device_name: '',
      device_type: 'kiosk',
      location: '',
      show_factory_selection: false,
      show_line_selection: false,
      punch_buttons: ['出社', '退社'],
      line_ids: []
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        端末設定管理
      </Typography>

      {message && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 3 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {/* ヘッダー部分 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 1.5, // 3 から 1.5 に変更（半分に）
        p: 2,
        backgroundColor: '#f5f5f5',
        borderRadius: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">
            端末設定一覧 ({configs.length}件)
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={showDefaultConfig}
                onChange={(e) => {
                  setShowDefaultConfig(e.target.checked);
                  loadConfigs(); // 設定を再読み込み
                }}
              />
            }
            label="DEFAULT設定を表示"
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={createNewConfig}
        >
          新規追加
        </Button>
      </Box>

      {/* 設定一覧 */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: 3 
      }}>
        {configs && configs.map((config) => (
          <Card key={config.device_id} sx={{ height: '100%' }}>
            <CardHeader
              title={config.device_name}
              subheader={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    ID: {config.device_id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    場所: {config.location}
                  </Typography>
                  <Chip 
                    label={deviceTypeOptions.find(t => t.value === config.device_type)?.label}
                    size="small"
                    color="primary"
                    sx={{ mt: 1 }}
                  />
                </Box>
              }
              action={
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => setEditingConfig(config)}
                  >
                    <Edit />
                  </IconButton>
                  {config.device_id !== 'DEFAULT' && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(config.device_id)}
                    >
                      <Delete />
                    </IconButton>
                  )}
                </Box>
              }
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                工場選択: {config.show_factory_selection ? '有効' : '無効'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                ライン選択: {config.show_line_selection ? '有効' : '無効'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                打刻ボタン:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                {config.punch_buttons && config.punch_buttons.map((button) => (
                  <Chip key={button} label={button} size="small" />
                ))}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                表示ライン:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {config.line_ids && config.line_ids.map((lineId) => {
                  const line = lines.find(l => l.id === lineId);
                  return line ? (
                    <Chip key={lineId} label={line.name} size="small" color="secondary" />
                  ) : null;
                })}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* 編集ダイアログ */}
      <Dialog 
        open={!!editingConfig} 
        onClose={() => setEditingConfig(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingConfig?.device_id === 'DEFAULT' ? 'DEFAULT設定編集' : 
           editingConfig?.id ? '端末設定編集' : '新規端末設定'}
        </DialogTitle>
        <DialogContent>
          {editingConfig && (
            <Box sx={{ mt: 1 }}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: 2,
                mb: 3
              }}>
                <TextField
                  fullWidth
                  label="端末ID"
                  value={editingConfig.device_id}
                  onChange={(e) => {
                    // DEFAULT設定の場合は端末IDを変更不可
                    if (editingConfig.device_id === 'DEFAULT') return;
                    
                    // 英数字とアンダースコアのみ許可
                    const value = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                    setEditingConfig({
                      ...editingConfig,
                      device_id: value
                    });
                  }}
                  helperText={editingConfig.device_id === 'DEFAULT' ? 'DEFAULT設定は固定' : '環境変数 REACT_APP_DEVICE_ID で使用'}
                  placeholder="例: PC001, KIOSK_A1"
                  inputProps={{ maxLength: 20 }}
                  disabled={editingConfig.device_id === 'DEFAULT'}
                />
                
                <TextField
                  fullWidth
                  label="端末名"
                  value={editingConfig.device_name}
                  onChange={(e) => setEditingConfig({
                    ...editingConfig,
                    device_name: e.target.value
                  })}
                  placeholder="例: 工場A-1F端末"
                />
                
                <FormControl fullWidth>
                  <InputLabel>端末タイプ</InputLabel>
                  <Select
                    value={editingConfig.device_type}
                    onChange={(e) => setEditingConfig({
                      ...editingConfig,
                      device_type: e.target.value as any
                    })}
                  >
                    {deviceTypeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  label="設置場所"
                  value={editingConfig.location}
                  onChange={(e) => setEditingConfig({
                    ...editingConfig,
                    location: e.target.value
                  })}
                  placeholder="例: 工場A-1F, 事務所-2F"
                />
              </Box>
              
              <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                表示設定
              </Typography>
              
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: 2,
                mb: 3
              }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={false}
                      disabled={true}
                    />
                  }
                  label="工場選択を表示"
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={editingConfig.show_line_selection}
                      onChange={(e) => setEditingConfig({
                        ...editingConfig,
                        show_line_selection: e.target.checked
                      })}
                    />
                  }
                  label="ライン選択を表示"
                />
              </Box>
              
              <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                表示する打刻ボタン
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: 1,
                mb: 3
              }}>
                {punchButtonOptions && punchButtonOptions.map((button) => (
                  <FormControlLabel
                    key={button.value}
                    control={
                      <Checkbox
                        checked={editingConfig.punch_buttons && editingConfig.punch_buttons.includes(button.value)}
                        onChange={(e) => {
                          const newButtons = e.target.checked
                            ? [...(editingConfig.punch_buttons || []), button.value]
                            : (editingConfig.punch_buttons || []).filter(b => b !== button.value);
                          setEditingConfig({
                            ...editingConfig,
                            punch_buttons: newButtons
                          });
                        }}
                      />
                    }
                    label={button.label}
                  />
                ))}
              </Box>

              <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                表示するライン
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: 1
              }}>
                {lines && lines.map((line) => (
                  <FormControlLabel
                    key={line.id}
                    control={
                      <Checkbox
                        checked={editingConfig.line_ids && editingConfig.line_ids.includes(line.id)}
                        onChange={(e) => {
                          const newLineIds = e.target.checked
                            ? [...(editingConfig.line_ids || []), line.id]
                            : (editingConfig.line_ids || []).filter(id => id !== line.id);
                          setEditingConfig({
                            ...editingConfig,
                            line_ids: newLineIds
                          });
                        }}
                      />
                    }
                    label={line.name}
                  />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingConfig(null)}>
            キャンセル
          </Button>
          <Button
            onClick={() => handleSave(editingConfig!)}
            variant="contained"
            disabled={loading}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeviceConfigTab;

