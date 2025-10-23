import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  TextField
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { factoryApi, lineApi, reportApi } from '../services/api';
import { Factory, Line, Employee } from '../types';

// 時間帯別集計データの型定義
interface TimeBandSummary {
  night: number;    // 22:00-05:00
  early: number;    // 05:00-09:00
  day: number;      // 09:00-18:00
  evening: number;  // 18:00-22:00
  total: number;
}

interface MonthlySummaryRow {
  employee: Employee;
  factory_name: string;
  work_days: number;
  standard_hours: number;
  period1: TimeBandSummary;  // 1-16日
  period2: TimeBandSummary;  // 17-末日
  monthly: TimeBandSummary;  // 月間
  actual_working_hours: number;
  overtime_hours: number;
}

const MonthlySummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear());
  const [targetMonth, setTargetMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedFactory, setSelectedFactory] = useState<string>('');
  const [employeeQuery, setEmployeeQuery] = useState<string>('');
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<MonthlySummaryRow[]>([]);

  // 工場データの取得
  useEffect(() => {
    const loadFactories = async () => {
      try {
        const factoryData = await factoryApi.getAll();
        const activeFactories = factoryData.filter(factory => factory.is_active).sort((a, b) => a.id - b.id);
        setFactories(activeFactories);
      } catch (error) {
        console.error('工場データの取得に失敗:', error);
      }
    };
    loadFactories();
  }, []);


  // 検索処理
  const handleSearch = async () => {
    setLoading(true);
    try {
      console.log('勤怠集計データを取得中...', { year: targetYear, month: targetMonth, selectedFactory, employeeQuery });
      
      // 実際のAPIを呼び出し
      const response = await reportApi.getMonthlyBandSummary(
        targetYear, 
        targetMonth, 
        selectedFactory || undefined, 
        employeeQuery.trim() || undefined
      );
      
      console.log('APIレスポンス:', response);
      
      // APIレスポンスをMonthlySummaryRow形式に変換
      const apiData: MonthlySummaryRow[] = response.summaries.map((summary: any) => ({
        employee: summary.employee,
        factory_name: String(summary.factory_name), // 文字列に変換
        work_days: summary.work_days,
        standard_hours: summary.standard_hours,
        period1: summary.period1,
        period2: summary.period2,
        monthly: summary.monthly,
        actual_working_hours: summary.actual_working_hours,
        overtime_hours: summary.overtime_hours
      }));
      
      // 工場IDの昇順でソート（工場外、1工場、3工場、望岳台の順）
      const sortedData = apiData.sort((a, b) => {
        const getFactorySortOrder = (factoryName: string): number => {
          if (factoryName.includes('工場外')) return 0;
          if (factoryName.includes('1工場') || factoryName.includes('第1工場')) return 1;
          if (factoryName.includes('3工場') || factoryName.includes('第3工場')) return 2;
          if (factoryName.includes('望岳台')) return 3;
          // その他の工場は最後に配置
          return 999;
        };
        
        const orderA = getFactorySortOrder(a.factory_name);
        const orderB = getFactorySortOrder(b.factory_name);
        
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        
        // 同じ工場内では社員CDでソート
        return a.employee.employee_id.localeCompare(b.employee.employee_id);
      });
      
      console.log('変換されたデータ:', sortedData);
      setSummaryData(sortedData);
      
      if (apiData.length === 0) {
        console.log('該当する勤怠データが見つかりませんでした');
      }
    } catch (error) {
      console.error('集計データの取得に失敗:', error);
      // エラー時は空のデータを表示
      setSummaryData([]);
      alert('勤怠データの取得に失敗しました。条件を確認して再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  // リセット処理
  const handleReset = () => {
    setTargetYear(new Date().getFullYear());
    setTargetMonth(new Date().getMonth() + 1);
    setSelectedFactory('');
    setEmployeeQuery('');
    setSummaryData([]);
  };

  // CSV出力処理
  const handleExportCSV = () => {
    if (summaryData.length === 0) {
      alert('出力するデータがありません');
      return;
    }

    // CSVヘッダー
    const headers = [
      '工場', '社員CD', '氏名', '出勤日数', '所定時間',
      '1-16日_22:00-05:00', '1-16日_05:00-09:00', '1-16日_09:00-18:00', '1-16日_18:00-22:00', '1-16日_合計',
      '17-末日_22:00-05:00', '17-末日_05:00-09:00', '17-末日_09:00-18:00', '17-末日_18:00-22:00', '17-末日_合計',
      '月間_22:00-05:00', '月間_05:00-09:00', '月間_09:00-18:00', '月間_18:00-22:00', '月間_合計',
      '実労働時間', '残業時間'
    ];

    // CSVデータ
    const csvData = summaryData.map(row => [
      row.factory_name,
      row.employee.employee_id,
      row.employee.name,
      row.work_days,
      row.standard_hours.toFixed(1),
      row.period1.night.toFixed(1),
      row.period1.early.toFixed(1),
      row.period1.day.toFixed(1),
      row.period1.evening.toFixed(1),
      row.period1.total.toFixed(1),
      row.period2.night.toFixed(1),
      row.period2.early.toFixed(1),
      row.period2.day.toFixed(1),
      row.period2.evening.toFixed(1),
      row.period2.total.toFixed(1),
      row.monthly.night.toFixed(1),
      row.monthly.early.toFixed(1),
      row.monthly.day.toFixed(1),
      row.monthly.evening.toFixed(1),
      row.monthly.total.toFixed(1),
      row.actual_working_hours.toFixed(1),
      row.overtime_hours.toFixed(1)
    ]);

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
    link.setAttribute('download', `勤怠集計表_${targetYear}年${targetMonth}月.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        overflow: 'hidden' // 最上位ではスクロールを無効化
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
            勤怠集計表（月間）
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
          padding: '8px 20px 8px 20px', // 下部パディングを削減
          height: 'calc(100vh - 80px)', // ヘッダー分を引いた高さ
          overflowY: 'auto', // 縦スクロールを有効化
          overflowX: 'auto', // 横スクロールを有効化
          width: '100%',
          maxWidth: '100%'
        }}>

        {/* 検索条件 */}
        <Card sx={{ marginBottom: '8px' }} className="fade-in">
          <CardContent sx={{ padding: '8px 16px' }}>
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

              <Box sx={{ minWidth: '160px' }}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>工場</InputLabel>
                  <Select
                    value={selectedFactory}
                    onChange={(e) => setSelectedFactory(e.target.value)}
                    label="工場"
                    size="small"
                  >
                    <MenuItem value="">全て</MenuItem>
                    {factories.map((factory) => (
                      <MenuItem key={factory.id} value={factory.factory_id}>
                        {factory.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ minWidth: '200px' }}>
                <TextField
                  fullWidth
                  label="社員指定"
                  value={employeeQuery}
                  onChange={(e) => setEmployeeQuery(e.target.value)}
                  placeholder="社員コードまたは氏名"
                  variant="outlined"
                  size="small"
                />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'end' }}>
                  <Button
                    variant="contained"
                    onClick={handleSearch}
                    disabled={loading}
                    size="small"
                    sx={{ minWidth: '80px' }}
                  >
                    {loading ? '検索中...' : '表示更新'}
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleExportCSV}
                    size="small"
                    sx={{ minWidth: '80px' }}
                  >
                    CSV出力
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/admin')}
                    size="small"
                    sx={{ minWidth: '80px' }}
                  >
                    閉じる
                  </Button>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* 集計結果 */}
        {summaryData.length > 0 && (
          <Card sx={{ marginBottom: '8px', height: 'calc(100vh - 200px)', minHeight: '400px' }} className="fade-in-delay-1">
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '12px' }}>
              <Typography variant="h6" sx={{ marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>
                勤怠集計表 - {targetYear}年{targetMonth}月
              </Typography>
              
              <TableContainer component={Paper} sx={{ 
                overflowX: 'auto',
                overflowY: 'auto',
                width: '100%',
                maxWidth: '100%',
                height: 'calc(100vh - 250px)',
                minHeight: '300px',
                flex: 1,
                '&::-webkit-scrollbar': {
                  height: '8px',
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#f1f1f1',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#888',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: '#555',
                }
              }}>
                <Table size="small" sx={{ 
                  minWidth: 1600, // 最小幅をさらに増加
                  width: 'max-content', // コンテンツに応じて幅を調整
                  '& .MuiTableCell-root': {
                    borderRight: '1px dotted #d0d0d0',
                    whiteSpace: 'nowrap', // セル内のテキストを改行しない
                    '&:last-child': {
                      borderRight: 'none'
                    }
                  }
                }}>
                  <TableHead sx={{ 
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    backgroundColor: 'white'
                  }}>
                    <TableRow>
                      <TableCell rowSpan={2} sx={{ minWidth: 80, fontWeight: 'bold', backgroundColor: '#f5f5f5', position: 'sticky', top: 0, left: 0, zIndex: 15 }}>
                        工場
                      </TableCell>
                      <TableCell rowSpan={2} sx={{ minWidth: 80, fontWeight: 'bold', backgroundColor: '#f5f5f5', position: 'sticky', top: 0, left: '80px', zIndex: 15 }}>
                        社員CD
                      </TableCell>
                      <TableCell rowSpan={2} sx={{ minWidth: 120, fontWeight: 'bold', backgroundColor: '#f5f5f5', position: 'sticky', top: 0, left: '160px', zIndex: 15 }}>
                        氏名
                      </TableCell>
                      <TableCell rowSpan={2} sx={{ minWidth: 80, fontWeight: 'bold', backgroundColor: '#f5f5f5', position: 'sticky', top: 0, zIndex: 11 }}>
                        出勤<br />日数
                      </TableCell>
                      <TableCell rowSpan={2} sx={{ minWidth: 80, fontWeight: 'bold', backgroundColor: '#f5f5f5', position: 'sticky', top: 0, zIndex: 11 }}>
                        所定<br />時間
                      </TableCell>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#e3f2fd', position: 'sticky', top: 0, zIndex: 11 }}>
                        1-16日
                      </TableCell>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#e8f5e8', position: 'sticky', top: 0, zIndex: 11 }}>
                        17-末日
                      </TableCell>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fff3e0', position: 'sticky', top: 0, zIndex: 11 }}>
                        月間
                      </TableCell>
                      <TableCell rowSpan={2} sx={{ minWidth: 80, fontWeight: 'bold', backgroundColor: '#f5f5f5', position: 'sticky', top: 0, zIndex: 11 }}>
                        実労働<br />時間
                      </TableCell>
                      <TableCell rowSpan={2} sx={{ minWidth: 80, fontWeight: 'bold', backgroundColor: '#f5f5f5', position: 'sticky', top: 0, zIndex: 11 }}>
                        残業<br />時間
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      {/* 1-16日の時間帯ヘッダー */}
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#e3f2fd', minWidth: 70, position: 'sticky', top: '40px', zIndex: 12 }}>
                        22:00-<br />05:00
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#e3f2fd', minWidth: 70, position: 'sticky', top: '40px', zIndex: 12 }}>
                        05:00-<br />09:00
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#e3f2fd', minWidth: 70, position: 'sticky', top: '40px', zIndex: 12 }}>
                        09:00-<br />18:00
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#e3f2fd', minWidth: 70, position: 'sticky', top: '40px', zIndex: 12 }}>
                        18:00-<br />22:00
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#e3f2fd', minWidth: 70, position: 'sticky', top: '40px', zIndex: 12 }}>
                        合計
                      </TableCell>
                      {/* 17-末日の時間帯ヘッダー */}
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#e8f5e8', minWidth: 70, position: 'sticky', top: '40px', zIndex: 12 }}>
                        22:00-<br />05:00
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#e8f5e8', minWidth: 70, position: 'sticky', top: '40px', zIndex: 12 }}>
                        05:00-<br />09:00
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#e8f5e8', minWidth: 70, position: 'sticky', top: '40px', zIndex: 12 }}>
                        09:00-<br />18:00
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#e8f5e8', minWidth: 70, position: 'sticky', top: '40px', zIndex: 12 }}>
                        18:00-<br />22:00
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#e8f5e8', minWidth: 70, position: 'sticky', top: '40px', zIndex: 12 }}>
                        合計
                      </TableCell>
                      {/* 月間の時間帯ヘッダー */}
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fff3e0', minWidth: 70, position: 'sticky', top: '40px', zIndex: 12 }}>
                        22:00-<br />05:00
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fff3e0', minWidth: 70, position: 'sticky', top: '40px', zIndex: 12 }}>
                        05:00-<br />09:00
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fff3e0', minWidth: 70, position: 'sticky', top: '40px', zIndex: 12 }}>
                        09:00-<br />18:00
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fff3e0', minWidth: 70, position: 'sticky', top: '40px', zIndex: 12 }}>
                        18:00-<br />22:00
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fff3e0', minWidth: 70, position: 'sticky', top: '40px', zIndex: 12 }}>
                        合計
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summaryData.map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: '#f0f0f0', zIndex: 5 }}>{row.factory_name}</TableCell>
                        <TableCell sx={{ position: 'sticky', left: '80px', backgroundColor: '#f0f0f0', zIndex: 5 }}>{row.employee.employee_id}</TableCell>
                        <TableCell sx={{ position: 'sticky', left: '160px', backgroundColor: '#f0f0f0', zIndex: 5 }}>{row.employee.name}</TableCell>
                        <TableCell align="right">{row.work_days}</TableCell>
                        <TableCell align="right">{row.standard_hours.toFixed(1)}</TableCell>
                        {/* 1-16日のデータ */}
                        <TableCell align="right">{row.period1.night.toFixed(1)}</TableCell>
                        <TableCell align="right">{row.period1.early.toFixed(1)}</TableCell>
                        <TableCell align="right">{row.period1.day.toFixed(1)}</TableCell>
                        <TableCell align="right">{row.period1.evening.toFixed(1)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#e3f2fd' }}>
                          {row.period1.total.toFixed(1)}
                        </TableCell>
                        {/* 17-末日のデータ */}
                        <TableCell align="right">{row.period2.night.toFixed(1)}</TableCell>
                        <TableCell align="right">{row.period2.early.toFixed(1)}</TableCell>
                        <TableCell align="right">{row.period2.day.toFixed(1)}</TableCell>
                        <TableCell align="right">{row.period2.evening.toFixed(1)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#e8f5e8' }}>
                          {row.period2.total.toFixed(1)}
                        </TableCell>
                        {/* 月間のデータ */}
                        <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#fff3e0' }}>
                          {row.monthly.night.toFixed(1)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#fff3e0' }}>
                          {row.monthly.early.toFixed(1)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#fff3e0' }}>
                          {row.monthly.day.toFixed(1)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#fff3e0' }}>
                          {row.monthly.evening.toFixed(1)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#fff3e0' }}>
                          {row.monthly.total.toFixed(1)}
                        </TableCell>
                        <TableCell align="right">{row.actual_working_hours.toFixed(1)}</TableCell>
                        <TableCell align="right">{row.overtime_hours.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default MonthlySummaryPage;
