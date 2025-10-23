import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogTitle,
  IconButton,
  Fade,
  DialogContent,
  DialogActions
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';
import { ArrowBack, Close } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { factoryApi, lineApi, reportApi, employeeApi } from '../services/api';
import { Factory, Line } from '../types';

interface AttendanceSummary {
  employee_id: string;
  employee_name: string;
  punch1: string;
  punch2: string;
  punch3: string;
  punch4: string;
  punch5: string;
  punch6: string;
  work_time: string;
  note: string;
}

interface AttendanceEntry {
  employee_id: string;
  start: string;
  lunchOut1: string;
  lunchIn1: string;
  lunchOut2: string;
  lunchIn2: string;
  end: string;
  note: string;
}

interface Message {
  type: 'success' | 'error';
  text: string;
}

interface NoteDialog {
  open: boolean;
  employeeId: string;
  employeeName: string;
  note: string;
}

const AttendanceInputPage: React.FC = () => {
  const navigate = useNavigate();
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [selectedFactory, setSelectedFactory] = useState<string>('');
  const [selectedLine, setSelectedLine] = useState<string>('');
  const [employeeSearch, setEmployeeSearch] = useState<string>('');
  const [factories, setFactories] = useState<Factory[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [noteDialog, setNoteDialog] = useState<NoteDialog>({
    open: false,
    employeeId: '',
    employeeName: '',
    note: ''
  });

  // 工場データ読み込み
  const loadFactories = async () => {
    try {
      const data = await factoryApi.getAll();
      const activeFactories = data.filter(factory => factory.is_active);
      setFactories(activeFactories.sort((a, b) => a.id - b.id));
    } catch (error) {
      console.error('工場データの読み込みに失敗:', error);
      setMessage({ type: 'error', text: '工場データの読み込みに失敗しました' });
    }
  };

  // ラインデータ読み込み
  const loadLines = async (factoryId: string) => {
    if (!factoryId) {
      setLines([]);
      return;
    }
    
    try {
      const data = await lineApi.getAll();
      const filteredLines = data.filter(line => line.factory_id === factoryId && line.is_active);
      setLines(filteredLines.sort((a, b) => a.id - b.id));
    } catch (error) {
      console.error('ラインデータの読み込みに失敗:', error);
      setMessage({ type: 'error', text: 'ラインデータの読み込みに失敗しました' });
    }
  };

  // 工場選択変更
  const handleFactoryChange = (factoryId: string) => {
    setSelectedFactory(factoryId);
    setSelectedLine('');
    loadLines(factoryId);
  };

  // 検索実行
  const handleSearch = async () => {
    if (!targetDate || !selectedFactory || !selectedLine) {
      setMessage({ type: 'error', text: '工場、ラインを選択してください' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const dateStr = targetDate.toISOString().split('T')[0];
      const data = await reportApi.getAttendanceSummary(dateStr, selectedLine);
      let filteredData = data.rows || [];
      
      // 勤怠データがない場合は、ラインの従業員リストを取得して空のレコードを作成
      if (filteredData.length === 0) {
        try {
          const employees = await employeeApi.getAll();
          const lineEmployees = employees.filter(emp => emp.line_id === selectedLine && emp.is_active);
          filteredData = lineEmployees.map(emp => ({
            employee_id: emp.employee_id,
            employee_name: emp.name,
            punch1: '',
            punch2: '',
            punch3: '',
            punch4: '',
            punch5: '',
            punch6: '',
            work_time: '',
            note: ''
          }));
        } catch (empError) {
          console.error('従業員データの取得に失敗:', empError);
        }
      }
      
      // 社員検索フィルタリング
      if (employeeSearch.trim()) {
        const searchTerm = employeeSearch.trim().toLowerCase();
        filteredData = filteredData.filter((employee: AttendanceSummary) => 
          employee.employee_id.toLowerCase().includes(searchTerm) ||
          employee.employee_name.toLowerCase().includes(searchTerm)
        );
      }
      
      setAttendanceData(filteredData);
      setShowForm(true);
    } catch (error) {
      console.error('勤怠データの取得に失敗:', error);
      setMessage({ type: 'error', text: '勤怠データの取得に失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  // リセット
  const handleReset = () => {
    setTargetDate(new Date());
    setSelectedFactory('');
    setSelectedLine('');
    setEmployeeSearch('');
    setAttendanceData([]);
    setShowForm(false);
    setMessage(null);
  };

  // フォームクリア
  const handleClear = () => {
    if (window.confirm('入力内容をクリアしますか？')) {
      setAttendanceData(prev => prev.map(item => ({
        ...item,
        punch1: '',
        punch2: '',
        punch3: '',
        punch4: '',
        punch5: '',
        punch6: '',
        work_time: '',
        note: ''
      })));
    }
  };

  // 勤務時間計算
  const calculateWorkTime = (data: {
    start: string;
    lunchOut1: string;
    lunchIn1: string;
    lunchOut2: string;
    lunchIn2: string;
    end: string;
  }) => {
    if (!data.start || !data.end) return '';
    
    try {
      const startTime = new Date(`2000-01-01T${data.start}`);
      let endTime = new Date(`2000-01-01T${data.end}`);
      
      // 退社時刻が出社時刻より早い場合は翌日として扱う（夜勤対応）
      if (endTime <= startTime) {
        endTime = new Date(endTime.getTime() + 24 * 60 * 60 * 1000); // 24時間追加
      }
      
      let totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      
      // 昼休み時間を差し引く
      if (data.lunchOut1 && data.lunchIn1) {
        let lunchOut1 = new Date(`2000-01-01T${data.lunchOut1}`);
        let lunchIn1 = new Date(`2000-01-01T${data.lunchIn1}`);
        
        // 昼休みも夜勤対応
        if (lunchIn1 <= lunchOut1) {
          lunchIn1 = new Date(lunchIn1.getTime() + 24 * 60 * 60 * 1000);
        }
        
        totalMinutes -= (lunchIn1.getTime() - lunchOut1.getTime()) / (1000 * 60);
      }
      if (data.lunchOut2 && data.lunchIn2) {
        let lunchOut2 = new Date(`2000-01-01T${data.lunchOut2}`);
        let lunchIn2 = new Date(`2000-01-01T${data.lunchIn2}`);
        
        // 昼休みも夜勤対応
        if (lunchIn2 <= lunchOut2) {
          lunchIn2 = new Date(lunchIn2.getTime() + 24 * 60 * 60 * 1000);
        }
        
        totalMinutes -= (lunchIn2.getTime() - lunchOut2.getTime()) / (1000 * 60);
      }
      
      const hours = Math.floor(totalMinutes / 60);
      const minutes = Math.floor(totalMinutes % 60);
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    } catch {
      return '計算エラー';
    }
  };

  // 時刻入力変更
  const handleTimeChange = (employeeId: string, field: string, value: string) => {
    setAttendanceData(prev => {
      const updated = prev.map(item => {
        if (item.employee_id === employeeId) {
          const updatedItem = { ...item, [field]: value };
          
          // 勤務時間を再計算
          const workTimeData = {
            start: field === 'punch1' ? value : item.punch1,
            lunchOut1: field === 'punch2' ? value : item.punch2,
            lunchIn1: field === 'punch3' ? value : item.punch3,
            lunchOut2: field === 'punch4' ? value : item.punch4,
            lunchIn2: field === 'punch5' ? value : item.punch5,
            end: field === 'punch6' ? value : item.punch6
          };
          
          updatedItem.work_time = calculateWorkTime(workTimeData);
          return updatedItem;
        }
        return item;
      });
      return updated;
    });
  };

  // 備考ダイアログを開く
  const handleOpenNoteDialog = (employeeId: string, employeeName: string, currentNote: string) => {
    setNoteDialog({
      open: true,
      employeeId,
      employeeName,
      note: currentNote || ''
    });
  };

  // 備考ダイアログを閉じる
  const handleCloseNoteDialog = () => {
    setNoteDialog({
      open: false,
      employeeId: '',
      employeeName: '',
      note: ''
    });
  };

  // 備考ダイアログ内のテキスト変更
  const handleNoteDialogChange = (value: string) => {
    setNoteDialog(prev => ({ ...prev, note: value }));
  };

  // 備考ダイアログで保存
  const handleSaveNoteDialog = () => {
    setAttendanceData(prev => {
      const updated = prev.map(item => {
        if (item.employee_id === noteDialog.employeeId) {
          return { ...item, note: noteDialog.note };
        }
        return item;
      });
      return updated;
    });
    handleCloseNoteDialog();
  };

  // 備考入力変更（従来の方法、使用しない）
  const handleNoteChange = (employeeId: string, value: string) => {
    setAttendanceData(prev => {
      const updated = prev.map(item => {
        if (item.employee_id === employeeId) {
          return { ...item, note: value };
        }
        return item;
      });
      return updated;
    });
  };

  // 個別保存
  const handleSaveIndividual = async (employeeId: string) => {
    if (!targetDate || !selectedLine) {
      setMessage({ type: 'error', text: '検索条件を設定してください' });
      return;
    }

    const employee = attendanceData.find(item => item.employee_id === employeeId);
    if (!employee) return;

    // 出社データまたは備考のいずれかがあれば保存可能
    const hasTimeData = employee.punch1 || employee.punch2 || employee.punch3 || 
                       employee.punch4 || employee.punch5 || employee.punch6;
    const hasNote = employee.note && employee.note.trim() !== '';
    
    if (!hasTimeData && !hasNote) {
      setMessage({ type: 'error', text: '出社データまたは備考を入力してください' });
      return;
    }

    try {
      const dateStr = targetDate.toISOString().split('T')[0];
      
      // 出社データがある場合は通常の勤怠保存
      if (hasTimeData) {
        const entry: AttendanceEntry = {
          employee_id: employee.employee_id,
          start: employee.punch1,
          lunchOut1: employee.punch2,
          lunchIn1: employee.punch3,
          lunchOut2: employee.punch4,
          lunchIn2: employee.punch5,
          end: employee.punch6,
          note: employee.note || ''
        };
        await reportApi.batchSaveAttendance(dateStr, selectedLine, [entry]);
      }
      // 備考だけの場合は備考専用の保存
      else if (hasNote) {
        const noteEntry = {
          employee_id: employee.employee_id,
          punch_type: '備考',
          punch_time: new Date(dateStr + 'T12:00:00').toISOString(), // 正午に設定
          note: employee.note
        };
        // 備考専用のAPIエンドポイントを呼び出し（実装が必要）
        await reportApi.saveNoteOnly(noteEntry);
      }
      
      setMessage({ type: 'success', text: `${employee.employee_name}さんのデータを保存しました` });
      // 1.5秒後にメッセージを自動的に消す
      setTimeout(() => {
        setMessage(null);
      }, 1500);
    } catch (error) {
      console.error('個別保存に失敗:', error);
      setMessage({ type: 'error', text: '保存に失敗しました' });
    }
  };


  // 選択された工場・ライン名を取得
  const getSelectedFactoryName = () => {
    const factory = factories.find(f => f.factory_id === selectedFactory);
    return factory ? `${factory.factory_id} ${factory.name}` : '';
  };

  const getSelectedLineName = () => {
    const line = lines.find(l => l.line_id === selectedLine);
    return line ? `${line.line_id} ${line.name}` : '';
  };

  useEffect(() => {
    loadFactories();
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: 'MS PGothic, sans-serif',
        width: '100vw',
        margin: 0,
        padding: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'auto'
      }}>
        {/* 最上段バー1 */}
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
            勤怠入力
          </Typography>
          <Typography sx={{ fontSize: '18px', fontWeight: 'normal' }}>
            {new Date().toLocaleDateString('ja-JP', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit',
              weekday: 'short'
            })}
          </Typography>
        </Box>

        {/* 最上段バー2 */}
        <Box sx={{ 
          backgroundColor: 'transparent',
          color: 'white',
          padding: '8px 20px',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          height: '40px'
        }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/admin')}
            size="small"
            sx={{
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
            メニューに戻る
          </Button>
        </Box>

        <Box sx={{ 
          padding: '8px 20px 20px 20px',
          height: 'calc(100vh - 120px)',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>

        {/* メッセージ表示 */}
        <Fade in={!!message} timeout={300}>
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
            display: message ? 'block' : 'none',
            minWidth: '300px',
            textAlign: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ flex: 1 }}>{message?.text}</Box>
              <IconButton
                onClick={() => setMessage(null)}
                sx={{
                  color: 'white',
                  padding: '4px',
                  marginLeft: '8px',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Fade>

        {/* 検索条件 */}
        <Card sx={{ marginBottom: '12px' }} className="fade-in">
          <CardContent sx={{ padding: '12px 16px' }}>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'end'
            }}>
              <Box sx={{ minWidth: '180px' }}>
                <DatePicker
                  label="対象年月"
                  value={targetDate}
                  onChange={(newValue) => setTargetDate(newValue || new Date())}
                  format="yyyy年M月d日"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small"
                    }
                  }}
                />
              </Box>
              
              <Box sx={{ minWidth: '160px' }}>
                <FormControl fullWidth size="small">
                  <InputLabel>工場選択</InputLabel>
                  <Select
                    value={selectedFactory}
                    onChange={(e) => handleFactoryChange(e.target.value)}
                    label="工場選択"
                    size="small"
                  >
                    {factories.map((factory) => (
                      <MenuItem key={factory.factory_id} value={factory.factory_id}>
                        {factory.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ minWidth: '180px' }}>
                <FormControl fullWidth size="small">
                  <InputLabel>ライン選択</InputLabel>
                  <Select
                    value={selectedLine}
                    onChange={(e) => setSelectedLine(e.target.value)}
                    label="ライン選択"
                    disabled={!selectedFactory}
                    size="small"
                  >
                    {lines.map((line) => (
                      <MenuItem key={line.line_id} value={line.line_id}>
                        {line.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'end' }}>
                <TextField
                  label="社員検索"
                  placeholder="社員コードまたは社員名"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  size="small"
                />
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={loading}
                  size="small"
                  sx={{ minWidth: '80px' }}
                >
                  {loading ? <CircularProgress size={16} /> : '表示更新'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleReset}
                  size="small"
                  sx={{ minWidth: '80px' }}
                >
                  リセット
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* 情報バー */}
        {showForm && (
          <Box sx={{ 
            backgroundColor: '#e0e0e0',
            padding: '8px 16px',
            marginBottom: '12px',
            borderRadius: '4px'
          }}>
            <Typography variant="body2" sx={{ color: '#666' }}>
              {targetDate.toLocaleDateString('ja-JP', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })} | {getSelectedFactoryName()} | {getSelectedLineName()}
            </Typography>
          </Box>
        )}

        {/* 勤怠入力フォーム */}
        {showForm && (
          <Card>
            <CardHeader 
              sx={{ 
                backgroundColor: '#f8f9fa',
                padding: '12px 16px',
                '& .MuiCardHeader-title': {
                  fontSize: '16px',
                  fontWeight: 'bold'
                }
              }}
            />
            <CardContent sx={{ padding: 0 }}>
              <TableContainer 
                component={Paper} 
                className="fade-in-delay-1"
                sx={{ 
                  maxHeight: 'calc(100vh - 300px)',
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: '#f1f1f1',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#c1c1c1',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    backgroundColor: '#a8a8a8',
                  }
                }}
              >
                <Table size="small">
                  <TableHead sx={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold', minWidth: '80px' }}>社員番号</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', minWidth: '100px' }}>社員名</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', minWidth: '100px' }}>出社</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', minWidth: '100px' }}>昼休出1</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', minWidth: '100px' }}>昼休入1</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', minWidth: '100px' }}>昼休出2</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', minWidth: '100px' }}>昼休入2</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', minWidth: '100px' }}>退社</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', minWidth: '80px' }}>勤務時間</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', minWidth: '120px' }}>備考</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', minWidth: '80px' }}>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendanceData.map((item) => (
                      <TableRow key={item.employee_id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                        <TableCell>{item.employee_id}</TableCell>
                        <TableCell>{item.employee_name}</TableCell>
                        <TableCell>
                          <TextField
                            type="time"
                            value={item.punch1}
                            onChange={(e) => handleTimeChange(item.employee_id, 'punch1', e.target.value)}
                            size="small"
                            sx={{ 
                              width: '100px',
                              '& .MuiInputBase-input': {
                                padding: '8px 12px',
                                fontSize: '0.875rem'
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="time"
                            value={item.punch2}
                            onChange={(e) => handleTimeChange(item.employee_id, 'punch2', e.target.value)}
                            size="small"
                            sx={{ 
                              width: '100px',
                              '& .MuiInputBase-input': {
                                padding: '8px 12px',
                                fontSize: '0.875rem'
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="time"
                            value={item.punch3}
                            onChange={(e) => handleTimeChange(item.employee_id, 'punch3', e.target.value)}
                            size="small"
                            sx={{ 
                              width: '100px',
                              '& .MuiInputBase-input': {
                                padding: '8px 12px',
                                fontSize: '0.875rem'
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="time"
                            value={item.punch4}
                            onChange={(e) => handleTimeChange(item.employee_id, 'punch4', e.target.value)}
                            size="small"
                            sx={{ 
                              width: '100px',
                              '& .MuiInputBase-input': {
                                padding: '8px 12px',
                                fontSize: '0.875rem'
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="time"
                            value={item.punch5}
                            onChange={(e) => handleTimeChange(item.employee_id, 'punch5', e.target.value)}
                            size="small"
                            sx={{ 
                              width: '100px',
                              '& .MuiInputBase-input': {
                                padding: '8px 12px',
                                fontSize: '0.875rem'
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="time"
                            value={item.punch6}
                            onChange={(e) => handleTimeChange(item.employee_id, 'punch6', e.target.value)}
                            size="small"
                            sx={{ 
                              width: '100px',
                              '& .MuiInputBase-input': {
                                padding: '8px 12px',
                                fontSize: '0.875rem'
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 'bold',
                            fontSize: '1.1rem'
                          }}>
                            {item.work_time}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box
                            onClick={() => handleOpenNoteDialog(item.employee_id, item.employee_name, item.note)}
                            sx={{
                              padding: '8px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              backgroundColor: 'white',
                              cursor: 'pointer',
                              minHeight: '40px',
                              alignItems: 'center',
                              maxHeight: '2.4em',
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              wordBreak: 'break-word'
                            }}
                          >
                            <Typography variant="body2" sx={{ 
                              color: item.note ? 'black' : '#999',
                              fontSize: '0.875rem',
                              maxHeight: '2.4em',
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              wordBreak: 'break-word'
                            }}>
                              {item.note || '備考をクリックして入力...'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleSaveIndividual(item.employee_id)}
                          >
                            保存
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {attendanceData.length === 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 3 }}>
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={handleClear}
                    sx={{ minWidth: 120 }}
                  >
                    全クリア
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* 備考入力ダイアログ */}
        <Dialog
          open={noteDialog.open}
          onClose={handleCloseNoteDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            備考入力 - {noteDialog.employeeName}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="備考"
              placeholder="備考を入力してください（500文字以内）"
              fullWidth
              multiline
              rows={8}
              variant="outlined"
              value={noteDialog.note}
              onChange={(e) => handleNoteDialogChange(e.target.value)}
              inputProps={{ maxLength: 500 }}
              sx={{ marginTop: 2 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ marginTop: 1, display: 'block' }}>
              {noteDialog.note.length}/500文字
            </Typography>
          </DialogContent>
         <DialogActions>
           <Button onClick={handleCloseNoteDialog}>
             キャンセル
           </Button>
           <Button onClick={handleSaveNoteDialog} variant="contained">
             入力
           </Button>
         </DialogActions>
        </Dialog>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default AttendanceInputPage;