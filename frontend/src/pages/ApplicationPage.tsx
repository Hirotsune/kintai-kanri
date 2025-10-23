import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  FormControlLabel,
  Radio,
  RadioGroup,
  Switch
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';
import { ArrowBack, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { employeeApi } from '../services/api';
import { Employee } from '../types';
import Header from '../components/Header';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`application-tabpanel-${index}`}
      aria-labelledby={`application-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface ApplicationForm {
  employee_id: string;
  application_type: 'paid_leave' | 'absence' | 'special_leave' | 'shift_change';
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
}

const ApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 申請フォームの状態
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [applicationForm, setApplicationForm] = useState<ApplicationForm>({
    employee_id: '',
    application_type: 'paid_leave',
    start_date: '',
    end_date: '',
    days: 1,
    reason: '',
    notes: '',
    status: 'pending'
  });
  const [editingApplication, setEditingApplication] = useState<ApplicationForm | null>(null);

  // データ取得
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const employeesData = await employeeApi.getAll();
      setEmployees(employeesData.filter(emp => emp.is_active));
    } catch (error: any) {
      console.error('データの取得に失敗:', error);
      if (error.response?.status === 404) {
        setError('APIエンドポイントが見つかりません。バックエンドサーバーが起動しているか確認してください。');
      } else if (error.code === 'ECONNREFUSED') {
        setError('バックエンドサーバーに接続できません。サーバーが起動しているか確認してください。');
      } else {
        setError(`データの取得に失敗しました: ${error.message || '不明なエラー'}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 申請フォームのリセット
  const resetApplicationForm = () => {
    setApplicationForm({
      employee_id: '',
      application_type: 'paid_leave',
      start_date: '',
      end_date: '',
      days: 1,
      reason: '',
      notes: '',
      status: 'pending'
    });
    setEditingApplication(null);
  };

  // 申請の送信
  const handleApplicationSubmit = async () => {
    try {
      // TODO: 申請APIの実装後に有効化
      console.log('申請送信:', applicationForm);
      
      setApplicationDialogOpen(false);
      resetApplicationForm();
      setError(null);
      
      // 成功メッセージの表示
      alert('申請を送信しました');
    } catch (error) {
      console.error('申請の送信に失敗:', error);
      setError('申請の送信に失敗しました');
    }
  };

  // 申請の編集
  const handleEditApplication = (application: ApplicationForm) => {
    setApplicationForm(application);
    setEditingApplication(application);
    setApplicationDialogOpen(true);
  };

  // 申請の削除
  const handleDeleteApplication = (application: ApplicationForm) => {
    if (window.confirm('この申請を削除しますか？')) {
      // TODO: 申請削除APIの実装後に有効化
      console.log('申請削除:', application);
      alert('申請を削除しました');
    }
  };

  if (loading) return <Loading message="データを読み込み中..." />;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Box>
        <Header />
        
        {/* メインコンテンツ */}
        <Box sx={{ p: 3 }}>
          {/* ヘッダー */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => {
                sessionStorage.setItem('fromOtherPage', 'true');
                navigate('/');
              }}
              size="small"
              sx={{
                mr: 2,
                backgroundColor: 'transparent',
                color: '#1976d2',
                borderColor: '#1976d2',
                fontSize: '12px',
                height: '28px',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  borderColor: '#1976d2',
                }
              }}
            >
              トップへ戻る
            </Button>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              申請
            </Typography>
          </Box>

          {/* エラーメッセージ */}
          {error && <ErrorMessage message={error} />}

          {/* タブ */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="有給申請" />
              <Tab label="欠勤申請" />
              <Tab label="特別休暇申請" />
              <Tab label="シフト変更申請" />
              <Tab label="申請履歴" />
            </Tabs>
          </Box>

          {/* 有給申請タブ */}
          <TabPanel value={tabValue} index={0}>
            <Card>
              <CardHeader
                title="有給申請"
                action={
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      resetApplicationForm();
                      setApplicationForm(prev => ({ ...prev, application_type: 'paid_leave' }));
                      setApplicationDialogOpen(true);
                    }}
                  >
                    新規申請
                  </Button>
                }
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  有給休暇の申請を行います。申請後、管理者の承認が必要です。
                </Typography>
                {/* TODO: 有給申請一覧の表示 */}
                <Typography variant="body2" color="text.secondary">
                  申請履歴は申請履歴タブで確認できます。
                </Typography>
              </CardContent>
            </Card>
          </TabPanel>

          {/* 欠勤申請タブ */}
          <TabPanel value={tabValue} index={1}>
            <Card>
              <CardHeader
                title="欠勤申請"
                action={
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      resetApplicationForm();
                      setApplicationForm(prev => ({ ...prev, application_type: 'absence' }));
                      setApplicationDialogOpen(true);
                    }}
                  >
                    新規申請
                  </Button>
                }
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  欠勤の申請を行います。事前申請または事後申請が可能です。
                </Typography>
                {/* TODO: 欠勤申請一覧の表示 */}
                <Typography variant="body2" color="text.secondary">
                  申請履歴は申請履歴タブで確認できます。
                </Typography>
              </CardContent>
            </Card>
          </TabPanel>

          {/* 特別休暇申請タブ */}
          <TabPanel value={tabValue} index={2}>
            <Card>
              <CardHeader
                title="特別休暇申請"
                action={
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      resetApplicationForm();
                      setApplicationForm(prev => ({ ...prev, application_type: 'special_leave' }));
                      setApplicationDialogOpen(true);
                    }}
                  >
                    新規申請
                  </Button>
                }
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  慶弔休暇、病気休暇、育児休暇などの特別休暇の申請を行います。
                </Typography>
                {/* TODO: 特別休暇申請一覧の表示 */}
                <Typography variant="body2" color="text.secondary">
                  申請履歴は申請履歴タブで確認できます。
                </Typography>
              </CardContent>
            </Card>
          </TabPanel>

          {/* シフト変更申請タブ */}
          <TabPanel value={tabValue} index={3}>
            <Card>
              <CardHeader
                title="シフト変更申請"
                action={
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      resetApplicationForm();
                      setApplicationForm(prev => ({ ...prev, application_type: 'shift_change' }));
                      setApplicationDialogOpen(true);
                    }}
                  >
                    新規申請
                  </Button>
                }
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  シフトの変更申請を行います。勤務時間の変更やシフトの交換が可能です。
                </Typography>
                {/* TODO: シフト変更申請一覧の表示 */}
                <Typography variant="body2" color="text.secondary">
                  申請履歴は申請履歴タブで確認できます。
                </Typography>
              </CardContent>
            </Card>
          </TabPanel>

          {/* 申請履歴タブ */}
          <TabPanel value={tabValue} index={4}>
            <Card>
              <CardHeader title="申請履歴" />
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  過去の申請履歴を確認できます。
                </Typography>
                {/* TODO: 申請履歴一覧の表示 */}
                <Typography variant="body2" color="text.secondary">
                  申請履歴の表示機能は今後実装予定です。
                </Typography>
              </CardContent>
            </Card>
          </TabPanel>
        </Box>

        {/* 申請ダイアログ */}
        <Dialog open={applicationDialogOpen} onClose={() => setApplicationDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingApplication ? '申請編集' : '新規申請'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>従業員</InputLabel>
                  <Select
                    value={applicationForm.employee_id}
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, employee_id: e.target.value }))}
                    label="従業員"
                  >
                    {employees.map(employee => (
                      <MenuItem key={employee.id} value={employee.employee_id}>
                        {employee.name} ({employee.employee_id})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>申請種別</InputLabel>
                  <Select
                    value={applicationForm.application_type}
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, application_type: e.target.value as any }))}
                    label="申請種別"
                  >
                    <MenuItem value="paid_leave">有給申請</MenuItem>
                    <MenuItem value="absence">欠勤申請</MenuItem>
                    <MenuItem value="special_leave">特別休暇申請</MenuItem>
                    <MenuItem value="shift_change">シフト変更申請</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="開始日"
                  value={applicationForm.start_date ? new Date(applicationForm.start_date) : null}
                  onChange={(date) => setApplicationForm(prev => ({ 
                    ...prev, 
                    start_date: date ? date.toISOString().split('T')[0] : '' 
                  }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="終了日"
                  value={applicationForm.end_date ? new Date(applicationForm.end_date) : null}
                  onChange={(date) => setApplicationForm(prev => ({ 
                    ...prev, 
                    end_date: date ? date.toISOString().split('T')[0] : '' 
                  }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="日数"
                  type="number"
                  value={applicationForm.days}
                  onChange={(e) => setApplicationForm(prev => ({ ...prev, days: parseInt(e.target.value) || 1 }))}
                  inputProps={{ min: 1, max: 30 }}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  label="理由"
                  multiline
                  rows={3}
                  value={applicationForm.reason}
                  onChange={(e) => setApplicationForm(prev => ({ ...prev, reason: e.target.value }))}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  label="備考"
                  multiline
                  rows={2}
                  value={applicationForm.notes}
                  onChange={(e) => setApplicationForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApplicationDialogOpen(false)}>
              キャンセル
            </Button>
            <Button 
              onClick={handleApplicationSubmit} 
              variant="contained"
              disabled={!applicationForm.employee_id || !applicationForm.start_date}
            >
              {editingApplication ? '更新' : '申請'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ApplicationPage;
