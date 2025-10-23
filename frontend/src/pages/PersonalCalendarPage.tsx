import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
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
  IconButton,
  FormControlLabel,
  Radio,
  RadioGroup,
  Switch,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fade
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';
import { ArrowBack, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Upload as UploadIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { employeeApi, shiftApi, factoryApi, lineApi, scheduleEntryApi, leaveTypeApi } from '../services/api';
import { Employee, Shift, Factory, Line, LeaveType } from '../types';
import Header from '../components/Header';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

interface ScheduleEntry {
  id: string;
  employee_id: string;
  schedule_date: string;
  schedule_type: 'shift' | 'holiday' | 'paid_leave' | 'absence' | 'compensatory' | 'substitute';
  shift_id?: number;
  leave_type?: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
  status: 'scheduled' | 'confirmed' | 'cancelled';
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  is_compensatory?: boolean;
  original_date?: string;
  compensatory_type?: string;
  allowance_override?: any;
  business_rules?: any;
}

interface ScheduleForm {
  employee_id: string;
  schedule_date: string;
  schedule_type: 'shift' | 'holiday' | 'paid_leave' | 'absence' | 'compensatory' | 'substitute' | 'condolence_leave';
  shift_id?: number;
  leave_type?: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
  notes?: string;
  // 振休・代休用フィールド
  original_date?: string;
  compensatory_date?: string;
  exemption_type?: string;
  approval_required?: boolean;
  allowance_rate?: number;
  expiry_days?: number;
}

interface CalendarDay {
  date: Date;
  schedules: ScheduleEntry[];
  isToday: boolean;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isEditable: boolean;
}

const PersonalCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [selectedFactory, setSelectedFactory] = useState<string>('');
  const [selectedLine, setSelectedLine] = useState<string>('');
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // 編集モード
  const [editMode, setEditMode] = useState<'individual' | 'bulk'>('individual');
  
  // スケジュールフォームの状態
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>({
    employee_id: '',
    schedule_date: '',
    schedule_type: 'shift',
    start_time: '',
    end_time: '',
    reason: '',
    notes: ''
  });
  const [editingSchedule, setEditingSchedule] = useState<ScheduleEntry | null>(null);
  
  // 一括登録の状態
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    start_date: '',
    end_date: '',
    employee_ids: [] as string[],
    schedule_type: 'shift' as const,
    shift_id: 0,
    start_time: '',
    end_time: '',
    reason: '',
    apply_days: {
      sunday: false,
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false
    }
  });

  // データ取得
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [employeesData, shiftsData, factoriesData, linesData, leaveTypesData] = await Promise.all([
        employeeApi.getAll(),
        shiftApi.getAll(),
        factoryApi.getAll(),
        lineApi.getAll(),
        leaveTypeApi.getAll()
      ]);
      
      setEmployees(employeesData.filter(emp => emp.is_active));
      setShifts(shiftsData.filter(shift => shift.is_active));
      setFactories(factoriesData.filter(factory => factory.is_active));
      setLines(linesData.filter(line => line.is_active));
      setLeaveTypes(leaveTypesData.filter((leaveType: LeaveType) => leaveType.is_active));
      
      // 従業員の絞り込みを実行
      filterEmployees(employeesData.filter(emp => emp.is_active), '', '');
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

  // 従業員の絞り込み
  const filterEmployees = useCallback((allEmployees: Employee[], factoryId: string, lineId: string) => {
    let filtered = allEmployees;
    
    if (factoryId) {
      filtered = filtered.filter(emp => emp.factory_id === factoryId);
    }
    
    if (lineId) {
      filtered = filtered.filter(emp => emp.line_id === lineId);
    }
    
    setFilteredEmployees(filtered);
    
    // 選択中の従業員が絞り込み結果に含まれていない場合は選択をクリア
    if (selectedEmployee && !filtered.find(emp => emp.employee_id === selectedEmployee)) {
      setSelectedEmployee('');
    }
  }, [selectedEmployee]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // スケジュールデータの取得
  const loadScheduleData = useCallback(async () => {
    if (!selectedEmployee) return;
    
    try {
      const year = selectedYear;
      const month = selectedMonth;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      // ローカル日付をそのまま使用（タイムゾーン変換を避ける）
      const startDateString = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDateString = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
      
      const scheduleData = await scheduleEntryApi.getAll({
        employee_id: selectedEmployee,
        start_date: startDateString,
        end_date: endDateString
      });
      
      setScheduleEntries(scheduleData);
    } catch (error: any) {
      console.error('スケジュールデータの取得に失敗:', error);
    }
  }, [selectedEmployee, selectedYear, selectedMonth]);

  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);

  // 工場選択のハンドラー
  const handleFactoryChange = (factoryId: string) => {
    setSelectedFactory(factoryId);
    setSelectedLine(''); // ライン選択をクリア
    filterEmployees(employees, factoryId, '');
  };

  // ライン選択のハンドラー
  const handleLineChange = (lineId: string) => {
    setSelectedLine(lineId);
    filterEmployees(employees, selectedFactory, lineId);
  };

  // カレンダーデータの生成
  const generateCalendarData = useCallback((year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const calendar: CalendarDay[] = [];
    const currentDate = new Date(startDate);
    
    // 6週間分のカレンダーを生成
    for (let week = 0; week < 6; week++) {
      for (let day = 0; day < 7; day++) {
        const date = new Date(currentDate);
        const isToday = date.toDateString() === new Date().toDateString();
        const isCurrentMonth = date.getMonth() === month;
        
        // その日のスケジュールを取得（日付文字列で比較）
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const daySchedules = scheduleEntries.filter(entry => {
          return entry.schedule_date === dateString;
        });

        calendar.push({
          date,
          schedules: daySchedules,
          isToday,
          isCurrentMonth,
          isSelected: false,
          isEditable: isCurrentMonth
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    setCalendarData(calendar);
  }, [selectedYear, selectedMonth, scheduleEntries]);

  useEffect(() => {
    generateCalendarData(selectedYear, selectedMonth - 1);
  }, [selectedYear, selectedMonth, generateCalendarData]);

  // スケジュールフォームのリセット
  const resetScheduleForm = () => {
    setScheduleForm({
      employee_id: selectedEmployee,
      schedule_date: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`,
      schedule_type: 'shift',
      start_time: '',
      end_time: '',
      reason: '',
      notes: '',
      // 振休・代休用フィールドをリセット
      original_date: '',
      compensatory_date: '',
      exemption_type: 'full',
      approval_required: false,
      allowance_rate: 0.35,
      expiry_days: 60
    });
    setEditingSchedule(null);
  };


  // スケジュールの保存
  const handleScheduleSubmit = async () => {
    try {
      // バリデーション
      if (!scheduleForm.employee_id || !scheduleForm.schedule_date) {
        setError('従業員と日付は必須です');
        return;
      }
      
      // 既存のスケジュールをチェック
      const existingEntries = await scheduleEntryApi.getAll({
        employee_id: scheduleForm.employee_id,
        start_date: scheduleForm.schedule_date,
        end_date: scheduleForm.schedule_date
      });
      
      if (existingEntries.length > 0) {
        const existingType = existingEntries[0].schedule_type;
        const existingTypeName = getScheduleTypeName(existingType);
        setErrorMessage(`${scheduleForm.schedule_date}には既に${existingTypeName}が登録されています。1つの日付には1つのスケジュールのみ登録できます。`);
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }
      
      if (scheduleForm.schedule_type === 'compensatory' && !scheduleForm.original_date) {
        setError('元の休日を選択してください');
        return;
      }
      
      if (scheduleForm.schedule_type === 'substitute' && !scheduleForm.original_date) {
        setError('元の休日を選択してください');
        return;
      }
      
      // 振休・代休の場合、元の休日にも既存のスケジュールがないかチェック
      if ((scheduleForm.schedule_type === 'compensatory' || scheduleForm.schedule_type === 'substitute') && scheduleForm.original_date) {
        const originalDateEntries = await scheduleEntryApi.getAll({
          employee_id: scheduleForm.employee_id,
          start_date: scheduleForm.original_date,
          end_date: scheduleForm.original_date
        });
        
        if (originalDateEntries.length > 0) {
          const existingType = originalDateEntries[0].schedule_type;
          const existingTypeName = getScheduleTypeName(existingType);
          setErrorMessage(`元の休日（${scheduleForm.original_date}）には既に${existingTypeName}が登録されています。1つの日付には1つのスケジュールのみ登録できます。`);
          setTimeout(() => setErrorMessage(null), 3000);
          return;
        }
      }
      
      // 振休・代休の場合は専用APIを使用
      if (scheduleForm.schedule_type === 'compensatory') {
        await scheduleEntryApi.createCompensatoryHoliday({
          compensatory_holiday: {
            employee_id: scheduleForm.employee_id,
            original_date: scheduleForm.original_date,
            compensatory_date: scheduleForm.schedule_date,
            notes: scheduleForm.notes
          }
        });
      } else if (scheduleForm.schedule_type === 'substitute') {
        // 代休の場合：schedule_dateに代休を取得する日付、work_dateに出勤した休日を設定
        await scheduleEntryApi.createSubstituteHoliday({
          substitute_holiday: {
            employee_id: scheduleForm.employee_id,
            work_date: scheduleForm.original_date, // 出勤した休日（例：7日）
            substitute_date: scheduleForm.schedule_date, // 代休を取得する日付（例：9日）
            allowance_rate: scheduleForm.allowance_rate,
            expiry_days: scheduleForm.expiry_days,
            notes: scheduleForm.notes
          }
        });
      } else {
        // 通常のスケジュール
        await scheduleEntryApi.create(scheduleForm);
      }
      
      setScheduleDialogOpen(false);
      resetScheduleForm();
      setError(null);
      
      // スケジュールデータを再取得
      await loadScheduleData();
      
      // 成功メッセージの表示
      setSaveMessage('スケジュールを保存しました');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error: any) {
      console.error('スケジュールの保存に失敗:', error);
      console.error('エラーレスポンス詳細:', error.response?.data);
      
      // 詳細なエラーメッセージを取得
      let errorMessage = 'スケジュールの保存に失敗しました';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors).flat().join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    }
  };

  // 一括登録の保存
  const handleBulkSubmit = async () => {
    try {
      // 一括登録用のエントリを作成
      const entries = [];
      const startDate = new Date(bulkForm.start_date);
      const endDate = new Date(bulkForm.end_date);
      
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dayOfWeek = date.getDay();
        const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
        
        if (bulkForm.apply_days[dayName as keyof typeof bulkForm.apply_days]) {
          for (const employeeId of bulkForm.employee_ids) {
            // ローカル日付をそのまま使用（タイムゾーン変換を避ける）
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const localDateString = `${year}-${month}-${day}`;
            
            entries.push({
              employee_id: employeeId,
              schedule_date: localDateString,
              schedule_type: bulkForm.schedule_type,
              shift_id: bulkForm.shift_id || undefined,
              start_time: bulkForm.start_time || undefined,
              end_time: bulkForm.end_time || undefined,
              reason: bulkForm.reason || undefined,
              notes: bulkForm.reason || undefined
            });
          }
        }
      }
      
      await scheduleEntryApi.bulkCreate(entries);
      
      setBulkDialogOpen(false);
      setError(null);
      
      // スケジュールデータを再取得
      await loadScheduleData();
      
      // 成功メッセージの表示
      setSaveMessage('一括登録を完了しました');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      console.error('一括登録に失敗:', error);
      setError('一括登録に失敗しました');
    }
  };

  // 日付クリックの処理（月選択のみのため簡素化）
  const handleDateClick = (date: Date) => {
    if (editMode === 'individual') {
      resetScheduleForm();
      // ローカル日付をそのまま使用（タイムゾーン変換を避ける）
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const localDateString = `${year}-${month}-${day}`;
      
      setScheduleForm(prev => ({
        ...prev,
        employee_id: selectedEmployee,
        schedule_date: localDateString
      }));
      setScheduleDialogOpen(true);
    }
  };

  // スケジュールの色分け
  const getScheduleColor = (scheduleType: string) => {
    switch (scheduleType) {
      case 'shift': return '#1976d2'; // 青色
      case 'holiday': return '#4caf50'; // 緑色
      case 'paid_leave': return '#9c27b0'; // 紫色
      case 'absence': return '#f44336'; // 赤色
      case 'compensatory': return '#00bcd4'; // シアン色（振休）
      case 'substitute': return '#ff5722'; // 深いオレンジ色（代休）
      case 'condolence_leave': return '#795548'; // 茶色（慶弔）
      default: return '#757575'; // グレー
    }
  };

  // スケジュールタイプの表示名
  const getScheduleTypeName = (scheduleType: string): string => {
    switch (scheduleType) {
      case 'shift': return 'シフト';
      case 'holiday': return '公休';
      case 'paid_leave': return '有給';
      case 'absence': return '欠勤';
      case 'compensatory': return '振休';
      case 'substitute': return '代休';
      case 'condolence_leave': return '慶弔';
      default: return scheduleType;
    }
  };

  if (loading) return <Loading message="データを読み込み中..." />;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Box>
        <Header title="個人カレンダー" />
        
        {/* メインコンテンツ */}
        <Box sx={{ pt: 0.75, px: 3, pb: 3 }}>
          {/* ヘッダー */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
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
          </Box>

          {/* エラーメッセージ */}
          {error && <ErrorMessage message={error} />}
          
          {/* 保存メッセージ */}
          <Fade in={!!saveMessage} timeout={300}>
            <Box sx={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#4caf50',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              zIndex: 9999,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              display: saveMessage ? 'block' : 'none'
            }}>
              {saveMessage}
            </Box>
          </Fade>

          {/* エラーメッセージ */}
          <Fade in={!!errorMessage} timeout={300}>
            <Box sx={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#f44336',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              zIndex: 9999,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              display: errorMessage ? 'block' : 'none'
            }}>
              {errorMessage}
            </Box>
          </Fade>

          {/* コントロールパネル */}
          <Card sx={{ mb: 1 }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                {/* 年・月ピッカーをグループ化 */}
                <Box sx={{ display: 'flex', gap: '0px', alignItems: 'center' }}>
                  <Box sx={{ width: '100px' }}>
                    <FormControl fullWidth>
                      <InputLabel>年</InputLabel>
                      <Select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        label="年"
                      >
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() - 5 + i;
                          return (
                            <MenuItem key={year} value={year}>
                              {year}年
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Box>
                  
                  <Box sx={{ width: '100px', marginLeft: '-2px' }}>
                    <DatePicker
                      label="月"
                      value={new Date(selectedYear, selectedMonth - 1, 1)}
                      onChange={(newValue) => setSelectedMonth((newValue?.getMonth() || 0) + 1)}
                      views={['month']}
                      openTo="month"
                      format="M月"
                      slotProps={{ 
                        textField: { fullWidth: true },
                        popper: {
                          placement: 'bottom-start'
                        }
                      }}
                    />
                  </Box>
                </Box>
                
                {/* 工場・ライン・従業員選択 */}
                <Box sx={{ minWidth: '160px' }}>
                  <FormControl fullWidth>
                    <InputLabel>工場選択</InputLabel>
                    <Select
                      value={selectedFactory}
                      onChange={(e) => handleFactoryChange(e.target.value)}
                      label="工場選択"
                    >
                      <MenuItem value="">
                        <em>全て</em>
                      </MenuItem>
                      {factories.map(factory => (
                        <MenuItem key={factory.id} value={factory.factory_id}>
                          {factory.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ minWidth: '160px' }}>
                  <FormControl fullWidth>
                    <InputLabel>ライン選択</InputLabel>
                    <Select
                      value={selectedLine}
                      onChange={(e) => handleLineChange(e.target.value)}
                      label="ライン選択"
                      disabled={!selectedFactory}
                    >
                      <MenuItem value="">
                        <em>全て</em>
                      </MenuItem>
                      {lines
                        .filter(line => !selectedFactory || line.factory_id === selectedFactory)
                        .map(line => (
                          <MenuItem key={line.id} value={line.line_id}>
                            {line.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ minWidth: '180px' }}>
                  <FormControl fullWidth>
                    <InputLabel>従業員選択</InputLabel>
                    <Select
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      label="従業員選択"
                    >
                      <MenuItem value="">
                        <em>選択してください</em>
                      </MenuItem>
                      {filteredEmployees.map(employee => (
                        <MenuItem key={employee.id} value={employee.employee_id}>
                          {employee.name} ({employee.employee_id})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                {/* 登録モード選択 */}
                <Box sx={{ minWidth: '200px' }}>
                  <FormControl component="fieldset">
                    <RadioGroup
                      row
                      value={editMode}
                      onChange={(e) => setEditMode(e.target.value as 'individual' | 'bulk')}
                    >
                      <FormControlLabel value="individual" control={<Radio />} label="個別登録" />
                      <FormControlLabel value="bulk" control={<Radio />} label="一括登録" />
                    </RadioGroup>
                  </FormControl>
                </Box>
                
                {/* ボタン群 */}
                <Box sx={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      if (editMode === 'individual') {
                        resetScheduleForm();
                        setScheduleDialogOpen(true);
                      } else {
                        setBulkDialogOpen(true);
                      }
                    }}
                    size="small"
                  >
                    {editMode === 'individual' ? '個別登録' : '一括登録'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={() => {
                      // TODO: エクセルアップロード機能の実装
                      alert('エクセルアップロード機能は今後実装予定です');
                    }}
                    size="small"
                  >
                    エクセル
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* カレンダー */}
          <Card>
            <CardHeader title={`${selectedYear}年${selectedMonth}月`} />
            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
              <Box sx={{ width: '100%' }}>
                {/* 曜日ヘッダー */}
                <Box sx={{ display: 'flex', borderBottom: '1px solid #e0e0e0' }}>
                  {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                    <Box
                      key={index}
                      sx={{
                        flex: 1,
                        p: 1,
                        textAlign: 'center',
                        fontWeight: 'bold',
                        backgroundColor: '#f5f5f5',
                        borderRight: index < 6 ? '1px solid #e0e0e0' : 'none'
                      }}
                    >
                      {day}
                    </Box>
                  ))}
                </Box>
                
                {/* カレンダーグリッド */}
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {Array.from({ length: Math.ceil(calendarData.length / 7) }, (_, weekIndex) => (
                    <Box key={weekIndex} sx={{ display: 'flex', borderBottom: '1px solid #e0e0e0' }}>
                      {Array.from({ length: 7 }, (_, dayIndex) => {
                        const day = calendarData[weekIndex * 7 + dayIndex];
                        if (!day) {
                          return (
                            <Box
                              key={dayIndex}
                              sx={{
                                flex: 1,
                                height: 100,
                                borderRight: dayIndex < 6 ? '1px solid #e0e0e0' : 'none',
                                backgroundColor: '#fafafa'
                              }}
                            />
                          );
                        }
                        
                        return (
                          <Box
                            key={dayIndex}
                            sx={{
                              flex: 1,
                              height: 100,
                              p: 1,
                              borderRight: dayIndex < 6 ? '1px solid #e0e0e0' : 'none',
                              cursor: day.isEditable ? 'pointer' : 'default',
                              backgroundColor: day.isToday ? '#e3f2fd' : 'white',
                              border: day.isSelected ? '2px solid #1976d2' : 'none',
                              '&:hover': day.isEditable ? { backgroundColor: '#f5f5f5' } : {},
                              display: 'flex',
                              flexDirection: 'column',
                              overflow: 'hidden'
                            }}
                            onClick={() => day.isEditable && handleDateClick(day.date)}
                          >
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: day.isToday ? 'bold' : 'normal',
                                color: day.isCurrentMonth ? 'text.primary' : 'text.secondary',
                                mb: 0.5
                              }}
                            >
                              {day.date.getDate()}
                            </Typography>
                            
                            {/* スケジュール表示 */}
                            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                              {day.schedules.slice(0, 3).map((schedule, scheduleIndex) => (
                                <Box
                                  key={scheduleIndex}
                                  sx={{
                                    backgroundColor: getScheduleColor(schedule.schedule_type),
                                    color: 'white',
                                    fontSize: '1.4rem', // 文字サイズを二回り大きく（1.0rem → 1.4rem）
                                    p: 1.5, // パディングをさらに大きく（1 → 1.5）
                                    mb: 0.5,
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    minHeight: '36px', // 最小高さを1.5倍に（24px → 36px）
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontWeight: 'bold' // フォントを太く
                                  }}
                                >
                                  {getScheduleTypeName(schedule.schedule_type)}
                                </Box>
                              ))}
                              {day.schedules.length > 3 && (
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  +{day.schedules.length - 3}件
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* 凡例 */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>凡例</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label="シフト" sx={{ backgroundColor: '#1976d2', color: 'white' }} />
                <Chip label="公休" sx={{ backgroundColor: '#4caf50', color: 'white' }} />
                <Chip label="有給" sx={{ backgroundColor: '#9c27b0', color: 'white' }} />
                <Chip label="欠勤" sx={{ backgroundColor: '#f44336', color: 'white' }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* 個別登録ダイアログ */}
        <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingSchedule ? 'スケジュール編集' : '新規スケジュール登録'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>従業員</InputLabel>
                  <Select
                    value={scheduleForm.employee_id}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, employee_id: e.target.value }))}
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
                <DatePicker
                  label="日付"
                  value={scheduleForm.schedule_date ? new Date(scheduleForm.schedule_date) : null}
                  onChange={(date) => setScheduleForm(prev => ({ 
                    ...prev, 
                    schedule_date: date ? date.toISOString().split('T')[0] : '' 
                  }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>予定の種類</InputLabel>
                  <Select
                    value={scheduleForm.schedule_type}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, schedule_type: e.target.value as any }))}
                    label="予定の種類"
                  >
                    <MenuItem value="shift">シフト</MenuItem>
                    <MenuItem value="holiday">公休</MenuItem>
                    <MenuItem value="paid_leave">有給</MenuItem>
                    <MenuItem value="absence">欠勤</MenuItem>
                    <MenuItem value="compensatory">振休</MenuItem>
                    <MenuItem value="substitute">代休</MenuItem>
                    <MenuItem value="condolence_leave">慶弔</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* 振休・代休用：元の休日選択 */}
              {(scheduleForm.schedule_type === 'compensatory' || scheduleForm.schedule_type === 'substitute') && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="元の休日"
                    type="date"
                    value={scheduleForm.original_date || ''}
                    onChange={(e) => {
                      setScheduleForm(prev => ({ ...prev, original_date: e.target.value }));
                    }}
                    InputLabelProps={{ shrink: true }}
                    helperText="元の休日を選択"
                  />
                </Grid>
              )}

              {scheduleForm.schedule_type === 'shift' && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>シフト選択</InputLabel>
                      <Select
                        value={scheduleForm.shift_id || ''}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, shift_id: Number(e.target.value) }))}
                        label="シフト選択"
                      >
                        {shifts.map(shift => (
                          <MenuItem key={shift.id} value={shift.id}>
                            {shift.name} ({shift.start_time}-{shift.end_time || '終了時刻未設定'})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="開始時刻"
                      type="time"
                      value={scheduleForm.start_time}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, start_time: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="終了時刻"
                      type="time"
                      value={scheduleForm.end_time}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, end_time: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </>
              )}

              <Grid size={12}>
                <TextField
                  fullWidth
                  label="理由"
                  multiline
                  rows={3}
                  value={scheduleForm.reason}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, reason: e.target.value }))}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  label="備考"
                  multiline
                  rows={2}
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </Grid>


              {/* 代休用フィールド */}
              {scheduleForm.schedule_type === 'substitute' && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="割増率"
                      type="number"
                      value={scheduleForm.allowance_rate || 0.35}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, allowance_rate: parseFloat(e.target.value) }))}
                      InputLabelProps={{ shrink: true }}
                      helperText="休日労働の割増率（0.35 = 35%）"
                      inputProps={{ step: 0.01, min: 0, max: 1 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="取得期限（日数）"
                      type="number"
                      value={scheduleForm.expiry_days || 60}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, expiry_days: parseInt(e.target.value) }))}
                      InputLabelProps={{ shrink: true }}
                      helperText="代休の取得期限（日数）"
                      inputProps={{ min: 1, max: 365 }}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setScheduleDialogOpen(false)}>
              キャンセル
            </Button>
            <Button 
              onClick={handleScheduleSubmit} 
              variant="contained"
              disabled={!scheduleForm.employee_id || !scheduleForm.schedule_date}
            >
              {editingSchedule ? '更新' : '登録'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 一括登録ダイアログ */}
        <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>一括登録</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="開始日"
                  value={bulkForm.start_date ? new Date(bulkForm.start_date) : null}
                  onChange={(date) => setBulkForm(prev => ({ 
                    ...prev, 
                    start_date: date ? date.toISOString().split('T')[0] : '' 
                  }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="終了日"
                  value={bulkForm.end_date ? new Date(bulkForm.end_date) : null}
                  onChange={(date) => setBulkForm(prev => ({ 
                    ...prev, 
                    end_date: date ? date.toISOString().split('T')[0] : '' 
                  }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              <Grid size={12}>
                <FormControl fullWidth>
                  <InputLabel>対象従業員</InputLabel>
                  <Select
                    multiple
                    value={bulkForm.employee_ids}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, employee_ids: e.target.value as string[] }))}
                    label="対象従業員"
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
                  <InputLabel>予定の種類</InputLabel>
                  <Select
                    value={bulkForm.schedule_type}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, schedule_type: e.target.value as any }))}
                    label="予定の種類"
                  >
                    <MenuItem value="shift">シフト</MenuItem>
                    <MenuItem value="holiday">公休</MenuItem>
                    <MenuItem value="paid_leave">有給</MenuItem>
                    <MenuItem value="absence">欠勤</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {bulkForm.schedule_type === 'shift' && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>シフト選択</InputLabel>
                      <Select
                        value={bulkForm.shift_id}
                        onChange={(e) => setBulkForm(prev => ({ ...prev, shift_id: Number(e.target.value) }))}
                        label="シフト選択"
                      >
                        {shifts.map(shift => (
                          <MenuItem key={shift.id} value={shift.id}>
                            {shift.name} ({shift.start_time}-{shift.end_time || '終了時刻未設定'})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="開始時刻"
                      type="time"
                      value={bulkForm.start_time}
                      onChange={(e) => setBulkForm(prev => ({ ...prev, start_time: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="終了時刻"
                      type="time"
                      value={bulkForm.end_time}
                      onChange={(e) => setBulkForm(prev => ({ ...prev, end_time: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </>
              )}

              <Grid size={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>適用日</Typography>
                <Grid container spacing={1}>
                  {(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const).map((day) => (
                    <Grid size={{ xs: 6, sm: 4 }} key={day}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={bulkForm.apply_days[day]}
                            onChange={(e) => setBulkForm(prev => ({
                              ...prev,
                              apply_days: { ...prev.apply_days, [day]: e.target.checked }
                            }))}
                          />
                        }
                        label={day === 'sunday' ? '日曜日' :
                               day === 'monday' ? '月曜日' : 
                               day === 'tuesday' ? '火曜日' :
                               day === 'wednesday' ? '水曜日' :
                               day === 'thursday' ? '木曜日' :
                               day === 'friday' ? '金曜日' :
                               day === 'saturday' ? '土曜日' : day}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  label="理由"
                  multiline
                  rows={3}
                  value={bulkForm.reason}
                  onChange={(e) => setBulkForm(prev => ({ ...prev, reason: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBulkDialogOpen(false)}>
              キャンセル
            </Button>
            <Button 
              onClick={handleBulkSubmit} 
              variant="contained"
              disabled={!bulkForm.start_date || !bulkForm.end_date || bulkForm.employee_ids.length === 0}
            >
              一括登録
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default PersonalCalendarPage;
