import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'line_daily' | 'line_monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedLineId, setSelectedLineId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // サンプルデータ（エラーを避けるため）
  const sampleLines = [
    { line_id: 'L001', name: '第1ライン' },
    { line_id: 'L002', name: '第2ライン' },
    { line_id: 'L003', name: '第3ライン' }
  ];

  const generateReport = async () => {
    setLoading(true);
    // サンプル処理（実際のAPI呼び出しは無効化）
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Typography>レポートを生成中...</Typography>
      </Box>
    );
  }

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
          <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
            勤怠管理システム
          </Typography>
          <Typography sx={{ fontSize: '12px', fontWeight: 'normal' }}>
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
          backgroundColor: '#4169E1',
          color: 'white',
          padding: '8px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '40px'
        }}>
          <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
            レポート
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate('/admin')}
            size="small"
            sx={{
              color: 'white',
              borderColor: 'white',
              fontSize: '12px',
              height: '28px',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'white',
              }
            }}
          >
            メニューに戻る
          </Button>
        </Box>

        <Box sx={{ padding: 3, paddingTop: 2 }}>

        {/* 専用レポートページへのリンク */}
        <Box sx={{ 
          backgroundColor: '#F5F5F5',
          padding: '15px 20px',
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          borderBottom: '1px solid #CCCCCC'
        }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/line-daily-report')}
            sx={{ 
              minWidth: 200,
              fontSize: '12px',
              padding: '6px 12px',
              borderColor: '#003366',
              color: '#003366',
              '&:hover': {
                backgroundColor: '#003366',
                color: 'white'
              }
            }}
          >
            ライン別日別実績表
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              console.log('ライン別月別実績表ボタンがクリックされました');
              navigate('/line-monthly-report');
            }}
            sx={{ 
              minWidth: 200,
              fontSize: '12px',
              padding: '6px 12px',
              borderColor: '#003366',
              color: '#003366',
              '&:hover': {
                backgroundColor: '#003366',
                color: 'white'
              }
            }}
          >
            ライン別月別実績表
          </Button>
        </Box>

        {/* 検索条件 */}
        <Box sx={{ 
          backgroundColor: '#F5F5F5',
          padding: '15px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          borderBottom: '1px solid #CCCCCC'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 'normal', whiteSpace: 'nowrap' }}>
              レポート種別
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                sx={{ fontSize: '12px' }}
              >
                <MenuItem value="daily">日別レポート</MenuItem>
                <MenuItem value="monthly">月別レポート</MenuItem>
                <MenuItem value="line_daily">ライン別日別</MenuItem>
                <MenuItem value="line_monthly">ライン別月別</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {reportType === 'daily' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 'normal', whiteSpace: 'nowrap' }}>
                対象日
              </Typography>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                format="yyyy年M月d日"
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: { fontSize: '12px', width: 120 }
                  }
                }}
              />
            </Box>
          )}

          {(reportType === 'monthly' || reportType === 'line_monthly') && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Typography sx={{ fontSize: '12px', fontWeight: 'normal', whiteSpace: 'nowrap' }}>
                  年
                </Typography>
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <Select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    sx={{ fontSize: '12px' }}
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Typography sx={{ fontSize: '12px', fontWeight: 'normal', whiteSpace: 'nowrap' }}>
                  月
                </Typography>
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <Select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    sx={{ fontSize: '12px' }}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <MenuItem key={month} value={month}>{month}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </>
          )}

          {(reportType === 'line_daily' || reportType === 'line_monthly') && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 'normal', whiteSpace: 'nowrap' }}>
                ライン
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={selectedLineId}
                  onChange={(e) => setSelectedLineId(e.target.value)}
                  sx={{ fontSize: '12px' }}
                >
                  {sampleLines.map((line) => (
                    <MenuItem key={line.line_id} value={line.line_id}>
                      {line.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          <Box sx={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <Button
              variant="outlined"
              onClick={generateReport}
              disabled={loading}
              sx={{ 
                fontSize: '12px',
                padding: '6px 12px',
                borderColor: '#003366',
                color: '#003366',
                '&:hover': {
                  backgroundColor: '#003366',
                  color: 'white'
                }
              }}
            >
              生成
            </Button>
          </Box>
        </Box>

        {/* サンプルレポート結果 */}
        <Box sx={{ 
          backgroundColor: 'white',
          margin: '20px',
          padding: '20px'
        }}>
          <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
            レポート結果
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px', marginBottom: '15px' }}>
            総勤怠数: 15件, 総従業員数: 3人
          </Typography>
          
          <TableContainer component={Paper} sx={{ fontSize: '12px' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: '12px', fontWeight: 'bold' }}>従業員ID</TableCell>
                  <TableCell sx={{ fontSize: '12px', fontWeight: 'bold' }}>従業員名</TableCell>
                  <TableCell sx={{ fontSize: '12px', fontWeight: 'bold' }}>打刻タイプ</TableCell>
                  <TableCell sx={{ fontSize: '12px', fontWeight: 'bold' }}>打刻時刻</TableCell>
                  <TableCell sx={{ fontSize: '12px', fontWeight: 'bold' }}>勤務日</TableCell>
                  <TableCell sx={{ fontSize: '12px', fontWeight: 'bold' }}>シフト</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: '11px' }}>1234</TableCell>
                  <TableCell sx={{ fontSize: '11px' }}>田中太郎</TableCell>
                  <TableCell sx={{ fontSize: '11px' }}>出社</TableCell>
                  <TableCell sx={{ fontSize: '11px' }}>08:30</TableCell>
                  <TableCell sx={{ fontSize: '11px' }}>2025/01/15</TableCell>
                  <TableCell sx={{ fontSize: '11px' }}>日勤</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontSize: '11px' }}>1234</TableCell>
                  <TableCell sx={{ fontSize: '11px' }}>田中太郎</TableCell>
                  <TableCell sx={{ fontSize: '11px' }}>退社</TableCell>
                  <TableCell sx={{ fontSize: '11px' }}>17:30</TableCell>
                  <TableCell sx={{ fontSize: '11px' }}>2025/01/15</TableCell>
                  <TableCell sx={{ fontSize: '11px' }}>日勤</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontSize: '11px' }}>2345</TableCell>
                  <TableCell sx={{ fontSize: '11px' }}>佐藤花子</TableCell>
                  <TableCell sx={{ fontSize: '11px' }}>出社</TableCell>
                  <TableCell sx={{ fontSize: '11px' }}>09:00</TableCell>
                  <TableCell sx={{ fontSize: '11px' }}>2025/01/15</TableCell>
                  <TableCell sx={{ fontSize: '11px' }}>日勤</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* フッター */}
        <Box sx={{ 
          padding: '10px 20px',
          backgroundColor: '#F5F5F5',
          borderTop: '1px solid #CCCCCC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '20px'
        }}>
          <Typography sx={{ fontSize: '11px', color: '#666666' }}>
            System Version. 1.01
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate('/admin')}
            sx={{ 
              fontSize: '12px',
              padding: '6px 12px',
              borderColor: '#666666',
              color: '#666666',
              '&:hover': {
                backgroundColor: '#666666',
                color: 'white'
              }
            }}
          >
            業務終了
          </Button>
        </Box>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default ReportsPage;