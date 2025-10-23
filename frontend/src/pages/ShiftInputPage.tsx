import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import { ArrowBack, Refresh, Close } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';
import { employeeApi, factoryApi, lineApi, scheduleEntryApi } from '../services/api';
import { Employee, Factory, Line, ScheduleEntry } from '../types';
import Header from '../components/Header';

interface ShiftInputCell {
  employeeId: string;
  date: string;
  value: string;
}

interface InputDialogState {
  open: boolean;
  employeeId: string;
  employeeName: string;
  date: string;
  currentValue: string;
}

interface InlineSelectorState {
  visible: boolean;
  employeeId: string;
  date: string;
  position: { x: number; y: number };
}

const ShiftInputPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedFactory, setSelectedFactory] = useState<string>('');
  const [selectedLine, setSelectedLine] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [shiftData, setShiftData] = useState<ShiftInputCell[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  // 入力ダイアログの状態
  const [inputDialog, setInputDialog] = useState<InputDialogState>({
    open: false,
    employeeId: '',
    employeeName: '',
    date: '',
    currentValue: ''
  });

  // インライン選択器の状態
  const [inlineSelector, setInlineSelector] = useState<InlineSelectorState>({
    visible: false,
    employeeId: '',
    date: '',
    position: { x: 0, y: 0 }
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // 休日選択ダイアログの状態
  const [holidaySelectionDialog, setHolidaySelectionDialog] = useState({
    open: false,
    employeeId: '',
    date: '',
    scheduleType: '' as 'substitute' | 'compensatory',
    selectedHolidayDate: ''
  });

  // クリック外側でインライン選択器を閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inlineSelector.visible) {
        setInlineSelector({ ...inlineSelector, visible: false });
      }
    };

    if (inlineSelector.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [inlineSelector.visible]);

  // マスターデータの取得（従業員データは取得しない）
  const loadMasterData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [factoriesData, linesData] = await Promise.all([
        factoryApi.getAll(),
        lineApi.getAll()
      ]);
      
      setFactories(factoriesData.filter(factory => factory.is_active));
      setLines(linesData.filter(line => line.is_active));
    } catch (error: any) {
      console.error('マスターデータの取得に失敗:', error);
      if (error.response?.status === 404) {
        setError('APIエンドポイントが見つかりません。バックエンドサーバーが起動しているか確認してください。');
      } else if (error.code === 'ECONNREFUSED') {
        setError('バックエンドサーバーに接続できません。サーバーが起動しているか確認してください。');
      } else {
        setError(`マスターデータの取得に失敗しました: ${error.message || '不明なエラー'}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 表示更新ボタン用のデータ取得
  const loadDisplayData = useCallback(async () => {
    if (!selectedFactory || !selectedLine) {
      setError('工場区分とライン区分を選択してください');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const employeesData = await employeeApi.getAll();
      const activeEmployees = employeesData.filter(emp => emp.is_active);
      
      setEmployees(activeEmployees);
      
      // 従業員の絞り込みを直接実行
      let filtered = activeEmployees;
      if (selectedFactory) {
        filtered = filtered.filter(emp => emp.factory_id === selectedFactory);
      }
      if (selectedLine) {
        filtered = filtered.filter(emp => emp.line_id === selectedLine);
      }
      setFilteredEmployees(filtered);
    } catch (error: any) {
      console.error('従業員データの取得に失敗:', error);
      setError(`従業員データの取得に失敗しました: ${error.message || '不明なエラー'}`);
    } finally {
      setLoading(false);
    }
  }, [selectedFactory, selectedLine]);

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
  }, []);

  // 工場変更時の処理
  const handleFactoryChange = (factoryId: string) => {
    setSelectedFactory(factoryId);
    setSelectedLine('');
    // 従業員データをクリア
    setFilteredEmployees([]);
    setShiftData([]);
    setScheduleEntries([]);
  };

  // ライン変更時の処理
  const handleLineChange = (lineId: string) => {
    setSelectedLine(lineId);
    // 従業員データをクリア
    setFilteredEmployees([]);
    setShiftData([]);
    setScheduleEntries([]);
  };

  // 月変更時の処理
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
  };

  // シフトデータの初期化（データを返す版）
  const generateInitialShiftData = useCallback((date: Date, employeeList: Employee[]): ShiftInputCell[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const data: ShiftInputCell[] = [];
    
    employeeList.forEach(employee => {
      for (let day = 1; day <= daysInMonth; day++) {
        data.push({
          employeeId: employee.employee_id,
          date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          value: ''
        });
      }
    });
    
    return data;
  }, []);

  // シフトデータの初期化（setState版）
  const initializeShiftData = useCallback((date: Date, employeeList: Employee[]) => {
    const data = generateInitialShiftData(date, employeeList);
    setShiftData(data);
  }, [generateInitialShiftData]);

  // シフトデータの取得（実際のAPI実装時）
  const loadShiftData = useCallback(async (date: Date, employeeList: Employee[]) => {
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const startDateString = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDateString = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
      
      console.log('シフトデータ取得開始:', { startDateString, endDateString, employeeCount: employeeList.length });
      
      // 全従業員のスケジュールデータを取得
      const scheduleData = await scheduleEntryApi.getAll({
        start_date: startDateString,
        end_date: endDateString
      });
      
      console.log('取得したスケジュールデータ:', scheduleData);
      console.log('取得したスケジュールデータ数:', scheduleData.length);
      
      // 社員番号1234のデータを特別にログ出力
      const employee1234Data = scheduleData.filter((entry: any) => entry.employee_id === '1234');
      console.log('社員番号1234のスケジュールデータ:', employee1234Data);
      
      // 15日のデータを特別にログ出力
      const sept15Data = scheduleData.filter((entry: any) => entry.schedule_date === '2025-09-15');
      console.log('9月15日の全スケジュールデータ:', sept15Data);
      
      // スケジュールエントリを状態に保存
      setScheduleEntries(scheduleData);
      
      // シフトデータを初期化
      const initialData = generateInitialShiftData(date, employeeList);
      
      // 既存のスケジュールデータを反映
      const updatedData = initialData.map(cell => {
        // 同じ日付の複数のエントリを取得
        let entries = scheduleData.filter(
          (entry: ScheduleEntry) => entry.employee_id === cell.employeeId && entry.schedule_date === cell.date
        );
        
        // 振休と同じロジック：代休も schedule_date に代休を取得する日付が保存されている
        
        if (entries.length > 0) {
          // スケジュールタイプの優先順位を設定
          const priorityOrder = ['substitute', 'compensatory', 'paid_leave', 'holiday', 'absence', 'condolence_leave', 'holiday_work', 'special_leave', 'shift'];
          
          // 優先順位に従ってエントリを選択
          let selectedEntry: ScheduleEntry | null = null;
          for (const priority of priorityOrder) {
            selectedEntry = entries.find((entry: ScheduleEntry) => entry.schedule_type === priority) || null;
            if (selectedEntry) break;
          }
          
          // 優先順位で見つからない場合は最初のエントリを使用
          if (!selectedEntry) {
            selectedEntry = entries[0];
          }
          
          // selectedEntryがnullでないことを確認
          if (selectedEntry) {
          let value = '';
          if (selectedEntry.schedule_type === 'holiday') {
            value = 'holiday'; // 公休
          } else if (selectedEntry.schedule_type === 'paid_leave') {
            value = 'paid_leave'; // 有給
          } else if (selectedEntry.schedule_type === 'substitute') {
            value = 'substitute'; // 代休
          } else if (selectedEntry.schedule_type === 'compensatory') {
            value = 'compensatory'; // 振休
          } else if (selectedEntry.schedule_type === 'absence') {
            value = 'absence'; // 欠勤
          } else if (selectedEntry.schedule_type === 'condolence_leave') {
            value = 'condolence_leave'; // 慶弔
          } else if (selectedEntry.schedule_type === 'holiday_work') {
            value = 'holiday_work'; // 休出
          }
            
            // 社員番号1234の5日と10日のデータを特別にログ出力
            if (cell.employeeId === '1234' && (cell.date === '2025-09-05' || cell.date === '2025-09-10')) {
              console.log(`社員1234の${cell.date}セル更新:`, { 
                cell, 
                allEntries: entries, 
                selectedEntry, 
                value, 
                business_rules: selectedEntry.business_rules 
              });
            }
            
            console.log('セル更新:', { cell, selectedEntry, value });
            return { ...cell, value };
          }
        }
        
        return cell;
      });
      
      console.log('最終的なシフトデータ:', updatedData.filter(cell => cell.value !== ''));
      setShiftData(updatedData);
    } catch (error) {
      console.error('シフトデータの取得に失敗:', error);
      // エラーが発生した場合は初期化のみ実行
      initializeShiftData(date, employeeList);
    }
  }, [generateInitialShiftData, initializeShiftData]);

  // セルクリック時の処理（インライン選択器）
  const handleCellClick = (employeeId: string, employeeName: string, date: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const currentCell = shiftData.find(cell => cell.employeeId === employeeId && cell.date === date);
    
    // 画面端での位置調整
    const selectorWidth = 200; // インライン選択器の推定幅
    const selectorHeight = 80; // インライン選択器の推定高さ
    const margin = 10; // 画面端からの余白
    
    let x = rect.left;
    let y = rect.bottom + 5;
    
    // 右端で見切れる場合の調整
    if (x + selectorWidth > window.innerWidth - margin) {
      x = window.innerWidth - selectorWidth - margin;
    }
    
    // 左端で見切れる場合の調整
    if (x < margin) {
      x = margin;
    }
    
    // 下端で見切れる場合の調整（上に表示）
    if (y + selectorHeight > window.innerHeight - margin) {
      y = rect.top - selectorHeight - 5;
    }
    
    // 上端で見切れる場合の調整（下に表示）
    if (y < margin) {
      y = rect.bottom + 5;
    }
    
    console.log('セルクリック:', { employeeId, date, currentValue: currentCell?.value, currentCell });
    setInlineSelector({
      visible: true,
      employeeId,
      date,
      position: { x, y }
    });
    
    console.log('インライン選択器設定完了:', {
      visible: true,
      employeeId,
      date,
      position: { x, y },
      originalPosition: { x: rect.left, y: rect.bottom + 5 },
      windowSize: { width: window.innerWidth, height: window.innerHeight }
    });
  };

  // インライン選択器での選択
  const handleInlineSelect = useCallback(async (value: string) => {
    const { employeeId, date } = inlineSelector;
    console.log('選択開始:', { employeeId, date, value });
    
    // 代休・振休の場合は休日選択ダイアログを表示
    if (value === 'substitute' || value === 'compensatory') {
      setInlineSelector({ ...inlineSelector, visible: false });
      setHolidaySelectionDialog({
        open: true,
        employeeId,
        date,
        scheduleType: value as 'substitute' | 'compensatory',
        selectedHolidayDate: ''
      });
      return;
    }
    
    try {
      // 既存のスケジュールエントリを削除
      const existingEntries = await scheduleEntryApi.getAll({
        employee_id: employeeId,
        start_date: date,
        end_date: date
      });
      console.log('既存エントリ:', existingEntries);
      
      for (const entry of existingEntries) {
        await scheduleEntryApi.delete(entry.id);
        console.log('削除完了:', entry.id);
      }
      
      // 新しい値を保存
      if (value === 'holiday') {
        const createData = {
          employee_id: employeeId,
          schedule_date: date,
          schedule_type: 'holiday',
          status: 'scheduled',
          created_by: 'admin'
        };
        console.log('公休作成データ:', createData);
        const result = await scheduleEntryApi.create(createData);
        console.log('公休作成完了:', result);
      } else if (value === 'paid_leave') {
        const createData = {
          employee_id: employeeId,
          schedule_date: date,
          schedule_type: 'paid_leave',
          status: 'scheduled',
          created_by: 'admin'
        };
        console.log('有給作成データ:', createData);
        const result = await scheduleEntryApi.create(createData);
        console.log('有給作成完了:', result);
      } else if (value === 'absence') {
        const createData = {
          employee_id: employeeId,
          schedule_date: date,
          schedule_type: 'absence',
          status: 'scheduled',
          created_by: 'admin'
        };
        console.log('欠勤作成データ:', createData);
        const result = await scheduleEntryApi.create(createData);
        console.log('欠勤作成完了:', result);
      } else if (value === 'condolence_leave') {
        const createData = {
          employee_id: employeeId,
          schedule_date: date,
          schedule_type: 'condolence_leave',
          status: 'scheduled',
          created_by: 'admin'
        };
        console.log('慶弔作成データ:', createData);
        const result = await scheduleEntryApi.create(createData);
        console.log('慶弔作成完了:', result);
      } else if (value === 'holiday_work') {
        const createData = {
          employee_id: employeeId,
          schedule_date: date,
          schedule_type: 'holiday_work',
          status: 'scheduled',
          created_by: 'admin'
        };
        console.log('休出作成データ:', createData);
        const result = await scheduleEntryApi.create(createData);
        console.log('休出作成完了:', result);
      }
      
      // 保存後にデータを再読み込み
      await loadShiftData(new Date(selectedYear, selectedMonth - 1, 1), filteredEmployees);
      
      setInlineSelector({ ...inlineSelector, visible: false });
      const message = value === 'holiday' ? '公休を保存しました' : 
                     value === 'paid_leave' ? '有給を保存しました' :
                     value === 'absence' ? '欠勤を保存しました' :
                     value === 'condolence_leave' ? '慶弔を保存しました' :
                     value === 'holiday_work' ? '休出を保存しました' :
                     'スケジュールを保存しました';
      setSaveMessage(message);
      setTimeout(() => setSaveMessage(null), 1000);
    } catch (error: any) {
      console.error('保存に失敗:', error);
      console.error('エラー詳細:', error.response?.data || error.message);
      setError(`保存に失敗しました: ${error.response?.data?.message || error.message}`);
    }
  }, [inlineSelector, selectedYear, selectedMonth, filteredEmployees, loadShiftData]);

  // スケジュールの削除
  const handleDeleteSchedule = useCallback(async () => {
    try {
      const { employeeId, date } = inlineSelector;
      console.log('削除開始:', { employeeId, date });
      console.log('inlineSelector全体:', inlineSelector);
      
      // 削除処理が既に実行中の場合は処理をスキップ
      if (isDeleting) {
        console.log('削除処理が既に実行中のため、処理をスキップ');
        return;
      }
      
      setIsDeleting(true);
      
      // 既存のスケジュールエントリを検索
      console.log('削除対象の検索パラメータ:', { employee_id: employeeId, start_date: date, end_date: date });
      const existingEntries = await scheduleEntryApi.getAll({
        employee_id: employeeId,
        start_date: date,
        end_date: date
      });
      console.log('削除対象エントリ:', existingEntries);
      
      // 振休・代休の場合は、全スケジュールデータからも検索
      if (existingEntries.length === 0) {
        console.log('通常検索で見つからないため、全データから検索');
        
        // 月の全データを取得して検索
        const year = selectedYear;
        const month = selectedMonth;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const startDateString = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDateString = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
        
        const allScheduleData = await scheduleEntryApi.getAll({
          start_date: startDateString,
          end_date: endDateString
        });
        
        const allEntries = allScheduleData.filter((entry: any) => 
          entry.employee_id === employeeId && 
          (entry.schedule_date === date || 
           (entry.schedule_type === 'substitute' && entry.schedule_date === date) ||
           (entry.schedule_type === 'compensatory' && entry.schedule_date === date))
        );
        console.log('全データからの検索結果:', allEntries);
        
        if (allEntries.length > 0) {
          // 見つかったエントリを削除
          const deletedIds = [];
          for (const entry of allEntries) {
            try {
              console.log('全データ検索で削除実行中:', entry.id, entry.schedule_type, entry.schedule_date);
              const deleteResponse = await scheduleEntryApi.delete(entry.id);
              console.log('全データ検索で削除完了:', entry.id, 'レスポンス:', deleteResponse);
              deletedIds.push(entry.id);
            } catch (deleteError: any) {
              console.error('全データ検索での個別削除エラー:', deleteError);
              console.error('削除エラー詳細:', deleteError.response?.data || deleteError.message);
              throw deleteError;
            }
          }
          console.log('削除されたエントリID一覧:', deletedIds);
          
          // インライン選択器を閉じる
          setInlineSelector({ ...inlineSelector, visible: false });
          
          // 成功メッセージを表示
          const deletedEntry = allEntries[0];
          const scheduleType = deletedEntry.schedule_type;
          const message = scheduleType === 'substitute' ? '代休を削除しました' :
                         scheduleType === 'compensatory' ? '振休を削除しました' :
                         'スケジュールを削除しました';
          setSaveMessage(message);
          setTimeout(() => setSaveMessage(null), 1000);
          
          // 削除後にデータを再読み込み（少し待機してから）
          console.log('削除後のデータ再読み込み開始');
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms待機
          await loadShiftData(new Date(selectedYear, selectedMonth - 1, 1), filteredEmployees);
          console.log('削除後のデータ再読み込み完了');
          return;
        }
      }
      
      if (existingEntries.length === 0) {
        console.log('削除対象のエントリが見つかりません');
        console.log('検索パラメータ:', { employee_id: employeeId, start_date: date, end_date: date });
        setInlineSelector({ ...inlineSelector, visible: false });
        setSaveMessage('削除対象のデータが見つかりません');
        setTimeout(() => setSaveMessage(null), 1000);
        return;
      }
      
      // 削除処理を実行
      for (const entry of existingEntries) {
        try {
          console.log('削除実行中:', entry.id, entry.schedule_type, entry.schedule_date);
          const deleteResponse = await scheduleEntryApi.delete(entry.id);
          console.log('削除完了:', entry.id, 'レスポンス:', deleteResponse);
        } catch (deleteError: any) {
          console.error('個別削除エラー:', deleteError);
          console.error('削除エラー詳細:', deleteError.response?.data || deleteError.message);
          throw deleteError;
        }
      }
      
      console.log('削除処理完了');
      console.log('削除されたエントリ数:', existingEntries.length);
      
      // インライン選択器を閉じる
      setInlineSelector({ ...inlineSelector, visible: false });
      
      // 成功メッセージを表示（削除されたスケジュールの種類に応じて）
      const deletedEntry = existingEntries[0];
      const scheduleType = deletedEntry.schedule_type;
      console.log('削除されたスケジュールタイプ:', scheduleType);
      const message = scheduleType === 'holiday' ? '公休を削除しました' : 
                     scheduleType === 'paid_leave' ? '有給を削除しました' :
                     scheduleType === 'substitute' ? '代休を削除しました' :
                     scheduleType === 'compensatory' ? '振休を削除しました' :
                     'スケジュールを削除しました';
      setSaveMessage(message);
      setTimeout(() => setSaveMessage(null), 1000);
      
      // 削除後にデータを再読み込み（少し待機してから）
      console.log('データ再読み込み開始');
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms待機
      await loadShiftData(new Date(selectedYear, selectedMonth - 1, 1), filteredEmployees);
      console.log('データ再読み込み完了');
      
    } catch (error: any) {
      console.error('削除に失敗:', error);
      console.error('エラー詳細:', error.response?.data || error.message);
      setError(`削除に失敗しました: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsDeleting(false);
    }
  }, [inlineSelector, selectedYear, selectedMonth, filteredEmployees, loadShiftData, isDeleting]);

  // 休日選択ダイアログの保存
  const handleHolidaySelectionSave = async () => {
    try {
      const { employeeId, date, scheduleType, selectedHolidayDate } = holidaySelectionDialog;
      
      if (!selectedHolidayDate) {
        setError('元の公休日を選択してください');
        return;
      }
      
      // 既存のスケジュールエントリを削除
      const existingEntries = await scheduleEntryApi.getAll({
        employee_id: employeeId,
        start_date: date,
        end_date: date
      });
      
      for (const entry of existingEntries) {
        await scheduleEntryApi.delete(entry.id);
      }
      
      // 代休・振休を作成
      if (scheduleType === 'substitute') {
        await scheduleEntryApi.createSubstituteHoliday({
          substitute_holiday: {
            employee_id: employeeId,
            work_date: selectedHolidayDate, // 出勤した休日
            substitute_date: date, // 代休を取得する日付
            allowance_rate: 0.35,
            expiry_days: 60,
            notes: 'シフト入力画面から作成',
            created_by: 'admin'
          }
        });
      } else if (scheduleType === 'compensatory') {
        await scheduleEntryApi.createCompensatoryHoliday({
          compensatory_holiday: {
            employee_id: employeeId,
            original_date: selectedHolidayDate, // 元の休日
            compensatory_date: date, // 振り替え先の日付
            notes: 'シフト入力画面から作成',
            created_by: 'admin'
          }
        });
      }
      
      // 保存後にデータを再読み込み
      await loadShiftData(new Date(selectedYear, selectedMonth - 1, 1), filteredEmployees);
      
      setHolidaySelectionDialog({ ...holidaySelectionDialog, open: false });
      const message = scheduleType === 'substitute' ? '代休を保存しました' : '振休を保存しました';
      setSaveMessage(message);
      setTimeout(() => setSaveMessage(null), 1000);
    } catch (error: any) {
      console.error('保存に失敗:', error);
      console.error('エラー詳細:', error.response?.data || error.message);
      setError(`保存に失敗しました: ${error.response?.data?.error || error.message}`);
    }
  };

  // 入力ダイアログの保存（最適化版）
  const handleInputSave = async () => {
    try {
      const { employeeId, date, currentValue } = inputDialog;
      
      // バックエンドで一括処理されるため、単一のAPI呼び出しのみ
      if (currentValue === 'holiday') {
        // 公休 - バックエンドで既存データの削除も含む
        await scheduleEntryApi.create({
          employee_id: employeeId,
          schedule_date: date,
          schedule_type: 'holiday',
          status: 'scheduled',
          created_by: 'admin'
        });
      } else if (currentValue === 'paid_leave') {
        // 有給 - バックエンドで既存データの削除も含む
        await scheduleEntryApi.create({
          employee_id: employeeId,
          schedule_date: date,
          schedule_type: 'paid_leave',
          status: 'scheduled',
          created_by: 'admin'
        });
      } else if (currentValue === 'substitute') {
        // 代休 - 専用APIを使用
        await scheduleEntryApi.createSubstituteHoliday({
          substitute_holiday: {
            employee_id: employeeId,
            work_date: date,
            allowance_rate: 0.35,
            expiry_days: 60,
            notes: 'シフト入力画面から作成',
            created_by: 'admin'
          }
        });
      } else if (currentValue === 'compensatory') {
        // 振休 - 専用APIを使用
        await scheduleEntryApi.createCompensatoryHoliday({
          compensatory_holiday: {
            employee_id: employeeId,
            original_date: date, // 元の休日（仮）
            compensatory_date: date, // 振り替え先の日付（仮）
            notes: 'シフト入力画面から作成（簡易版）',
            created_by: 'admin'
          }
        });
      }
      
      // ローカルデータを更新
      setShiftData(prev => 
        prev.map(cell => 
          cell.employeeId === employeeId && cell.date === date
            ? { ...cell, value: currentValue }
            : cell
        )
      );
      
      setInputDialog({ ...inputDialog, open: false });
      setSaveMessage('スケジュールを保存しました');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      console.error('保存に失敗:', error);
      setError('保存に失敗しました');
    }
  };



  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  useEffect(() => {
    if (filteredEmployees.length > 0) {
      loadShiftData(new Date(selectedYear, selectedMonth - 1, 1), filteredEmployees);
    }
  }, [filteredEmployees, selectedYear, selectedMonth, loadShiftData]);

  // カレンダー生成
  const generateCalendarDays = () => {
    const year = selectedYear;
    const month = selectedMonth - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
      
      return {
        day,
        weekday: weekdays[dayOfWeek],
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      };
    });
  };

  const calendarDays = generateCalendarDays();

  // 利用可能な休日を取得（公休の日付）
  const getAvailableHolidays = () => {
    // scheduleEntriesが未定義または空の場合は空配列を返す
    if (!scheduleEntries || scheduleEntries.length === 0) {
      return [];
    }
    
    const year = selectedYear;
    const month = selectedMonth - 1;
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const startDateString = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    
    // 現在の月の全従業員の公休データを取得
    const holidayEntries = scheduleEntries.filter((entry: any) => 
      entry.schedule_type === 'holiday' &&
      entry.schedule_date >= startDateString &&
      entry.schedule_date <= endDateString
    );
    
    // 重複を除いて公休の日付を取得
    const uniqueHolidayDates = Array.from(new Set(holidayEntries.map((entry: any) => entry.schedule_date)))
      .sort()
      .map((date: string) => {
        const day = new Date(date).getDate();
        const dayOfWeek = new Date(date).getDay();
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        
        return {
          date: date,
          display: `${day}日（${weekdays[dayOfWeek]}）`,
          type: 'holiday'
        };
      });
    
    return uniqueHolidayDates;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Box>
        <Header title="勤怠シフト入力" />
        
        <Fade in={true} timeout={500}>
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
            <Fade in={!!error} timeout={300}>
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
                display: error ? 'block' : 'none',
                minWidth: '300px',
                textAlign: 'center'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ flex: 1 }}>{error}</Box>
                  <IconButton
                    onClick={() => setError(null)}
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
                display: saveMessage ? 'block' : 'none',
                minWidth: '300px',
                textAlign: 'center'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ flex: 1 }}>{saveMessage}</Box>
                  <IconButton
                    onClick={() => setSaveMessage(null)}
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
                          onChange={(e) => handleYearChange(Number(e.target.value))}
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
                        onChange={(newValue) => handleMonthChange((newValue?.getMonth() || 0) + 1)}
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
                  
                {/* 工場・ライン選択 */}
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
                  
                  {/* 表示更新ボタン */}
                  <Box sx={{ minWidth: '100px' }}>
                    <Button
                      variant="contained"
                      startIcon={<Refresh />}
                      onClick={loadDisplayData}
                      fullWidth
                      size="small"
                      sx={{
                        backgroundColor: '#1976d2',
                        color: 'white',
                        fontSize: '12px',
                        height: '32px',
                        '&:hover': {
                          backgroundColor: '#1565c0',
                        }
                      }}
                    >
                      表示更新
                    </Button>
                  </Box>
                  
                </Box>
              </CardContent>
            </Card>

            {/* 入力指示 */}
            <Card sx={{ mb: 1 }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '1.1rem' }}>
                  ※出勤日……入力不要
                </Typography>
              </CardContent>
            </Card>


            {/* メインテーブル */}
            <Card>
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <TableContainer component={Paper} sx={{ maxHeight: '60vh', overflowX: 'auto' }}>
                  <Table stickyHeader size="small" sx={{ minWidth: 1200 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ 
                          backgroundColor: '#f5f5f5', 
                          fontWeight: 'bold',
                          minWidth: 80
                        }}>
                          社員CD
                        </TableCell>
                        <TableCell sx={{ 
                          backgroundColor: '#f5f5f5', 
                          fontWeight: 'bold',
                          minWidth: 120
                        }}>
                          社員名
                        </TableCell>
                        {calendarDays.map(({ day, weekday, isWeekend }) => (
                          <TableCell
                            key={day}
                            sx={{
                              backgroundColor: isWeekend 
                                ? (weekday === '日' ? '#ffebee' : '#e3f2fd')
                                : '#f5f5f5',
                              fontWeight: 'bold',
                              minWidth: 40,
                              textAlign: 'center',
                              padding: '4px'
                            }}
                          >
                            <Box>
                              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                {day}
                              </Typography>
                              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                {weekday}
                              </Typography>
                            </Box>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredEmployees.map((employee, index) => (
                        <TableRow key={employee.employee_id}>
                          <TableCell>
                            {employee.employee_id}
                          </TableCell>
                          <TableCell>
                            {employee.name}
                          </TableCell>
                          {calendarDays.map(({ day, isWeekend }) => {
                            const dateString = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const cellData = shiftData.find(
                              cell => cell.employeeId === employee.employee_id && cell.date === dateString
                            );
                            
                            // デバッグログ（特定の日付のみ）
                            if (day === 13 && employee.employee_id === '1234') {
                              console.log('13日セルデータ:', { day, dateString, cellData, employeeId: employee.employee_id });
                            }
                            
                            return (
                              <TableCell
                                key={day}
                                sx={{
                                  backgroundColor: isWeekend 
                                    ? (day % 7 === 0 ? '#ffebee' : '#e3f2fd')
                                    : 'white',
                                  padding: '2px',
                                  textAlign: 'center'
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 40,
                                    height: 28, // 高さを元に戻す（56 → 28）
                                    border: '1px solid #ccc',
                                    borderRadius: '8px', // 角が丸い四角
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    backgroundColor: cellData?.value === 'holiday' 
                                      ? '#fff3e0' // 公休: オレンジ系の薄い色
                                      : cellData?.value === 'paid_leave' 
                                        ? '#e8f5e8' // 有給: グリーン系の薄い色
                                        : cellData?.value === 'substitute'
                                          ? '#e3f2fd' // 代休: ブルー系の薄い色
                                          : cellData?.value === 'compensatory'
                                            ? '#f3e5f5' // 振休: パープル系の薄い色
                                            : cellData?.value === 'absence'
                                              ? '#ffebee' // 欠勤: 赤系の薄い色
                                              : cellData?.value === 'condolence_leave'
                                                ? '#f1f8e9' // 慶弔: ライム系の薄い色
                                                : cellData?.value === 'holiday_work'
                                                  ? '#fff8e1' // 休出: 黄色系の薄い色
                                                  : 'white', // 未入力: 白
                                    '&:hover': {
                                      backgroundColor: cellData?.value === 'holiday' 
                                        ? '#ffe0b2' // 公休ホバー: 少し濃いオレンジ
                                        : cellData?.value === 'paid_leave' 
                                          ? '#c8e6c9' // 有給ホバー: 少し濃いグリーン
                                          : cellData?.value === 'substitute'
                                            ? '#bbdefb' // 代休ホバー: 少し濃いブルー
                                            : cellData?.value === 'compensatory'
                                              ? '#e1bee7' // 振休ホバー: 少し濃いパープル
                                              : cellData?.value === 'absence'
                                                ? '#ffcdd2' // 欠勤ホバー: 少し濃い赤
                                                : cellData?.value === 'condolence_leave'
                                                  ? '#dcedc8' // 慶弔ホバー: 少し濃いライム
                                                  : cellData?.value === 'holiday_work'
                                                    ? '#ffecb3' // 休出ホバー: 少し濃い黄色
                                                    : '#f5f5f5' // 未入力ホバー: グレー
                                    }
                                  }}
                                  onClick={(e) => {
                                    console.log('セルクリックイベント:', { employeeId: employee.employee_id, dateString, day, cellData });
                                    handleCellClick(employee.employee_id, employee.name, dateString, e);
                                  }}
                                >
                                  <Typography variant="caption" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                                    {cellData?.value === 'holiday' ? '公' : 
                                     cellData?.value === 'paid_leave' ? '有' :
                                     cellData?.value === 'substitute' ? '代' :
                                     cellData?.value === 'compensatory' ? '振' :
                                     cellData?.value === 'absence' ? '欠' :
                                     cellData?.value === 'condolence_leave' ? '慶' :
                                     cellData?.value === 'holiday_work' ? '休出' : ''}
                                  </Typography>
                                </Box>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* インライン選択器 */}
            {inlineSelector.visible && (() => {
              const currentCell = shiftData.find(
                cell => cell.employeeId === inlineSelector.employeeId && cell.date === inlineSelector.date
              );
              const hasValue = currentCell?.value && currentCell.value !== '';
              
              console.log('インライン選択器表示:', { 
                employeeId: inlineSelector.employeeId, 
                date: inlineSelector.date, 
                currentCell, 
                hasValue,
                currentCellValue: currentCell?.value,
                currentCellValueType: typeof currentCell?.value,
                isEmpty: currentCell?.value === '',
                isUndefined: currentCell?.value === undefined
              });
              
              return (
                <Box
                  sx={{
                    position: 'fixed',
                    left: inlineSelector.position.x,
                    top: inlineSelector.position.y,
                    zIndex: 9999,
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    padding: '8px',
                    display: 'flex',
                    gap: '8px',
                    flexDirection: 'column'
                  }}
                >
                  {hasValue && (
                    <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary' }}>
                      現在: {currentCell?.value === 'holiday' ? '公休' : 
                             currentCell?.value === 'paid_leave' ? '有給' :
                             currentCell?.value === 'substitute' ? '代休' :
                             currentCell?.value === 'compensatory' ? '振休' :
                             currentCell?.value === 'absence' ? '欠勤' :
                             currentCell?.value === 'condolence_leave' ? '慶弔' :
                             currentCell?.value === 'holiday_work' ? '休出' : '不明'}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleInlineSelect('holiday');
                      }}
                      sx={{ minWidth: '60px' }}
                    >
                      公休
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleInlineSelect('paid_leave');
                      }}
                      sx={{ minWidth: '60px' }}
                    >
                      有給
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleInlineSelect('substitute');
                      }}
                      sx={{ minWidth: '60px' }}
                    >
                      代休
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleInlineSelect('compensatory');
                      }}
                      sx={{ minWidth: '60px' }}
                    >
                      振休
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleInlineSelect('absence');
                      }}
                      sx={{ minWidth: '60px' }}
                    >
                      欠勤
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleInlineSelect('condolence_leave');
                      }}
                      sx={{ minWidth: '60px' }}
                    >
                      慶弔
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleInlineSelect('holiday_work');
                      }}
                      sx={{ minWidth: '60px' }}
                    >
                      休出
                    </Button>
                    {(() => {
                      console.log('削除ボタン表示条件チェック:', { hasValue, currentCellValue: currentCell?.value });
                      if (hasValue) {
                        console.log('削除ボタンをレンダリングします');
                        return (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onMouseDown={(e) => {
                              console.log('削除ボタンmousedown');
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('削除処理を呼び出します');
                              handleDeleteSchedule();
                            }}
                            sx={{ minWidth: '60px' }}
                          >
                            削除
                          </Button>
                        );
                      } else {
                        console.log('削除ボタンをレンダリングしません（hasValue: false）');
                        return null;
                      }
                    })()}
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => setInlineSelector({ ...inlineSelector, visible: false })}
                      sx={{ minWidth: '40px' }}
                    >
                      ×
                    </Button>
                  </Box>
                </Box>
              );
            })()}

            {/* 休日選択ダイアログ */}
            <Dialog 
              open={holidaySelectionDialog.open} 
              onClose={() => setHolidaySelectionDialog({ ...holidaySelectionDialog, open: false })}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>
                {holidaySelectionDialog.scheduleType === 'substitute' ? '代休' : '振休'} - 元の休日選択
              </DialogTitle>
              <DialogContent>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {holidaySelectionDialog.scheduleType === 'substitute' 
                      ? '出勤した公休日を選択してください' 
                      : '振り替え元の公休日を選択してください'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    対象日: {holidaySelectionDialog.date}
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>元の公休日</InputLabel>
                    <Select
                      value={holidaySelectionDialog.selectedHolidayDate}
                      onChange={(e) => setHolidaySelectionDialog({ 
                        ...holidaySelectionDialog, 
                        selectedHolidayDate: e.target.value 
                      })}
                      label="元の公休日"
                    >
                      {getAvailableHolidays().length > 0 ? (
                        getAvailableHolidays().map(holiday => (
                          <MenuItem key={holiday.date} value={holiday.date}>
                            {holiday.display}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>
                          公休が設定されていません
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setHolidaySelectionDialog({ ...holidaySelectionDialog, open: false })}>
                  キャンセル
                </Button>
                <Button 
                  onClick={handleHolidaySelectionSave} 
                  variant="contained"
                  disabled={!holidaySelectionDialog.selectedHolidayDate}
                >
                  保存
                </Button>
              </DialogActions>
            </Dialog>

            {/* 入力ダイアログ */}
            <Dialog 
              open={inputDialog.open} 
              onClose={() => setInputDialog({ ...inputDialog, open: false })}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>
                スケジュール入力 - {inputDialog.employeeName}
              </DialogTitle>
              <DialogContent>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    日付: {inputDialog.date}
                  </Typography>
                  <FormControl component="fieldset">
                    <RadioGroup
                      value={inputDialog.currentValue}
                      onChange={(e) => setInputDialog({ ...inputDialog, currentValue: e.target.value })}
                    >
                      <FormControlLabel value="holiday" control={<Radio />} label="公休" />
                      <FormControlLabel value="paid_leave" control={<Radio />} label="有給休暇" />
                      <FormControlLabel value="substitute" control={<Radio />} label="代休" />
                      <FormControlLabel value="compensatory" control={<Radio />} label="振休" />
                    </RadioGroup>
                  </FormControl>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setInputDialog({ ...inputDialog, open: false })}>
                  キャンセル
                </Button>
                <Button onClick={handleInputSave} variant="contained">
                  保存
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        </Fade>
      </Box>
    </LocalizationProvider>
  );
};

export default ShiftInputPage;
