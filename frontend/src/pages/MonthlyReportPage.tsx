import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Select, MenuItem, FormControl, InputLabel, Table, TableHead, TableBody, TableCell, TableRow, TableContainer, Paper, Card, CardContent, TextField, Fade, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';
import { format } from 'date-fns';
import Header from '../components/Header';
import { factoryApi, employeeApi, reportApi } from '../services/api';
import { Factory, Employee } from '../types';

const MonthlyReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear());
  const [targetMonth, setTargetMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedFactory, setSelectedFactory] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [factories, setFactories] = useState<Factory[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // 勤怠データ
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 工場データの取得
  useEffect(() => {
    const loadFactories = async () => {
      try {
        const factoryData = await factoryApi.getAll();
        // アクティブな工場のみをフィルタリング
        const activeFactories = factoryData.filter(factory => factory.is_active).sort((a, b) => a.id - b.id);
        setFactories(activeFactories);
      } catch (error) {
        console.error('工場データの取得に失敗:', error);
      }
    };

    loadFactories();
  }, []);

  // 社員データの取得
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const employeeData = await employeeApi.getAll();
        // アクティブな社員のみをフィルタリング
        const activeEmployees = employeeData.filter(employee => employee.is_active);
        setEmployees(activeEmployees);
      } catch (error) {
        console.error('社員データの取得に失敗:', error);
      }
    };

    loadEmployees();
  }, []);

  // 月の日数を取得
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  // 合計時間を計算（横型テーブル用）
  const calculateTotalHours = (employee: any) => {
    const daysInMonth = getDaysInMonth(targetYear, targetMonth);
    let totalHours = 0;
    let totalMinutes = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      if (employee.hours && employee.hours[day]) {
        const timeStr = employee.hours[day];
        if (timeStr && timeStr.includes(':')) {
          const [hours, minutes] = timeStr.split(':').map(Number);
          if (!isNaN(hours) && !isNaN(minutes)) {
            totalHours += hours;
            totalMinutes += minutes;
          }
        }
      }
    }
    
    totalHours += Math.floor(totalMinutes / 60);
    totalMinutes = totalMinutes % 60;
    return `${totalHours}:${totalMinutes.toString().padStart(2, '0')}`;
  };

  // 検索処理
  const handleSearch = async () => {
    // 検索条件のチェック
    if (!selectedFactory && !selectedEmployee) {
      setErrorMessage('工場または社員を選択してください');
      setAttendanceData([]);
      return;
    }
    
    setErrorMessage(null);
    setLoading(true);
    try {
      const response = await reportApi.getMonthlyAttendance(
        targetYear,
        targetMonth,
        selectedFactory || undefined,
        selectedEmployee || undefined
      );
      
      
      // 横型テーブル用のデータ構造に変換
      const processedData = (response.data || []).map((employee: any) => ({
        id: employee.id,
        employee_id: employee.employee_id,
        name: employee.name,
        department: employee.department,
        factory_name: employee.factory_name,
        line_name: employee.line_name,
        hours: employee.hours || {}
      }));
      
      setAttendanceData(processedData);
      
    } catch (error) {
      console.error('データの取得に失敗:', error);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  // リセット処理
  const handleReset = () => {
    setSelectedFactory('');
    setSelectedEmployee('');
    setAttendanceData([]);
    setErrorMessage(null);
  };

  // 画面表示処理
  const handleDisplay = async () => {
    await handleSearch();
  };

  // CSV出力処理
  const handleExportCSV = () => {
    if (attendanceData.length === 0) {
      alert('出力するデータがありません');
      return;
    }

    // 月の日数を取得
    const daysInMonth = getDaysInMonth(targetYear, targetMonth);
    
    // ヘッダー行を生成
    const headers = [
      '社員ID', '氏名', '部署', '工場名', 'ライン名',
      ...Array.from({ length: daysInMonth }, (_, i) => `${i + 1}日`),
      '合計勤務時間'
    ];
    
    // データ行を生成
    const csvData = attendanceData.map(employee => {
      const row = [
        employee.employee_id,
        employee.name,
        employee.department,
        employee.factory_name,
        employee.line_name
      ];
      
      // 日別勤務時間を追加
      let totalHours = 0;
      let totalMinutes = 0;
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dayHours = employee.hours && employee.hours[day] ? employee.hours[day] : '';
        row.push(dayHours);
        
        // 合計時間を計算
        if (dayHours && dayHours.includes(':')) {
          const [hours, minutes] = dayHours.split(':').map(Number);
          if (!isNaN(hours) && !isNaN(minutes)) {
            totalHours += hours;
            totalMinutes += minutes;
          }
        }
      }
      
      // 合計時間を追加
      totalHours += Math.floor(totalMinutes / 60);
      totalMinutes = totalMinutes % 60;
      const totalTime = `${totalHours}:${totalMinutes.toString().padStart(2, '0')}`;
      row.push(totalTime);
      
      return row;
    });

    // CSV文字列を生成
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // BOMを追加してUTF-8エンコーディングを指定
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // ダウンロード
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `勤怠実績表_${targetYear}年${targetMonth}月.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // 曜日名を取得
  const getDayName = (day: number) => {
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const date = new Date(targetYear, targetMonth - 1, day);
    return dayNames[date.getDay()];
  };

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
        <style>
          {`
            .day-sunday {
              color: #ff0000;
              font-weight: bold;
            }
            .day-saturday {
              color: #0000ff;
              font-weight: bold;
            }
            .day-weekday {
              color: #000000;
            }
            .date-header {
              background-color: #f8f9fa !important;
              font-weight: bold;
            }
          `}
        </style>
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
            勤怠実績表（月間）
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

        <Box sx={{ padding: '8px 20px 20px 20px' }}>

        {/* 検索条件 */}
        <Card sx={{ mb: 2 }} className="fade-in">
          <CardContent sx={{ padding: '12px 16px' }}>
            
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'end'
            }}>
              {/* 年/月ピッカーグループ */}
              <Box sx={{ 
                display: 'flex', 
                gap: '0px',
                alignItems: 'end'
              }}>
                <Box sx={{ width: '100px' }}>
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel>年</InputLabel>
                    <Select
                      value={targetYear}
                      onChange={(e) => setTargetYear(Number(e.target.value))}
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
                    value={new Date(targetYear, targetMonth - 1, 1)}
                    onChange={(newValue) => setTargetMonth((newValue?.getMonth() || 0) + 1)}
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
              
              {/* 工場指定 */}
              <Box sx={{ minWidth: '160px' }}>
              <TextField
                select
                variant="outlined"
                label="工場指定"
                value={selectedFactory}
                onChange={(e) => setSelectedFactory(e.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value="">全て</MenuItem>
                {factories.map((factory) => (
                  <MenuItem key={factory.id} value={factory.factory_id}>
                    {factory.name}
                  </MenuItem>
                ))}
              </TextField>
              </Box>
              
              {/* 社員指定 */}
              <Box sx={{ minWidth: '180px' }}>
              <TextField
                select
                variant="outlined"
                label="社員指定"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value="">全て</MenuItem>
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.employee_id}>
                    {employee.name}
                  </MenuItem>
                ))}
              </TextField>
              </Box>
              
              {/* ボタンエリア */}
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'end' }}>
                <Button 
                  variant="contained" 
                  onClick={handleSearch} 
                  disabled={loading}
                  size="small"
                  sx={{ 
                    minWidth: '80px'
                  }}
                >
                  {loading ? '検索中...' : '表示更新'}
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={handleReset} 
                  size="small"
                  sx={{ 
                    minWidth: '80px'
                  }}
                >
                  リセット
                </Button>
                <Button 
                  variant="contained"
                  color="success"
                  onClick={handleExportCSV} 
                  size="small"
                  sx={{ 
                    minWidth: '80px'
                  }}
                >
                  CSV出力
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* データテーブル */}
        <Card sx={{ mb: 3 }} className="fade-in-delay-1">
          <CardContent>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              勤怠実績表（月間） - {targetYear}年{targetMonth}月 <span style={{ fontSize: '0.9em', color: '#6b7280' }}>（単位：時間）</span>
            </Typography>
            
            <TableContainer 
              component={Paper} 
              sx={{ 
                maxHeight: '70vh',
                overflow: 'auto',
                position: 'relative'
              }}
            >
              <Table 
                stickyHeader
                sx={{
                  '& .MuiTableCell-root': {
                    borderRight: '1px dotted #e0e0e0',
                    fontSize: '0.9rem',
                    padding: '8px 6px',
                    whiteSpace: 'nowrap',
                    '&:last-child': {
                      borderRight: 'none'
                    }
                  },
                  '& .fixed-column': {
                    position: 'sticky',
                    left: 0,
                    backgroundColor: 'white',
                    zIndex: 2,
                    boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
                  },
                  '& .fixed-column-name': {
                    position: 'sticky',
                    left: '60px',
                    backgroundColor: 'white',
                    zIndex: 2,
                    boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                    minWidth: '120px'
                  },
                  '& .fixed-column-dept': {
                    position: 'sticky',
                    left: '180px',
                    backgroundColor: 'white',
                    zIndex: 2,
                    boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                    minWidth: '100px'
                  },
                  '& .fixed-column-total': {
                    position: 'sticky',
                    right: 0,
                    backgroundColor: 'white',
                    zIndex: 2,
                    boxShadow: '-2px 0 4px rgba(0,0,0,0.1)',
                    minWidth: '80px'
                  },
                  '& .MuiTableHead-root .fixed-column': {
                    backgroundColor: '#f5f5f5',
                    zIndex: 3
                  },
                  '& .MuiTableHead-root .fixed-column-name': {
                    backgroundColor: '#f5f5f5',
                    zIndex: 3
                  },
                  '& .MuiTableHead-root .fixed-column-dept': {
                    backgroundColor: '#f5f5f5',
                    zIndex: 3
                  },
                  '& .MuiTableHead-root .fixed-column-total': {
                    backgroundColor: '#f5f5f5',
                    zIndex: 3
                  }
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell className="fixed-column" sx={{ minWidth: '60px', maxWidth: '60px' }}>番号</TableCell>
                    <TableCell className="fixed-column-name">氏名</TableCell>
                    <TableCell className="fixed-column-dept">部署</TableCell>
                    {Array.from({ length: getDaysInMonth(targetYear, targetMonth) }, (_, i) => i + 1).map(day => (
                      <TableCell key={day} sx={{ 
                        minWidth: '50px', 
                        textAlign: 'center',
                        backgroundColor: '#f8f9fa',
                        fontWeight: 'bold'
                      }}>
                        {day}日<br />
                        <span style={{ 
                          fontSize: '0.7em',
                          color: getDayName(day) === '日' ? '#ff4444' : getDayName(day) === '土' ? '#4444ff' : '#333333',
                          fontWeight: 'bold'
                        }}>
                          ({getDayName(day)})
                        </span>
                      </TableCell>
                    ))}
                    <TableCell className="fixed-column-total" sx={{ textAlign: 'center' }}>合計</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={getDaysInMonth(targetYear, targetMonth) + 4} align="center">
                        データを読み込み中...
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendanceData.map((employee) => (
                      <TableRow key={employee.id || employee.employee_id}>
                        <TableCell className="fixed-column" sx={{ textAlign: 'center' }}>
                          {employee.employee_id || employee.id}
                        </TableCell>
                        <TableCell className="fixed-column-name">{employee.name}</TableCell>
                        <TableCell className="fixed-column-dept">{employee.department}</TableCell>
                        {Array.from({ length: getDaysInMonth(targetYear, targetMonth) }, (_, i) => i + 1).map(day => (
                          <TableCell key={day} sx={{ textAlign: 'center' }}>
                            {employee.hours?.[day] || ''}
                          </TableCell>
                        ))}
                        <TableCell className="fixed-column-total" sx={{ textAlign: 'center' }}>
                          <strong>{calculateTotalHours(employee)}</strong>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
        
        {/* エラーメッセージ */}
        <Fade in={!!errorMessage} timeout={300}>
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
            display: errorMessage ? 'block' : 'none',
            minWidth: '300px',
            textAlign: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ flex: 1 }}>{errorMessage}</Box>
              <IconButton
                onClick={() => setErrorMessage(null)}
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
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default MonthlyReportPage;
