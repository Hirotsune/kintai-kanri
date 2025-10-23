import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Radio,
  RadioGroup,
  Alert,
  CircularProgress,
  Fade,
  IconButton
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';
import { format } from 'date-fns';
import { factoryApi, lineApi, reportApi } from '../services/api';
import { Factory, Line } from '../types';
import Header from '../components/Header';

interface CheckRow {
  employee_id: string;
  employee_name: string;
  punch1: string; // 出社
  punch2: string; // 昼休出１
  punch3: string; // 昼休入１
  punch4: string; // 昼休出２
  punch5: string; // 昼休入２
  punch6: string; // 退社
  work_time: string;
  has_error: boolean;
  missing_punches: string[];
}

interface ErrorListData {
  date: string;
  factory_id?: string;
  line_id?: string;
  mode: string;
  total_employees: number;
  check_rows: CheckRow[];
}

const ErrorListPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedFactory, setSelectedFactory] = useState<string>('');
  const [selectedLine, setSelectedLine] = useState<string>('');
  const [displayMode, setDisplayMode] = useState<'checklist' | 'errorlist'>('checklist');
  const [factories, setFactories] = useState<Factory[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [errorListData, setErrorListData] = useState<ErrorListData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noDataMessage, setNoDataMessage] = useState<string | null>(null);

  // 工場データの読み込み
  useEffect(() => {
    const loadFactories = async () => {
      try {
        const data = await factoryApi.getAll();
        const activeFactories = data.filter(factory => factory.is_active).sort((a, b) => a.id - b.id);
        setFactories(activeFactories);
      } catch (err) {
        console.error('工場データの読み込みに失敗しました:', err);
      }
    };
    loadFactories();
  }, []);

  // ラインデータの読み込み（工場選択時）
  useEffect(() => {
    const loadLines = async () => {
      if (selectedFactory) {
        try {
          const data = await lineApi.getAll();
          const filteredLines = data.filter(line => line.factory_id === selectedFactory && line.is_active);
          setLines(filteredLines.sort((a, b) => a.id - b.id));
        } catch (err) {
          console.error('ラインデータの読み込みに失敗しました:', err);
        }
      } else {
        setLines([]);
      }
      setSelectedLine(''); // 工場変更時はライン選択をリセット
    };
    loadLines();
  }, [selectedFactory]);

  // 勤怠チェックリストデータの取得
  const fetchErrorListData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoDataMessage(null);
    
    try {
      const data = await reportApi.getErrorList(
        format(selectedDate, 'yyyy-MM-dd'),
        selectedFactory || undefined,
        selectedLine || undefined,
        displayMode
      );
      
      // 社員コードでソート
      if (data && data.check_rows) {
        data.check_rows.sort((a: CheckRow, b: CheckRow) => {
          // 社員コードを数値として比較（文字列の場合は数値に変換）
          const aId = parseInt(a.employee_id) || 0;
          const bId = parseInt(b.employee_id) || 0;
          return aId - bId;
        });
      }
      
      setErrorListData(data);
      
      
      // データがない場合のメッセージを設定
      if (!data || !data.check_rows || data.check_rows.length === 0) {
        setNoDataMessage(displayMode === 'errorlist' ? '打刻エラーはありません' : '表示するデータがありません');
      }
    } catch (err) {
      setError('勤怠チェックリストの取得に失敗しました');
      console.error('Error fetching error list data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedFactory, selectedLine, displayMode]);

  // 検索実行
  const handleSearch = () => {
    fetchErrorListData();
  };

  // リセット
  const handleReset = () => {
    setSelectedDate(new Date());
    setSelectedFactory('');
    setSelectedLine('');
    setDisplayMode('checklist');
    setErrorListData(null);
    setError(null);
    setNoDataMessage(null);
  };

  // 表示日付のフォーマット
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdayMap = ['日', '月', '火', '水', '木', '金', '土'];
    return `${format(date, 'yyyy年M月d日')}(${weekdayMap[date.getDay()]})`;
  };

  // 打刻漏れのセルスタイル
  const getPunchCellStyle = (punch: string) => {
    if (!punch) {
      return {
        backgroundColor: '#fff3e0',
        color: '#e65100'
      };
    }
    return {};
  };

  // エラーセルのスタイル
  const getErrorCellStyle = (hasError: boolean) => {
    if (hasError) {
      return {
        backgroundColor: '#ffebee',
        color: '#c62828',
        fontWeight: 'bold'
      };
    }
    return {};
  };

  // CSV出力処理
  const handleExportCSV = () => {
    if (!errorListData || !errorListData.check_rows || errorListData.check_rows.length === 0) {
      alert('出力するデータがありません');
      return;
    }

    // ヘッダー行を生成
    const headers = [
      '社員ID', '氏名', '工場', 'ライン', '出勤日',
      '出社', '昼休出1', '昼休入1', '昼休出2', '昼休入2', '退社',
      '勤務時間', 'エラー内容'
    ];
    
    // データ行を生成
    const csvData = errorListData.check_rows.map(row => [
      row.employee_id,
      row.employee_name,
      '', // factory_name (CheckRowには存在しない)
      '', // line_name (CheckRowには存在しない)
      errorListData.date, // work_date (CheckRowには存在しない、errorListDataから取得)
      row.punch1 || '', // clock_in_time
      row.punch2 || '', // lunch_out1_time
      row.punch3 || '', // lunch_in1_time
      row.punch4 || '', // lunch_out2_time
      row.punch5 || '', // lunch_in2_time
      row.punch6 || '', // clock_out_time
      row.work_time || '', // total_work_time
      row.has_error ? row.missing_punches.join(', ') : ''
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
    const dateStr = selectedDate ? selectedDate.toLocaleDateString('ja-JP').replace(/\//g, '') : 'unknown';
    link.setAttribute('download', `勤怠チェックエラーリスト_${dateStr}.csv`);
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
            勤怠チェック・エラーリスト
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
        
        <Box sx={{ 
          padding: '8px 20px 20px 20px', 
          width: '100%',
          height: 'calc(100vh - 120px)',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          {/* 検索条件 */}
          <Paper sx={{ padding: '12px 16px', marginBottom: '12px', width: '100%' }} className="fade-in">
            
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'end'
            }}>
              <Box sx={{ minWidth: '180px' }}>
              <DatePicker
                label="対象年月"
                value={selectedDate}
                onChange={(newValue) => newValue && setSelectedDate(newValue)}
                format="yyyy年M月d日"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />
              </Box>
              
              <Box sx={{ minWidth: '160px' }}>
              <FormControl fullWidth size="small">
                <InputLabel>工場選択</InputLabel>
                <Select
                  value={selectedFactory}
                  onChange={(e) => setSelectedFactory(e.target.value)}
                  label="工場選択"
                >
                  <MenuItem value="">全て</MenuItem>
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
                >
                  <MenuItem value="">未選択</MenuItem>
                  {lines.map((line) => (
                    <MenuItem key={line.line_id} value={line.line_id}>
                      {line.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              </Box>

              {/* ボタン */}
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'end' }}>
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
                  onClick={handleExportCSV}
                  size="small"
                  sx={{ minWidth: '80px' }}
                >
                  CSV出力
                </Button>
                
                {/* 表示モード選択 */}
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'end', marginLeft: '16px' }}>
                  <RadioGroup
                    row
                    value={displayMode}
                    onChange={(e) => setDisplayMode(e.target.value as 'checklist' | 'errorlist')}
                  >
                    <FormControlLabel 
                      value="checklist" 
                      control={<Radio size="small" />} 
                      label="チェックリスト" 
                      sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                    />
                    <FormControlLabel 
                      value="errorlist" 
                      control={<Radio size="small" />} 
                      label="エラーリスト" 
                      sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                    />
                  </RadioGroup>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* エラー表示 */}
          {error && (
            <Alert severity="error" sx={{ marginBottom: '20px' }}>
              {error}
            </Alert>
          )}

          {/* 勤怠チェックリスト */}
          {errorListData && (
            <Paper sx={{ padding: '20px', width: '100%' }} className="fade-in-delay-1">
              {/* ヘッダー */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #003366' }}>
                <Box>
                </Box>
                <Box sx={{ textAlign: 'right', fontSize: '0.9rem', color: '#666' }}>
                  <div>印刷日時：{format(new Date(), 'yyyy年M月d日 HH:mm')}</div>
                  <div>ページ：1/1</div>
                </Box>
              </Box>

              {/* フィルター情報 */}
              <Box sx={{ backgroundColor: '#f5f5f5', padding: '10px', marginBottom: '20px', borderRadius: '5px' }}>
                <Typography variant="body2">
                  工場：{selectedFactory ? factories.find(f => f.factory_id === selectedFactory)?.name || '未選択' : '未選択'}　
                  ライン：{selectedLine ? lines.find(l => l.line_id === selectedLine)?.name || '未選択' : '未選択'}　
                  表示モード：{displayMode === 'errorlist' ? 'エラーリスト' : 'チェックリスト'}
                </Typography>
              </Box>

              {/* テーブル */}
              <TableContainer sx={{ 
                maxHeight: 'calc(100vh - 400px)',
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
              }}>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead sx={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                    <TableRow>
                      <TableCell sx={{ 
                        fontWeight: 'bold', 
                        textAlign: 'center', 
                        width: '60px',
                        padding: '8px 4px',
                        fontSize: '0.875rem'
                      }}>社員</TableCell>
                      <TableCell sx={{ 
                        fontWeight: 'bold', 
                        textAlign: 'left', 
                        width: '100px',
                        padding: '8px 4px',
                        fontSize: '0.875rem'
                      }}>名前</TableCell>
                      <TableCell sx={{ 
                        fontWeight: 'bold', 
                        textAlign: 'center', 
                        width: '60px',
                        padding: '8px 4px',
                        fontSize: '0.875rem'
                      }}>出社</TableCell>
                      <TableCell sx={{ 
                        fontWeight: 'bold', 
                        textAlign: 'center', 
                        width: '60px',
                        padding: '8px 4px',
                        fontSize: '0.875rem'
                      }}>昼休出１</TableCell>
                      <TableCell sx={{ 
                        fontWeight: 'bold', 
                        textAlign: 'center', 
                        width: '60px',
                        padding: '8px 4px',
                        fontSize: '0.875rem'
                      }}>昼休入１</TableCell>
                      <TableCell sx={{ 
                        fontWeight: 'bold', 
                        textAlign: 'center', 
                        width: '60px',
                        padding: '8px 4px',
                        fontSize: '0.875rem'
                      }}>昼休出２</TableCell>
                      <TableCell sx={{ 
                        fontWeight: 'bold', 
                        textAlign: 'center', 
                        width: '60px',
                        padding: '8px 4px',
                        fontSize: '0.875rem'
                      }}>昼休入２</TableCell>
                      <TableCell sx={{ 
                        fontWeight: 'bold', 
                        textAlign: 'center', 
                        width: '60px',
                        padding: '8px 4px',
                        fontSize: '0.875rem'
                      }}>退社</TableCell>
                      <TableCell sx={{ 
                        fontWeight: 'bold', 
                        textAlign: 'center', 
                        width: '80px',
                        padding: '8px 4px',
                        fontSize: '0.875rem'
                      }}>勤怠時間</TableCell>
                      <TableCell sx={{ 
                        fontWeight: 'bold', 
                        textAlign: 'center', 
                        width: '80px',
                        padding: '8px 4px',
                        fontSize: '0.875rem'
                      }}>エラー</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {errorListData.check_rows.map((row, index) => (
                      <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                        <TableCell sx={{ 
                          textAlign: 'center',
                          padding: '6px 4px',
                          fontSize: '0.875rem'
                        }}>{row.employee_id}</TableCell>
                        <TableCell sx={{ 
                          textAlign: 'left', 
                          paddingLeft: '8px',
                          padding: '6px 4px',
                          fontSize: '0.875rem'
                        }}>{row.employee_name}</TableCell>
                        <TableCell sx={{ 
                          textAlign: 'center', 
                          padding: '6px 4px',
                          fontSize: '0.875rem',
                          ...getPunchCellStyle(row.punch1) 
                        }}>{row.punch1}</TableCell>
                        <TableCell sx={{ 
                          textAlign: 'center', 
                          padding: '6px 4px',
                          fontSize: '0.875rem',
                          ...getPunchCellStyle(row.punch2) 
                        }}>{row.punch2}</TableCell>
                        <TableCell sx={{ 
                          textAlign: 'center', 
                          padding: '6px 4px',
                          fontSize: '0.875rem',
                          ...getPunchCellStyle(row.punch3) 
                        }}>{row.punch3}</TableCell>
                        <TableCell sx={{ 
                          textAlign: 'center', 
                          padding: '6px 4px',
                          fontSize: '0.875rem',
                          ...getPunchCellStyle(row.punch4) 
                        }}>{row.punch4}</TableCell>
                        <TableCell sx={{ 
                          textAlign: 'center', 
                          padding: '6px 4px',
                          fontSize: '0.875rem',
                          ...getPunchCellStyle(row.punch5) 
                        }}>{row.punch5}</TableCell>
                        <TableCell sx={{ 
                          textAlign: 'center', 
                          padding: '6px 4px',
                          fontSize: '0.875rem',
                          ...getPunchCellStyle(row.punch6) 
                        }}>{row.punch6}</TableCell>
                        <TableCell sx={{ 
                          textAlign: 'center',
                          padding: '6px 4px',
                          fontSize: '0.875rem'
                        }}>{row.work_time}</TableCell>
                        <TableCell sx={{ 
                          textAlign: 'center', 
                          padding: '6px 4px',
                          fontSize: '0.875rem',
                          ...getErrorCellStyle(row.has_error) 
                        }}>
                            {row.has_error ? '打刻漏れ' : ''}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
          
          {/* データなしメッセージ */}
          <Fade in={!!noDataMessage} timeout={300}>
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
              display: noDataMessage ? 'block' : 'none',
              minWidth: '300px',
              textAlign: 'center'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>{noDataMessage}</Box>
                <IconButton
                  onClick={() => setNoDataMessage(null)}
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

export default ErrorListPage;
