import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { attendanceApi, employeeApi, factoryApi, lineApi, deviceConfigApi } from '../services/api';
import { Employee, Factory, Line } from '../types';
import { useDeviceConfig } from '../hooks/useDeviceConfig';
import ShiftSelectionDialog from '../components/ShiftSelectionDialog';
import '../styles/custom.css';

const PunchPage: React.FC = () => {
  const navigate = useNavigate();
  const { config, loading: configLoading, error: configError } = useDeviceConfig();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [employeeCode, setEmployeeCode] = useState('');
  const [employeeInfo, setEmployeeInfo] = useState<Employee | null>(null);
  const [selectedFactory, setSelectedFactory] = useState<Factory | null>(null);
  const [selectedLine, setSelectedLine] = useState<Line | null>(null);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<{
    clockIn: boolean;
    lunchOut1: boolean;
    lunchIn1: boolean;
    lunchOut2: boolean;
    lunchIn2: boolean;
    clockOut: boolean;
  }>({
    clockIn: false,
    lunchOut1: false,
    lunchIn1: false,
    lunchOut2: false,
    lunchIn2: false,
    clockOut: false
  });
  
  // シフト選択関連の状態
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState<{ startTime: string; duration: string } | null>(null);
  const [shiftInputEnabled, setShiftInputEnabled] = useState(false);
  
  // ライン選択ダイアログの状態
  const [showLineSelectionDialog, setShowLineSelectionDialog] = useState(false);
  const [isClockOutCompleted, setIsClockOutCompleted] = useState(false);
  const [lineSelectionError, setLineSelectionError] = useState<string | null>(null);
  const [currentPunchType, setCurrentPunchType] = useState<string>('');
  
  // 音声読み上げ完了後の表示制御
  const [showConfirmationButtons, setShowConfirmationButtons] = useState(false);
  
  // 社員コード確認ダイアログの状態
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [pendingEmployee, setPendingEmployee] = useState<Employee | null>(null);
  const [lastSpokenError, setLastSpokenError] = useState<string | null>(null);

  // 現在時刻の更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 音声リストの読み込み
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        listAvailableVoices();
      };
      
      if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.addEventListener('voiceschanged', loadVoices);
        return () => {
          speechSynthesis.removeEventListener('voiceschanged', loadVoices);
        };
      } else {
        loadVoices();
      }
    }
  }, []);

  // シフト入力機能の状態を取得（端末設定から）
  useEffect(() => {
    const loadShiftInputSetting = async () => {
      try {
        // URLパラメータから端末IDを取得
        const urlParams = new URLSearchParams(window.location.search);
        const deviceId = urlParams.get('device') || 'DEFAULT';
        const response = await deviceConfigApi.getShiftInputEnabled(deviceId);
        setShiftInputEnabled(response.shift_input_enabled);
      } catch (error) {
        console.error('シフト設定の取得に失敗:', error);
        // 端末IDが見つからない場合はデフォルトで有効にする
        setShiftInputEnabled(true);
      }
    };
    
    loadShiftInputSetting();
  }, []);

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
        setMessage({ type: 'error', text: '工場データの取得に失敗しました' });
      }
    };

    loadFactories();
  }, []);

  // 端末設定に基づくライン表示
  useEffect(() => {
    if (config && config.show_line_selection && config.display_lines) {
      // 端末設定で指定されたラインを表示（Line型に変換）
      const convertedLines: Line[] = config.display_lines.map(line => ({
        id: line.id,
        line_id: line.line_id, // データベースの実際のline_idを使用
        name: line.name,
        factory_id: line.factory_id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      setLines(convertedLines);
    } else if (config && !config.show_line_selection) {
      // ライン選択が無効な場合は空配列
      setLines([]);
    }
  }, [config]);

  // 時刻・日付のフォーマット
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${weekdays[date.getDay()]}）`;
  };

  // 数字キーパッドの処理
  const addNumber = (num: string) => {
    if (employeeCode.length < 5) {
      setEmployeeCode(employeeCode + num);
    }
  };

  const clearInput = () => {
    setEmployeeCode(employeeCode.slice(0, -1));
  };

  const clearAll = () => {
    setEmployeeCode('');
    setEmployeeInfo(null);
    setSelectedFactory(null);
    setSelectedLine(null);
    setSelectedShift(null); // シフト情報もリセット
    setMessage(null);
    setAttendanceStatus({
      clockIn: false,
      lunchOut1: false,
      lunchIn1: false,
      lunchOut2: false,
      lunchIn2: false,
      clockOut: false
    });
  };

  // 当日の勤怠状況をチェック
  const checkAttendanceStatus = async (employeeCode: string) => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD形式
      const attendance = await attendanceApi.getByEmployeeAndDate(employeeCode, today);
      
      // 横型テーブルでは1行に1日分のデータが入っている
      const attendanceRecord = attendance.length > 0 ? attendance[0] : null;
      
      const status = {
        clockIn: attendanceRecord?.clock_in_time != null,
        lunchOut1: attendanceRecord?.lunch_out1_time != null,
        lunchIn1: attendanceRecord?.lunch_in1_time != null,
        lunchOut2: attendanceRecord?.lunch_out2_time != null,
        lunchIn2: attendanceRecord?.lunch_in2_time != null,
        clockOut: attendanceRecord?.clock_out_time != null
      };
      
      setAttendanceStatus(status);
    } catch (err) {
      console.error('勤怠状況の取得に失敗:', err);
      // エラー時は全てfalseにリセット
      setAttendanceStatus({
        clockIn: false,
        lunchOut1: false,
        lunchIn1: false,
        lunchOut2: false,
        lunchIn2: false,
        clockOut: false
      });
    }
  };

  // 当日の勤怠状況をチェックして結果を返す（横型テーブル対応）
  const checkAttendanceStatusAndReturn = async (employeeCode: string) => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD形式
      const attendance = await attendanceApi.getByEmployeeAndDate(employeeCode, today);
      
      // 横型テーブルでは1行に1日分のデータが入っている
      const attendanceRecord = attendance.length > 0 ? attendance[0] : null;
      
      const status = {
        clockIn: attendanceRecord?.clock_in_time != null,
        lunchOut1: attendanceRecord?.lunch_out1_time != null,
        lunchIn1: attendanceRecord?.lunch_in1_time != null,
        lunchOut2: attendanceRecord?.lunch_out2_time != null,
        lunchIn2: attendanceRecord?.lunch_in2_time != null,
        clockOut: attendanceRecord?.clock_out_time != null
      };
      
      // 状態も更新
      setAttendanceStatus(status);
      
      return status;
    } catch (err) {
      console.error('勤怠状況の取得に失敗:', err);
      // エラー時は全てfalseにリセット
      const errorStatus = {
        clockIn: false,
        lunchOut1: false,
        lunchIn1: false,
        lunchOut2: false,
        lunchIn2: false,
        clockOut: false
      };
      setAttendanceStatus(errorStatus);
      return errorStatus;
    }
  };

  // 音声設定の状態管理
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 0.8,
    pitch: 1.0,
    volume: 1.0,
    preferredVoice: 'auto' // 'auto', 'female', 'male'
  });

  // 利用可能な音声の確認機能
  const listAvailableVoices = () => {
    const voices = speechSynthesis.getVoices();
    console.log('利用可能な日本語音声:');
    voices.filter(voice => voice.lang === 'ja-JP').forEach(voice => {
      console.log(`- ${voice.name} (${voice.lang})`);
    });
  };

  // 設定に基づく音声選択
  const selectJapaneseVoice = (preference: string) => {
    const voices = speechSynthesis.getVoices();
    const japaneseVoices = voices.filter(voice => voice.lang === 'ja-JP');
    
    switch (preference) {
      case 'female':
        return japaneseVoices.find(voice => 
          voice.name.toLowerCase().includes('haruka') ||
          voice.name.toLowerCase().includes('female') ||
          voice.name.toLowerCase().includes('woman')
        );
      case 'male':
        return japaneseVoices.find(voice => 
          voice.name.toLowerCase().includes('ichiro') ||
          voice.name.toLowerCase().includes('male') ||
          voice.name.toLowerCase().includes('man')
        );
      default:
        return japaneseVoices.find(voice => 
          voice.name.includes('Microsoft Haruka') ||
          voice.name.includes('Microsoft Ichiro') ||
          voice.name.includes('Enhanced') ||
          voice.name.includes('Natural') ||
          voice.name.includes('Premium')
        ) || japaneseVoices[0];
    }
  };

  // 音声読み上げ機能（改善版）
  const speakText = (text: string, onEnd?: () => void) => {
    if ('speechSynthesis' in window) {
      // 既存の音声を停止
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = voiceSettings.rate;
      utterance.pitch = voiceSettings.pitch;
      utterance.volume = voiceSettings.volume;
      
      // より自然な日本語音声を選択
      const japaneseVoice = selectJapaneseVoice(voiceSettings.preferredVoice);
      if (japaneseVoice) {
        utterance.voice = japaneseVoice;
      }
      
      // 音声終了時のコールバック
      if (onEnd) {
        utterance.onend = onEnd;
      }
      
      speechSynthesis.speak(utterance);
    } else if (onEnd) {
      // 音声合成が利用できない場合は即座にコールバックを実行
      onEnd();
    }
  };

  // 社員コード確定
  const confirmCode = async () => {
    if (!employeeCode.trim()) {
      setMessage({ type: 'error', text: '社員コードを入力してください' });
      speakText('社員コードを入力してください');
      return;
    }

    try {
      const employees = await employeeApi.getAll();
      const employee = employees.find(emp => emp.employee_id === employeeCode.trim());
      
      if (employee) {
        // 社員が見つかった場合、確認ダイアログを表示
        setPendingEmployee(employee);
        setShowConfirmationDialog(true);
        setMessage(null);
        setShowConfirmationButtons(false); // 確認ボタンを一旦非表示
        
        // 音声読み上げ（ひらがな名があればそれを使用、なければ通常の名前）
        const nameToSpeak = employee.name_kana || employee.name;
        // 「さんですか？」を付けて質問調に
        const finalName = `${nameToSpeak}さんですか？`;
        
        // 音声読み上げ完了後に確認ボタンを表示
        speakText(finalName, () => {
          setShowConfirmationButtons(true);
        });
        
        // 確認ダイアログを表示（シフト選択は「はい」選択後に処理）
      } else {
        // 社員が見つからない場合、エラー音声を一回だけ再生
        const errorMessage = '社員コードが見つかりません';
        if (lastSpokenError !== errorMessage) {
          speakText(errorMessage);
          setLastSpokenError(errorMessage);
        }
        setMessage({ type: 'error', text: errorMessage });
        setEmployeeInfo(null);
        // 勤怠状況をリセット
        setAttendanceStatus({
          clockIn: false,
          lunchOut1: false,
          lunchIn1: false,
          lunchOut2: false,
          lunchIn2: false,
          clockOut: false
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: '社員情報の取得に失敗しました' });
    }
  };

  // 社員コード確認ダイアログの処理
  const handleConfirmationYes = async () => {
    if (pendingEmployee) {
      setEmployeeInfo(pendingEmployee);
      setShowConfirmationDialog(false);
      setPendingEmployee(null);
      setShowConfirmationButtons(false); // 確認ボタンの表示状態もリセット
      
      // 勤怠状況をチェックして、その結果に基づいてシフト選択を判定
      const currentAttendanceStatus = await checkAttendanceStatusAndReturn(pendingEmployee.employee_id);
      
      // シフト入力が有効で、かつ出社が押されていない社員限定でシフト選択ダイアログを表示
      if (shiftInputEnabled && !currentAttendanceStatus.clockIn) {
        setShowShiftDialog(true);
      }
    }
  };

  const handleConfirmationNo = () => {
    // 社員コードを全消去
    setEmployeeCode('');
    setEmployeeInfo(null);
    setShowConfirmationDialog(false);
    setPendingEmployee(null);
    setMessage(null);
    setShowConfirmationButtons(false); // 確認ボタンの表示状態もリセット
    
    // 勤怠状況をリセット
    setAttendanceStatus({
      clockIn: false,
      lunchOut1: false,
      lunchIn1: false,
      lunchOut2: false,
      lunchIn2: false,
      clockOut: false
    });
  };

  // 打刻処理
  const punchTime = async (punchType: string) => {
    if (!employeeInfo) {
      setMessage({ type: 'error', text: '先に社員コードを確定してください' });
      return;
    }

    // 退社時、昼休入１、昼休入２の場合はライン選択ダイアログを表示
    if (punchType === '退社' || punchType === '昼休入１' || punchType === '昼休入２') {
      setCurrentPunchType(punchType);
      setShowLineSelectionDialog(true);
      return;
    }

    // 退社以外の打刻処理
    try {
      const punchData = {
        employee_id: employeeInfo.employee_id,
        punch_type: punchType,
        factory_id: employeeInfo.factory_id,
        line_id: employeeInfo.line_id
      };

      await attendanceApi.punch(punchData);
        setMessage({ type: 'success', text: `${punchType}打刻が完了しました` });
      
      // 打刻完了の音声読み上げ
      speakText(`${punchType}打刻が完了しました`);
      
      // 勤怠状況を再取得
      await checkAttendanceStatus(employeeInfo.employee_id);
      
      // 打刻完了後、2秒後に社員情報をリセット
      setTimeout(() => {
        setMessage(null);
        clearAll(); // 社員番号と名前をリセット
      }, 2000);
    } catch (error) {
      console.error('打刻エラー:', error);
      setMessage({ type: 'error', text: '打刻に失敗しました' });
      speakText('打刻に失敗しました');
    }
  };

  // ライン選択完了処理（退社、昼休入１、昼休入２対応）
  const handleLineSelectionComplete = async (selectedLine: Line) => {
    if (!employeeInfo) return;

    // エラー状態をリセット
    setLineSelectionError(null);

    try {
      const punchData = {
        employee_id: employeeInfo.employee_id,
        punch_type: currentPunchType,
        factory_id: employeeInfo.factory_id, // 従業員のデフォルト工場を使用
        line_id: selectedLine.line_id
      };

      const result = await attendanceApi.punch(punchData);
      
      // 処理完了状態を設定
      setIsClockOutCompleted(true);
      
      // 完了の音声読み上げ
      speakText(`${currentPunchType}打刻が完了しました`);
      
      // 勤怠状況を再取得
      await checkAttendanceStatus(employeeInfo.employee_id);
      
      // 2秒後に画面をリセット
      setTimeout(() => {
        setShowLineSelectionDialog(false);
        setIsClockOutCompleted(false);
        setLineSelectionError(null);
        setCurrentPunchType('');
        clearAll(); // 社員番号と名前をリセット
      }, 2000);
    } catch (error) {
      console.error(`${currentPunchType}打刻エラー:`, error);
      setLineSelectionError(`${currentPunchType}打刻に失敗しました`);
      speakText(`${currentPunchType}打刻に失敗しました`);
      // エラー時は3秒後にダイアログを閉じる
      setTimeout(() => {
        setShowLineSelectionDialog(false);
        setIsClockOutCompleted(false);
        setLineSelectionError(null);
        setCurrentPunchType('');
      }, 3000);
    }
  };

  // ライン選択ダイアログを閉じる
  const handleLineSelectionCancel = () => {
    setShowLineSelectionDialog(false);
    setCurrentPunchType('');
  };

  // 工場選択
  const selectFactory = (factory: Factory) => {
    setSelectedFactory(factory);
    setSelectedLine(null); // 工場変更時はラインをリセット
  };

  // ライン選択
  const selectLine = (line: Line) => {
    setSelectedLine(line);
    
    // 退社時のライン選択ダイアログが表示されている場合は、ライン選択後に自動的に退社処理を実行
    if (showLineSelectionDialog && employeeInfo) {
      handleLineSelectionComplete(line);
    }
  };

  // シフト選択ダイアログのハンドラー
  const handleShiftConfirm = (startTime: string, duration: string) => {
    setSelectedShift({ startTime, duration });
    setShowShiftDialog(false); // シフト選択ダイアログを閉じる
  };

  const handleShiftDialogClose = () => {
    setShowShiftDialog(false);
  };

  // 画面更新処理
  const handleRefresh = async () => {
    try {
      // 工場データを再取得
      const factoryData = await factoryApi.getAll();
      const activeFactories = factoryData.filter(factory => factory.is_active).sort((a, b) => a.id - b.id);
      setFactories(activeFactories);
      
      // 選択された工場がある場合はラインも再取得
      if (selectedFactory) {
        const lineData = await lineApi.getAll();
        const factoryLines = lineData.filter(line => 
          line.factory_id === selectedFactory.factory_id && line.is_active
        );
        setLines(factoryLines.sort((a, b) => a.id - b.id));
      }
      
      // 社員情報がある場合は勤怠状況を再取得
      if (employeeCode && selectedFactory && selectedLine) {
        await checkAttendanceStatus(employeeCode);
      }
      
      setMessage({ type: 'success', text: '画面を更新しました' });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error('画面更新に失敗:', error);
      setMessage({ type: 'error', text: '画面更新に失敗しました' });
    }
  };

  return (
    <Box 
      className="punch-page-scrollbar"
      sx={{ 
        padding: 0, 
        margin: 0, 
        width: '100%', 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto', // 縦スクロールを有効にする
      }}>

      {/* 設定エラー表示 */}
      {configError && (
        <div className="card flash-message flash-error" style={{
          margin: '10px',
          padding: '15px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          color: '#721c24',
          flexShrink: 0 // 高さを固定してカードの高さに影響しないようにする
        }}>
          <strong>設定エラー</strong><br />
          設定の読み込みに失敗しました<br />
          管理者にお問い合わせください。
        </div>
      )}

      {/* メッセージ表示 - 非表示（時計部分で表示） */}
      {/* {message && (
        <div className={`card flash-message ${message.type === 'success' ? 'flash-success' : 'flash-error'}`} style={{
          margin: '10px',
          padding: '15px',
          backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
          border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
          color: message.type === 'success' ? '#155724' : '#721c24',
          flexShrink: 0 // 高さを固定してカードの高さに影響しないようにする
        }}>
            {message.text}
        </div>
      )} */}

      <Box sx={{ 
        display: 'flex', 
        flex: 1, 
        height: 'calc(100vh - 40px)', // メッセージ分の高さを除いて画面いっぱいに
        gap: '20px',
        padding: '20px'
      }}>
        
        {/* 左側: 数字キーパッド */}
        <div className="card fade-in" style={{ 
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 'calc(100vh - 80px)' // パディング分を除いて画面いっぱいに
        }}>
          <div style={{ 
            padding: '20px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
            <input 
              type="text" 
              value={(() => {
                if (!employeeCode) return '';
                // シフトが選択されている場合のみシフト情報を表示
                if (selectedShift && showShiftDialog === false) {
                  const durationText = selectedShift.duration === '6H_break' ? '6H勤務' : `${selectedShift.duration}勤務`;
                  return `${employeeCode} ${selectedShift.startTime}出勤-${durationText}`;
                }
                return employeeCode;
              })()}
                placeholder="例: 1234"
              readOnly
                style={{
                  width: '100%',
                  padding: '15px',
                  fontSize: '24px',
                  textAlign: 'center',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  boxSizing: 'border-box'
                }}
              />
              
              {/* 社員名表示 */}
              <div style={{
                width: '100%',
                padding: '15px',
                fontSize: 'clamp(18px, 3.5vw, 28px)',
                textAlign: 'center',
                backgroundColor: employeeInfo ? '#e3f2fd' : '#f5f5f5',
                border: employeeInfo ? '2px solid #2196f3' : '2px solid #ddd',
                borderRadius: '8px',
                marginBottom: '10px',
                boxSizing: 'border-box',
                fontWeight: 'bold',
                color: employeeInfo ? '#1976d2' : '#666',
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {employeeInfo ? employeeInfo.name : ''}
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '10px',
                marginBottom: '10px'
              }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    className="btn btn-secondary"
                    onClick={() => addNumber(num.toString())}
                    style={{ 
                      fontSize: 'clamp(24px, 5vw, 40px)',
                      minHeight: '80px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {num}
                  </button>
                ))}
          </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr', 
                gap: '10px',
                marginBottom: '20px'
              }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => addNumber('0')}
                  style={{ 
                    fontSize: 'clamp(24px, 5vw, 40px)',
                    minHeight: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  0
                </button>
                <button
                  className="btn btn-danger"
                  onClick={clearInput}
                  style={{ 
                    fontSize: 'clamp(20px, 4vw, 32px)',
                    minHeight: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  C
                </button>
                <button
                  className="btn btn-primary"
                  onClick={confirmCode}
                  style={{ 
                    fontSize: 'clamp(18px, 3.5vw, 28px)',
                    minHeight: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  確定
                </button>
          </div>
        </div>

            <button
              onClick={clearAll}
              style={{ 
                fontSize: 'clamp(18px, 3.5vw, 28px)',
                minHeight: '80px',
                width: '100%',
                backgroundColor: '#e91e63',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              すべて消去
            </button>
          </div>
          </div>
          
        {/* 中央: 時刻表示と打刻ボタン */}
        <div className="card fade-in-delay-1" style={{ 
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 'calc(100vh - 80px)' // パディング分を除いて画面いっぱいに
        }}>
          <div style={{ 
            padding: '20px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ 
                textAlign: 'center', 
                marginBottom: '30px',
                padding: '20px',
                backgroundColor: message ? (message.type === 'success' ? '#d4edda' : '#f8d7da') : '#f8f9fa',
                borderRadius: '8px',
                border: message ? `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}` : 'none',
                minHeight: '120px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {message ? (
                  <div style={{
                    fontSize: 'clamp(20px, 4vw, 32px)',
                    fontWeight: 'bold',
                    color: message.type === 'success' ? '#155724' : '#721c24',
                    textAlign: 'center',
                    lineHeight: '1.2'
                  }}>
                    {message.text}
                  </div>
                ) : (
                  <>
                    <div style={{ 
                      fontSize: '36px', 
                      fontWeight: 'bold', 
                      color: '#007bff',
                      marginBottom: '10px'
                    }}>
                      {formatTime(currentTime)}
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      color: '#6c757d'
                    }}>
                      {formatDate(currentTime)}
                    </div>
                  </>
                )}
              </div>

              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px',
                flex: 1,
                overflow: 'hidden',
                paddingBottom: '20px'
              }}>
                {config && config.punch_buttons && config.punch_buttons.includes('出社') && (
            <button 
                    className="btn btn-primary" 
                    onClick={() => punchTime('出社')} 
                    disabled={attendanceStatus.clockIn}
                    style={{ 
                      flex: 1,
                      minHeight: '50px',
                      fontSize: 'clamp(14px, 3.5vw, 28px)',
                      opacity: attendanceStatus.clockIn ? 0.5 : 1,
                      cursor: attendanceStatus.clockIn ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    出社
            </button>
                )}
                {config && config.punch_buttons && (config.punch_buttons.includes('昼休出１') || config.punch_buttons.includes('昼休出1')) && (
            <button 
                    className="btn btn-secondary" 
                    onClick={() => punchTime('昼休出１')} 
                    disabled={attendanceStatus.lunchOut1 || attendanceStatus.clockOut}
                    style={{ 
                      flex: 1,
                      minHeight: '50px',
                      fontSize: 'clamp(12px, 3vw, 24px)',
                      opacity: (attendanceStatus.lunchOut1 || attendanceStatus.clockOut) ? 0.5 : 1,
                      cursor: (attendanceStatus.lunchOut1 || attendanceStatus.clockOut) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    昼休出１
            </button>
                )}
                {config && config.punch_buttons && (config.punch_buttons.includes('昼休入１') || config.punch_buttons.includes('昼休入1')) && (
            <button 
                    className="btn btn-secondary" 
                    onClick={() => punchTime('昼休入１')} 
                    disabled={attendanceStatus.lunchIn1 || attendanceStatus.clockOut}
                    style={{ 
                      flex: 1,
                      minHeight: '50px',
                      fontSize: 'clamp(12px, 3vw, 24px)',
                      opacity: (attendanceStatus.lunchIn1 || attendanceStatus.clockOut) ? 0.5 : 1,
                      cursor: (attendanceStatus.lunchIn1 || attendanceStatus.clockOut) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    昼休入１
            </button>
                )}
                {config && config.punch_buttons && (config.punch_buttons.includes('昼休出２') || config.punch_buttons.includes('昼休出2')) && (
            <button 
                    className="btn btn-secondary" 
                    onClick={() => punchTime('昼休出２')} 
                    disabled={attendanceStatus.lunchOut2 || attendanceStatus.clockOut}
                    style={{ 
                      flex: 1,
                      minHeight: '50px',
                      fontSize: 'clamp(12px, 3vw, 24px)',
                      opacity: (attendanceStatus.lunchOut2 || attendanceStatus.clockOut) ? 0.5 : 1,
                      cursor: (attendanceStatus.lunchOut2 || attendanceStatus.clockOut) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    昼休出２
            </button>
                )}
                {config && config.punch_buttons && (config.punch_buttons.includes('昼休入２') || config.punch_buttons.includes('昼休入2')) && (
            <button 
                    className="btn btn-secondary" 
                    onClick={() => punchTime('昼休入２')} 
                    disabled={attendanceStatus.lunchIn2 || attendanceStatus.clockOut}
                    style={{ 
                      flex: 1,
                      minHeight: '50px',
                      fontSize: 'clamp(12px, 3vw, 24px)',
                      opacity: (attendanceStatus.lunchIn2 || attendanceStatus.clockOut) ? 0.5 : 1,
                      cursor: (attendanceStatus.lunchIn2 || attendanceStatus.clockOut) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    昼休入２
            </button>
                )}
                {config && config.punch_buttons && config.punch_buttons.includes('退社') && (
              <button 
                    className="btn btn-danger" 
                    onClick={() => punchTime('退社')} 
                    disabled={attendanceStatus.clockOut}
                    style={{ 
                      flex: 1,
                      minHeight: '50px',
                      fontSize: 'clamp(14px, 3.5vw, 28px)',
                      opacity: attendanceStatus.clockOut ? 0.5 : 1,
                      cursor: attendanceStatus.clockOut ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    退社
              </button>
                )}
              </div>
            </div>
          </div>
      </div>

        {/* 右側: 工場・ライン選択 - 退社時のみ表示 */}
        {showLineSelectionDialog && (
          <div className="card fade-in-delay-2" style={{ 
            flex: '1',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 'calc(100vh - 80px)' // パディング分を除いて画面いっぱいに
          }}>
            <div style={{ 
              padding: '20px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: '30px',
                  padding: '20px',
                  backgroundColor: lineSelectionError ? '#f8d7da' : (isClockOutCompleted ? '#d4edda' : '#fff3cd'),
                  borderRadius: '8px',
                  border: lineSelectionError ? '2px solid #dc3545' : (isClockOutCompleted ? '2px solid #28a745' : '2px solid #ffc107')
                }}>
                  <div style={{ 
                    fontSize: 'clamp(20px, 4vw, 32px)', 
                    fontWeight: 'bold', 
                    color: lineSelectionError ? '#721c24' : (isClockOutCompleted ? '#155724' : '#856404'),
                    marginBottom: '10px'
                  }}>
                    {lineSelectionError ? 'エラー' : (isClockOutCompleted ? `${currentPunchType}処理完了` : `${currentPunchType}時のライン選択`)}
                  </div>
                  <div style={{ 
                    fontSize: 'clamp(14px, 3vw, 20px)', 
                    color: lineSelectionError ? '#721c24' : (isClockOutCompleted ? '#155724' : '#856404')
                  }}>
                    {lineSelectionError || (isClockOutCompleted ? (currentPunchType === '退社' ? 'おつかれさまでした！' : `${currentPunchType}打刻が完了しました`) : '就業ラインを選択して下さい')}
                  </div>
                </div>

                {/* 工場選択は非表示 - 従業員のデフォルト工場を使用 */}
                
                {!isClockOutCompleted && !lineSelectionError && config && config.show_line_selection && config.display_lines && (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    flex: 1,
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, 1fr)', 
                      gridTemplateRows: 'repeat(6, 1fr)',
                      gap: '10px',
                      flex: 1,
                      height: '100%'
                    }}>
                      {config.display_lines.map((line: any) => (
                        <button
                          key={line.id}
                          className={`btn ${selectedLine?.id === line.id ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => selectLine({
                            id: line.id,
                            line_id: line.line_id, // データベースの実際のline_idを使用
                            name: line.name,
                            factory_id: line.factory_id,
                            is_active: true,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                          })}
                          style={{ 
                            fontSize: 'clamp(12px, 2.5vw, 20px)',
                            minHeight: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                        >
                          {line.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {!isClockOutCompleted && !lineSelectionError && (
                <div style={{ 
                  display: 'flex', 
                  gap: '10px',
                  marginTop: '20px'
                }}>
                  <button
                    className="btn btn-secondary"
                    onClick={handleLineSelectionCancel}
                    style={{ 
                      flex: 1,
                      fontSize: 'clamp(16px, 3.5vw, 24px)',
                      minHeight: '60px'
                    }}
                  >
                    キャンセル
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Box>

      {/* メニューに戻るボタン - カードの外、下に配置 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginTop: '70px', // ボタンの高さ分（50px）+ 余白（20px）を追加
        padding: '0 20px 20px 20px'
      }}>
        <Button 
          variant="outlined" 
          onClick={() => {
            sessionStorage.setItem('fromOtherPage', 'true');
            // URLパラメータを引き継いで画面遷移
            const urlParams = new URLSearchParams(window.location.search);
            const deviceId = urlParams.get('device');
            navigate(`/${deviceId ? `?device=${deviceId}` : ''}`);
          }}
          sx={{
            minWidth: '160px',
            height: '50px',
            fontSize: '16px',
            borderColor: 'var(--primary-blue)',
            color: 'var(--primary-blue)',
            '&:hover': {
              borderColor: 'var(--secondary-blue)',
              backgroundColor: 'var(--light-blue)'
            }
          }}
        >
          メニューに戻る
        </Button>
      </div>

      {/* シフト選択ダイアログ */}
      <ShiftSelectionDialog
        open={showShiftDialog}
        onClose={handleShiftDialogClose}
        onConfirm={handleShiftConfirm}
        employeeName={employeeInfo?.name || ''}
      />

      {/* 社員コード確認ダイアログ */}
      {showConfirmationDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '60px',
            maxWidth: '800px',
            width: '80%',
            minWidth: '500px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{
              fontSize: 'clamp(48px, 10vw, 64px)',
              marginBottom: '40px',
              color: '#333'
            }}>
              確認
            </h2>
            <p style={{
              fontSize: 'clamp(48px, 10vw, 64px)',
              marginBottom: '60px',
              color: '#666'
            }}>
              {pendingEmployee?.employee_id}：{pendingEmployee?.name_kana || pendingEmployee?.name}さんですか？
            </p>
            {showConfirmationButtons && (
              <div style={{
                display: 'flex',
                gap: '40px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={handleConfirmationYes}
                  style={{
                    flex: 1,
                    padding: '25px 50px',
                    fontSize: 'clamp(40px, 8vw, 56px)',
                    fontWeight: 'bold',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    minHeight: '100px',
                    minWidth: '200px'
                  }}
                  onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#218838'}
                  onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#28a745'}
                >
                  はい
                </button>
                <button
                  onClick={handleConfirmationNo}
                  style={{
                    flex: 1,
                    padding: '25px 50px',
                    fontSize: 'clamp(40px, 8vw, 56px)',
                    fontWeight: 'bold',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    minHeight: '100px',
                    minWidth: '200px'
                  }}
                  onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#c82333'}
                  onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#dc3545'}
                >
                  いいえ
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Box>
  );
};

export default PunchPage;