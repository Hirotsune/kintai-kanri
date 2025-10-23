import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { reportApi, employeeApi, factoryApi, lineApi } from '../services/api';
import { Employee, Factory, Line } from '../types';

interface AttendanceDetail {
  date: string;
  dayOfWeek: string;
  workType: string;
  start1: string;
  lunchOut1: string;
  lunchIn1: string;
  lunchOut2: string;
  lunchIn2: string;
  end2: string;
  workTime: string;
  errorCount: number;
  errorContent: string;
}

interface AttendanceBookResult {
  employee: Employee;
  details: AttendanceDetail[];
}

const AttendanceBookPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [scope, setScope] = useState<'all' | 'factory' | 'line' | 'employee'>('factory');
  const [factoryId, setFactoryId] = useState<string>('');
  const [lineId, setLineId] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [results, setResults] = useState<AttendanceBookResult[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 初期データ読み込み
  useEffect(() => {
    loadMasterData();
  }, []);

  // スコープ変更時の処理
  useEffect(() => {
    if (scope === 'employee' && employees.length > 0 && !employeeId) {
      setEmployeeId(employees[0].employee_id);
    }
  }, [scope, employees, employeeId]);

  const loadMasterData = async () => {
    try {
      const [employeesRes, factoriesRes, linesRes] = await Promise.all([
        employeeApi.getAll(),
        factoryApi.getAll(),
        lineApi.getAll()
      ]);
      
      setEmployees((employeesRes || []).sort((a, b) => a.id - b.id));
      setFactories((factoriesRes || []).filter(factory => factory.is_active).sort((a, b) => a.id - b.id));
      setLines((linesRes || []).filter(line => line.is_active).sort((a, b) => a.id - b.id));
    } catch (error) {
      console.error('マスターデータの読み込みに失敗:', error);
      setMessage({ type: 'error', text: 'マスターデータの読み込みに失敗しました' });
    }
  };

  const handleSearch = async () => {
    if (!selectedMonth) {
      setMessage({ type: 'error', text: '勤怠年月を選択してください' });
      return;
    }

    // スコープ別の検証
    if (scope === 'factory' && !factoryId) {
      setMessage({ type: 'error', text: '工場を選択してください' });
      return;
    }
    if (scope === 'line' && !lineId) {
      setMessage({ type: 'error', text: 'ラインを選択してください' });
      return;
    }
    if (scope === 'employee' && !employeeId) {
      setMessage({ type: 'error', text: '社員を選択してください' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const year = selectedYear;
      const month = selectedMonth;
      
      const params = {
        year,
        month,
        scope,
        factory_id: factoryId,
        line_id: lineId,
        employee_id: employeeId
      };

      const response = await reportApi.getAttendanceBook(params);
      setResults(response.data || []);
      
      if (response.data && response.data.length === 0) {
        setMessage({ type: 'error', text: '該当する従業員がいません' });
      }
    } catch (error) {
      console.error('出勤簿の取得に失敗:', error);
      setMessage({ type: 'error', text: '出勤簿の取得に失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth(new Date().getMonth() + 1);
    setScope('employee');
    setFactoryId('');
    setLineId('');
    setEmployeeId('');
    setResults([]);
    setMessage(null);
  };

  const handleCsvExport = async () => {
    if (!selectedMonth) {
      setMessage({ type: 'error', text: '勤怠年月を選択してください' });
      return;
    }

    // スコープ別の検証
    if (scope === 'factory' && !factoryId) {
      setMessage({ type: 'error', text: '工場を選択してください' });
      return;
    }
    if (scope === 'line' && !lineId) {
      setMessage({ type: 'error', text: 'ラインを選択してください' });
      return;
    }
    if (scope === 'employee' && !employeeId) {
      setMessage({ type: 'error', text: '社員を選択してください' });
      return;
    }

    try {
      const year = selectedYear;
      const month = selectedMonth;
      
      const params = {
        year,
        month,
        scope,
        factory_id: factoryId,
        line_id: lineId,
        employee_id: employeeId
      };

      await reportApi.exportAttendanceBookCsv(params);
      setMessage({ type: 'success', text: 'CSVファイルをダウンロードしました' });
    } catch (error) {
      console.error('CSV出力に失敗:', error);
      setMessage({ type: 'error', text: 'CSV出力に失敗しました' });
    }
  };

  const getDisplayMonth = () => {
    return `${selectedYear}年${selectedMonth.toString().padStart(2, '0')}月度`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'yyyy/MM/dd');
    } catch {
      return dateStr;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: 'MS PGothic, sans-serif',
        width: '100%',
        margin: 0,
        padding: 0
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
            出勤簿
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
        
        <Box sx={{ padding: '8px 20px 20px 20px', width: '100%' }}>

          {/* 検索条件 */}
          <Paper sx={{ padding: '12px 16px', marginBottom: '12px', width: '100%' }} className="fade-in">
            
            {/* 検索条件 - 1行に並べる */}
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'end'
            }}>
              {/* 年・月ピッカーグループ */}
              <Box sx={{ 
                display: 'flex', 
                gap: '0px',
                alignItems: 'end'
              }}>
                <Box sx={{ width: '100px' }}>
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel>年</InputLabel>
                    <Select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      label="年"
                      size="small"
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

                <Box sx={{ width: '100px' }}>
                  <DatePicker
                    label="月"
                    value={new Date(selectedYear, selectedMonth - 1, 1)}
                    onChange={(newValue) => setSelectedMonth((newValue?.getMonth() || 0) + 1)}
                    views={['month']}
                    openTo="month"
                    format="M月"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small'
                      }
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ minWidth: '160px' }}>
                <FormControl fullWidth size="small">
                  <InputLabel>スコープ</InputLabel>
                  <Select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as any)}
                    label="スコープ"
                  >
                    <MenuItem value="all">全員</MenuItem>
                    <MenuItem value="factory">工場指定</MenuItem>
                    <MenuItem value="line">ライン指定</MenuItem>
                    <MenuItem value="employee">社員指定</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {scope === 'factory' && (
                <Box sx={{ minWidth: '180px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>工場</InputLabel>
                    <Select
                      value={factoryId}
                      onChange={(e) => setFactoryId(e.target.value)}
                      label="工場"
                    >
                      <MenuItem value="">-- 選択 --</MenuItem>
                      {factories.map((factory) => (
                        <MenuItem key={factory.factory_id} value={factory.factory_id}>
                          {factory.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

              {scope === 'line' && (
                <Box sx={{ minWidth: '200px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>ライン</InputLabel>
                    <Select
                      value={lineId}
                      onChange={(e) => setLineId(e.target.value)}
                      label="ライン"
                    >
                      <MenuItem value="">-- 選択 --</MenuItem>
                      {lines.map((line) => {
                        const factory = factories.find(f => f.factory_id === line.factory_id);
                        return (
                          <MenuItem key={line.line_id} value={line.line_id}>
                            {factory ? `${factory.name}:${line.name}` : `${line.line_id}:${line.name}`}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Box>
              )}

              {scope === 'employee' && (
                <Box sx={{ minWidth: '200px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>社員</InputLabel>
                    <Select
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      label="社員"
                    >
                      {employees.map((emp) => (
                        <MenuItem key={emp.employee_id} value={emp.employee_id}>
                          {emp.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* ボタンエリア - 社員リストの右に配置 */}
              <Box sx={{ 
                display: 'flex', 
                gap: '8px',
                alignItems: 'end'
              }}>
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
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleCsvExport}
                  size="small"
                  sx={{ minWidth: '80px' }}
                >
                  CSV出力
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* 出勤簿結果 */}
          {results.map((result, index) => (
            <Box key={index} sx={{ marginBottom: '20px' }} className="fade-in-delay-1">
              {/* ヘッダー情報 */}
              <Card sx={{ marginBottom: '10px' }} className="fade-in">
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        出勤簿
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        ページ: 1/1
                      </Typography>
                    </Box>
                  }
                />
                <CardContent>
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                    gap: '16px'
                  }}>
                    <Box>
                      <Typography variant="body1" sx={{ fontSize: '16px' }}>
                        勤怠年月: {getDisplayMonth()}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body1" sx={{ fontSize: '16px' }}>
                        工場: {result.employee.factory_id}:{result.employee.factory_name}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body1" sx={{ fontSize: '16px' }}>
                        ライン: {result.employee.line_id}:{result.employee.line_name}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body1" sx={{ fontSize: '16px' }}>
                        社員: {result.employee.employee_id} [{result.employee.name}]
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* 詳細テーブル */}
              <TableContainer component={Paper} className="fade-in-delay-1">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>出勤日</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>勤務区分</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>出社</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>昼休出１</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>昼休入１</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>昼休出２</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>昼休入２</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>退社</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>勤務時間</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>エラー内容</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.details.map((detail, detailIndex) => (
                      <TableRow 
                        key={detailIndex}
                        sx={{ 
                          backgroundColor: detail.workType ? 'white' : '#f8f9fa'
                        }}
                      >
                        <TableCell>
                          {detail.workType ? (
                            <strong>{formatDate(detail.date)}({detail.dayOfWeek})</strong>
                          ) : (
                            `${formatDate(detail.date)}(${detail.dayOfWeek})`
                          )}
                        </TableCell>
                        <TableCell>
                          {detail.workType ? (
                            <Box
                              sx={{
                                padding: '3px 8px',
                                borderRadius: '3px',
                                backgroundColor: '#4caf50',
                                color: 'white',
                                fontSize: '0.8rem',
                                display: 'inline-block'
                              }}
                            >
                              {detail.workType}
                            </Box>
                          ) : (
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{detail.start1 || '-'}</TableCell>
                        <TableCell>{detail.lunchOut1 || '-'}</TableCell>
                        <TableCell>{detail.lunchIn1 || '-'}</TableCell>
                        <TableCell>{detail.lunchOut2 || '-'}</TableCell>
                        <TableCell>{detail.lunchIn2 || '-'}</TableCell>
                        <TableCell>{detail.end2 || '-'}</TableCell>
                        <TableCell>
                          {detail.workTime ? (
                            <strong style={{ color: '#1976d2' }}>{detail.workTime}</strong>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color: detail.errorCount > 0 ? '#f44336' : 'text.secondary'
                            }}
                          >
                            {detail.errorCount > 0 ? detail.errorContent : (detail.errorContent || '-')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}

          {results.length === 0 && !loading && (
            <Paper sx={{ padding: '20px', textAlign: 'center' }} className="fade-in-delay-2">
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                検索条件を設定して「表示更新」ボタンを押してください
              </Typography>
            </Paper>
          )}

          {/* 中央メッセージフォーム */}
          {message && (
            <Box sx={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              minWidth: '300px',
              maxWidth: '500px'
            }}>
              <Box sx={{
                backgroundColor: '#4caf50',
                color: 'white',
                padding: '16px 24px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                textAlign: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                position: 'relative'
              }}>
                {message.text}
                <Box
                  onClick={() => setMessage(null)}
                  sx={{
                    position: 'absolute',
                    top: '8px',
                    right: '12px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    opacity: 0.8,
                    '&:hover': {
                      opacity: 1
                    }
                  }}
                >
                  ×
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default AttendanceBookPage;
