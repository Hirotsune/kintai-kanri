import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Card,
  CardContent,
  Box,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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
  IconButton,
  Checkbox,
  FormControlLabel,
  Radio,
  Switch,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ArrowBack } from '@mui/icons-material';
import { factoryApi, lineApi, employeeApi, deviceConfigApi, systemSettingApi, allowanceSettingApi, positionSettingApi } from '../services/api';
import { Factory, Line, Employee, SystemSetting, AllowanceSetting, PositionSetting } from '../types';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import Header from '../components/Header';
import DeviceConfigTab from '../components/DeviceConfigTab';
import AdminPasswordTab from '../components/AdminPasswordTab';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

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
      id={`management-tabpanel-${index}`}
      aria-labelledby={`management-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }} className="fade-in">{children}</Box>}
    </div>
  );
}

const ManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  
  // 現在の端末IDを取得
  const urlParams = new URLSearchParams(window.location.search);
  const currentDeviceId = urlParams.get('device') || 'DEFAULT';
  
  // 管理画面にアクセスした時点で認証済みとして扱う
  useEffect(() => {
    // 管理画面にアクセスした時点で認証済みとして扱う
    sessionStorage.setItem('adminAuthenticated', 'true');
  }, []);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // シフト設定の状態
  const [shiftInputEnabled, setShiftInputEnabled] = useState(false);

  // 時間刻み設定の状態
  const [timeRoundingMode, setTimeRoundingMode] = useState(15);
  const [timeRoundingOptions, setTimeRoundingOptions] = useState<Array<{value: number, label: string}>>([]);

  // 手当て設定の状態
  const [allowanceSettings, setAllowanceSettings] = useState<AllowanceSetting[]>([]);
  const [allowanceDialogOpen, setAllowanceDialogOpen] = useState(false);
  const [allowanceForm, setAllowanceForm] = useState({
    allowance_type: '',
    name: '',
    rate: 0,
    fixed_amount: 0,
    calculation_type: 'fixed',
    condition_type: '',
    condition_value: '',
    is_legal_requirement: false,
    is_active: true,
    description: ''
  });
  const [editingAllowance, setEditingAllowance] = useState<AllowanceSetting | null>(null);

  // 役職設定の状態
  const [positionSettings, setPositionSettings] = useState<PositionSetting[]>([]);
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);
  const [positionForm, setPositionForm] = useState({
    position_code: '',
    position_name: '',
    hierarchy_level: 1,
    overtime_allowance_eligible: true,
    night_work_allowance_eligible: true,
    holiday_work_allowance_eligible: true,
    early_work_allowance_eligible: true,
    night_shift_allowance_eligible: true,
    position_allowance: 0,
    management_allowance: 0,
    is_active: true,
    description: ''
  });
  const [editingPosition, setEditingPosition] = useState<PositionSetting | null>(null);

  // 工場管理の状態
  const [factoryDialogOpen, setFactoryDialogOpen] = useState(false);
  const [factoryForm, setFactoryForm] = useState({ factory_id: '', name: '', is_active: true });
  const [editingFactory, setEditingFactory] = useState<Factory | null>(null);

  // ライン管理の状態
  const [lineDialogOpen, setLineDialogOpen] = useState(false);
  const [lineForm, setLineForm] = useState({ line_id: '', name: '', factory_id: '', is_active: true });
  const [editingLine, setEditingLine] = useState<Line | null>(null);

  // 従業員管理の状態
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    employee_id: '',
    name: '',
    name_kana: '',
    department: '-', // 部署は使わないのでハイフンを強制設定
    line_id: '',
    factory_id: '',
    hire_date: '', // 入社日
    status: 'active',
    is_active: true // status: 'active'から導出
  });
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // 保存メッセージの状態
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // 従業員フィルターの状態
  const [employeeFilter, setEmployeeFilter] = useState({
    lineId: '',
    factoryId: '',
    name: ''
  });

  // 従業員検索結果の状態
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);

  // 有効のみ表示の状態
  const [showActiveOnly, setShowActiveOnly] = useState({
    factories: true,
    lines: true,
    employees: true
  });

  useEffect(() => {
    loadData();
  }, []);

  // 初期データ読み込み時に従業員をフィルター
  useEffect(() => {
    if (employees.length > 0) {
      performEmployeeSearch();
    }
  }, [employees, showActiveOnly.employees]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [factoriesData, linesData, employeesData, allowanceData, positionData] = await Promise.all([
        factoryApi.getAll(),
        lineApi.getAll(),
        employeeApi.getAll(),
        allowanceSettingApi.getAll(),
        positionSettingApi.getAll()
      ]);
      
      // 時間刻み設定を個別に取得（エラーハンドリング付き）
      let timeRoundingData = { time_rounding_mode: 15 }; // デフォルト値
      let timeRoundingOptionsData = { 
        options: [
          { value: 1, label: '1分刻み' },
          { value: 5, label: '5分刻み' },
          { value: 10, label: '10分刻み' },
          { value: 15, label: '15分刻み' }
        ]
      };
      
      // 時間刻み設定は一時的にローカルストレージから取得
      try {
        const savedMode = localStorage.getItem('time_rounding_mode');
        if (savedMode) {
          timeRoundingData = { time_rounding_mode: parseInt(savedMode) };
          console.log('ローカルストレージから取得した時間刻みデータ:', timeRoundingData);
        } else {
          console.log('デフォルト値を使用');
        }
      } catch (err) {
        console.warn('時間刻みモードの取得に失敗、デフォルト値を使用:', err);
      }
      
      // 時間刻みオプションは固定値を使用
      console.log('時間刻みオプションは固定値を使用');
      // すべてのデータを取得（管理画面で全データを表示するため）
      // ID順でソート
      setFactories(factoriesData.sort((a, b) => a.id - b.id));
      setLines(linesData.sort((a, b) => a.id - b.id));
      setEmployees(employeesData.sort((a, b) => a.id - b.id));
      setAllowanceSettings(allowanceData.sort((a: AllowanceSetting, b: AllowanceSetting) => a.id - b.id));
      setPositionSettings(positionData.sort((a: PositionSetting, b: PositionSetting) => a.id - b.id));
      console.log('設定する時間刻みモード:', timeRoundingData.time_rounding_mode);
      setTimeRoundingMode(timeRoundingData.time_rounding_mode);
      setTimeRoundingOptions(timeRoundingOptionsData.options);
      
      // シフト設定は現在の端末から取得
      try {
        // URLパラメータから端末IDを取得
        const urlParams = new URLSearchParams(window.location.search);
        const deviceId = urlParams.get('device') || 'DEFAULT';
        const shiftSettings = await deviceConfigApi.getShiftInputEnabled(deviceId);
        setShiftInputEnabled(shiftSettings.shift_input_enabled);
      } catch (err) {
        console.error('シフト設定の取得に失敗:', err);
        // 端末IDが見つからない場合はデフォルトで有効にする
        setShiftInputEnabled(true);
      }
    } catch (err) {
      setError('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 手当て設定のハンドラー関数
  const handleEditAllowance = (setting: AllowanceSetting) => {
    setEditingAllowance(setting);
    setAllowanceForm({
      allowance_type: setting.allowance_type,
      name: setting.name,
      rate: setting.rate || 0,
      fixed_amount: setting.fixed_amount || 0,
      calculation_type: setting.calculation_type,
      condition_type: setting.condition_type,
      condition_value: setting.condition_value,
      is_legal_requirement: setting.is_legal_requirement,
      is_active: setting.is_active,
      description: setting.description || ''
    });
    setAllowanceDialogOpen(true);
  };

  const handleDeleteAllowance = async (id: number) => {
    const allowance = allowanceSettings.find(a => a.id === id);
    const allowanceName = allowance ? allowance.name : 'この手当て設定';
    
    if (window.confirm(`${allowanceName}を削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
      try {
        await allowanceSettingApi.delete(id);
        await loadData();
        setSaveMessage('手当て設定を削除しました');
        setTimeout(() => setSaveMessage(null), 3000);
      } catch (err) {
        setError('手当て設定の削除に失敗しました');
      }
    }
  };

  // 役職設定のハンドラー関数
  const handleEditPosition = (setting: PositionSetting) => {
    setEditingPosition(setting);
    setPositionForm({
      position_code: setting.position_code,
      position_name: setting.position_name,
      hierarchy_level: setting.hierarchy_level,
      overtime_allowance_eligible: setting.overtime_allowance_eligible,
      night_work_allowance_eligible: setting.night_work_allowance_eligible,
      holiday_work_allowance_eligible: setting.holiday_work_allowance_eligible,
      early_work_allowance_eligible: setting.early_work_allowance_eligible,
      night_shift_allowance_eligible: setting.night_shift_allowance_eligible,
      position_allowance: setting.position_allowance,
      management_allowance: setting.management_allowance,
      is_active: setting.is_active,
      description: setting.description || ''
    });
    setPositionDialogOpen(true);
  };

  const handleDeletePosition = async (id: number) => {
    const position = positionSettings.find(p => p.id === id);
    const positionName = position ? position.position_name : 'この役職設定';
    
    if (window.confirm(`${positionName}を削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
      try {
        await positionSettingApi.delete(id);
        await loadData();
        setSaveMessage('役職設定を削除しました');
        setTimeout(() => setSaveMessage(null), 3000);
      } catch (err) {
        setError('役職設定の削除に失敗しました');
      }
    }
  };

  // 手当て設定の送信処理
  const handleAllowanceSubmit = useCallback(async () => {
    try {
      if (editingAllowance) {
        await allowanceSettingApi.update(editingAllowance.id, allowanceForm);
        setSaveMessage('手当て設定を更新しました');
      } else {
        await allowanceSettingApi.create(allowanceForm);
        setSaveMessage('手当て設定を追加しました');
      }
      await loadData();
      setAllowanceDialogOpen(false);
      setEditingAllowance(null);
      setAllowanceForm({
        allowance_type: '',
        name: '',
        rate: 0,
        fixed_amount: 0,
        calculation_type: 'fixed',
        condition_type: '',
        condition_value: '',
        is_legal_requirement: false,
        is_active: true,
        description: ''
      });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setError('手当て設定の保存に失敗しました');
    }
  }, [editingAllowance, allowanceForm, loadData]);

  // 役職設定の送信処理
  const handlePositionSubmit = useCallback(async () => {
    try {
      if (editingPosition) {
        await positionSettingApi.update(editingPosition.id, positionForm);
        setSaveMessage('役職設定を更新しました');
      } else {
        await positionSettingApi.create(positionForm);
        setSaveMessage('役職設定を追加しました');
      }
      await loadData();
      setPositionDialogOpen(false);
      setEditingPosition(null);
      setPositionForm({
        position_code: '',
        position_name: '',
        hierarchy_level: 1,
        overtime_allowance_eligible: true,
        night_work_allowance_eligible: true,
        holiday_work_allowance_eligible: true,
        early_work_allowance_eligible: true,
        night_shift_allowance_eligible: true,
        position_allowance: 0,
        management_allowance: 0,
        is_active: true,
        description: ''
      });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setError('役職設定の保存に失敗しました');
    }
  }, [editingPosition, positionForm, loadData]);

  // 時間刻み設定の保存処理
  const handleTimeRoundingSubmit = useCallback(async () => {
    try {
      console.log('保存前のtimeRoundingMode:', timeRoundingMode);
      
      // ローカルストレージに保存
      localStorage.setItem('time_rounding_mode', timeRoundingMode.toString());
      console.log('ローカルストレージに保存完了:', timeRoundingMode);
      
      setSaveMessage('時間刻み設定を保存しました');
      setTimeout(() => setSaveMessage(null), 3000);
      
      // バックエンドにも保存を試行（エラーは無視）
      try {
        const response = await systemSettingApi.setTimeRoundingMode(timeRoundingMode);
        console.log('バックエンド保存レスポンス:', response);
      } catch (backendErr) {
        console.warn('バックエンド保存に失敗（ローカルストレージには保存済み）:', backendErr);
      }
    } catch (err) {
      console.error('時間刻み設定の保存に失敗:', err);
      setError('時間刻み設定の保存に失敗しました');
    }
  }, [timeRoundingMode]);

  // シフト設定の保存（現在の端末設定に保存）
  const handleShiftInputToggle = async (enabled: boolean) => {
    try {
      // URLパラメータから端末IDを取得
      const urlParams = new URLSearchParams(window.location.search);
      const deviceId = urlParams.get('device') || 'DEFAULT';
      await deviceConfigApi.setShiftInputEnabled(deviceId, enabled);
      setShiftInputEnabled(enabled);
      setError(null);
    } catch (err) {
      setError('シフト設定の保存に失敗しました');
    }
  };

  // フィルター処理
  const filteredFactories = showActiveOnly.factories 
    ? factories.filter(factory => factory.is_active)
    : factories;

  const filteredLines = showActiveOnly.lines 
    ? lines.filter(line => line.is_active)
    : lines;

  // 従業員検索処理
  const performEmployeeSearch = () => {
    const filtered = employees.filter(employee => {
      const lineMatch = !employeeFilter.lineId || employee.line_id === employeeFilter.lineId;
      const factoryMatch = !employeeFilter.factoryId || employee.factory_id === employeeFilter.factoryId;
      const nameMatch = !employeeFilter.name || 
        employee.name.toLowerCase().includes(employeeFilter.name.toLowerCase()) ||
        employee.employee_id.toLowerCase().includes(employeeFilter.name.toLowerCase());
      const activeMatch = !showActiveOnly.employees || employee.is_active;
      return lineMatch && factoryMatch && nameMatch && activeMatch;
    });
    setFilteredEmployees(filtered);
  };

  const handleEmployeeFilterChange = (field: 'lineId' | 'factoryId' | 'name', value: string) => {
    setEmployeeFilter(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetEmployeeFilter = () => {
    setEmployeeFilter({ lineId: '', factoryId: '', name: '' });
    // リセット後は自動的に検索実行
    setTimeout(() => {
      performEmployeeSearch();
    }, 0);
  };

  const handleEmployeeSearch = () => {
    performEmployeeSearch();
  };

  const handleActiveOnlyChange = (type: 'factories' | 'lines' | 'employees', checked: boolean) => {
    setShowActiveOnly(prev => ({
      ...prev,
      [type]: checked
    }));
  };

  // 工場管理の処理
  const handleFactorySubmit = async () => {
    try {
      if (editingFactory) {
        await factoryApi.update(editingFactory.id, factoryForm);
        setSaveMessage('工場を更新しました');
      } else {
        await factoryApi.create(factoryForm);
        setSaveMessage('工場を追加しました');
      }
      setFactoryDialogOpen(false);
      setFactoryForm({ factory_id: '', name: '', is_active: true });
      setEditingFactory(null);
      loadData();
      
      // 1.5秒後にメッセージを消去
      setTimeout(() => {
        setSaveMessage(null);
      }, 1500);
    } catch (err) {
      setError('工場の保存に失敗しました');
    }
  };

  const handleEditFactory = (factory: Factory) => {
    setEditingFactory(factory);
    setFactoryForm({ factory_id: factory.factory_id, name: factory.name, is_active: factory.is_active });
    setFactoryDialogOpen(true);
  };

  // ライン管理の処理
  const handleLineSubmit = async () => {
    try {
      if (editingLine) {
        // 編集時は、factory_idを文字列から対応するfactory_idに変換
        const factory = factories.find(f => f.id.toString() === lineForm.factory_id);
        const submitData = {
          ...lineForm,
          factory_id: factory ? factory.factory_id : lineForm.factory_id
        };
        await lineApi.update(editingLine.id, submitData);
        setSaveMessage('ラインを更新しました');
      } else {
        // 新規作成時も同様に変換
        const factory = factories.find(f => f.id.toString() === lineForm.factory_id);
        const submitData = {
          ...lineForm,
          factory_id: factory ? factory.factory_id : lineForm.factory_id
        };
        await lineApi.create(submitData);
        setSaveMessage('ラインを追加しました');
      }
      setLineDialogOpen(false);
      setLineForm({ line_id: '', name: '', factory_id: '', is_active: true });
      setEditingLine(null);
      loadData();
      
      // 1.5秒後にメッセージを消去
      setTimeout(() => {
        setSaveMessage(null);
      }, 1500);
    } catch (err) {
      setError('ラインの保存に失敗しました');
    }
  };

  const handleEditLine = (line: Line) => {
    setEditingLine(line);
    // factory_idをline.factory_idから対応するfactory.idに変換
    const factory = factories.find(f => f.factory_id === line.factory_id);
    setLineForm({ 
      line_id: line.line_id, 
      name: line.name, 
      factory_id: factory ? factory.id.toString() : '', 
      is_active: line.is_active 
    });
    setLineDialogOpen(true);
  };

  // 従業員管理の処理
  const handleEmployeeSubmit = useCallback(async () => {
    try {
      // line_idとfactory_idを文字列から対応するIDに変換
      const line = lines.find(l => l.id.toString() === employeeForm.line_id);
      const factory = factories.find(f => f.id.toString() === employeeForm.factory_id);
      
      console.log('Debug - employeeForm:', employeeForm);
      console.log('Debug - lines:', lines);
      console.log('Debug - factories:', factories);
      console.log('Debug - found line:', line);
      console.log('Debug - found factory:', factory);
      
      const submitData = {
        ...employeeForm,
        department: employeeForm.department || '-', // 部署が空の場合はハイフンを設定
        line_id: line ? line.line_id : employeeForm.line_id,
        factory_id: factory ? factory.factory_id : employeeForm.factory_id,
        is_active: employeeForm.status === 'active' // statusからis_activeを導出
      };
      
      console.log('Debug - submitData:', submitData);

      if (editingEmployee) {
        await employeeApi.update(editingEmployee.id, submitData);
        setSaveMessage('従業員を更新しました');
      } else {
        await employeeApi.create(submitData);
        setSaveMessage('従業員を追加しました');
      }
      setEmployeeDialogOpen(false);
      setEmployeeForm({
        employee_id: '',
        name: '',
        name_kana: '',
        department: '-', // 部署は使わないのでハイフンを強制設定
        line_id: '',
        factory_id: '',
        hire_date: '', // 入社日
        status: 'active',
        is_active: true
      });
      setEditingEmployee(null);
      loadData();
      
      // 1.5秒後にメッセージを消去
      setTimeout(() => {
        setSaveMessage(null);
      }, 1500);
    } catch (err) {
      setError('従業員の保存に失敗しました');
    }
  }, [lines, factories, employeeForm, editingEmployee, setSaveMessage, setError, setEmployeeDialogOpen, setEmployeeForm, setEditingEmployee, loadData]);

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    // line_idとfactory_idを対応するIDに変換
    const line = lines.find(l => l.line_id === employee.line_id);
    const factory = factories.find(f => f.factory_id === employee.factory_id);
    setEmployeeForm({
      employee_id: employee.employee_id,
      name: employee.name,
      name_kana: employee.name_kana || '',
      department: employee.department || '-', // 部署が空の場合はハイフンを設定
      line_id: line ? line.id.toString() : '',
      factory_id: factory ? factory.id.toString() : '',
      hire_date: employee.hire_date || '', // 入社日
      status: employee.status,
      is_active: employee.status === 'active' // statusからis_activeを導出
    });
    setEmployeeDialogOpen(true);
  };

  // 工場フォームをリセットする関数
  const resetFactoryForm = () => {
    setFactoryForm({ factory_id: '', name: '', is_active: true });
    setEditingFactory(null);
  };

  // ラインフォームをリセットする関数
  const resetLineForm = () => {
    setLineForm({ line_id: '', name: '', factory_id: '', is_active: true });
    setEditingLine(null);
  };

  // 従業員フォームをリセットする関数
  const resetEmployeeForm = () => {
    setEmployeeForm({
      employee_id: '',
      name: '',
      name_kana: '',
      department: '-', // 部署は使わないのでハイフンを強制設定
      line_id: '',
      factory_id: '',
      hire_date: '', // 入社日
      status: 'active',
      is_active: true // status: 'active'から導出
    });
    setEditingEmployee(null);
  };

  if (loading) return <Loading message="データを読み込み中..." />;

  return (
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
          管理画面
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Typography sx={{ 
              fontSize: '14px', 
              fontWeight: 'bold',
              color: '#e3f2fd'
            }}>
              端末ID:
            </Typography>
            <Typography sx={{ 
              fontSize: '14px', 
              fontWeight: 'bold',
              color: '#ffcdd2',
              backgroundColor: '#d32f2f',
              padding: '2px 6px',
              borderRadius: '3px'
            }}>
              {currentDeviceId}
            </Typography>
            {!urlParams.get('device') && (
              <Typography sx={{ 
                fontSize: '12px', 
                color: '#bbdefb',
                fontStyle: 'italic'
              }}>
                (デフォルト値)
              </Typography>
            )}
          </Box>
          <Typography sx={{ fontSize: '18px', fontWeight: 'normal' }}>
            {new Date().toLocaleDateString('ja-JP', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit',
              weekday: 'short'
            })}
          </Typography>
        </Box>
      </Box>

      {/* 最上段バー2 */}
      <Box sx={{ 
        backgroundColor: 'transparent',
        color: 'white',
        padding: '8px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '40px'
      }}>
        <Button
          variant="outlined"
          onClick={() => {
            sessionStorage.setItem('fromManagement', 'true');
            // URLパラメータを引き継いで画面遷移
            const urlParams = new URLSearchParams(window.location.search);
            const deviceId = urlParams.get('device');
            navigate(`/admin${deviceId ? `?device=${deviceId}` : ''}`);
          }}
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

      <Box sx={{ padding: '20px' }}>
        {error && <ErrorMessage message={error} />}
        {saveMessage && (
          <Box sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#4caf50',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            zIndex: 9999,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}>
            {saveMessage}
          </Box>
        )}

      <Card className="fade-in">
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': {
                  color: '#666666',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  textTransform: 'none',
                  '&.Mui-selected': {
                    color: '#1976d2',
                    backgroundColor: '#f3f8ff',
                  },
                  '&:hover': {
                    color: '#1976d2',
                    backgroundColor: '#f8f9fa',
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#1976d2',
                  height: '3px',
                }
              }}
            >
              <Tab label="工場管理" />
              <Tab label="ライン管理" />
              <Tab label="従業員管理" />
              <Tab label="端末設定" />
              <Tab label="シフト設定" />
              <Tab label="時間刻み設定" />
              <Tab label="手当て設定" />
              <Tab label="役職設定" />
              <Tab label="パスワード管理" />
            </Tabs>
          </Box>

          {/* 工場管理タブ */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }} className="fade-in">
              <Typography variant="h6">工場一覧</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showActiveOnly.factories}
                      onChange={(e) => handleActiveOnlyChange('factories', e.target.checked)}
                      size="small"
                      sx={{
                        color: '#1976d2',
                        '&.Mui-checked': {
                          color: '#1976d2',
                        },
                      }}
                    />
                  }
                  label="有効のみ表示"
                  sx={{ 
                    margin: 0,
                    color: '#1976d2',
                    '& .MuiFormControlLabel-label': {
                      color: '#1976d2',
                    }
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setFactoryDialogOpen(true)}
                >
                  工場追加
                </Button>
              </Box>
            </Box>
            <TableContainer component={Paper} className="fade-in-delay-1">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>工場ID</TableCell>
                    <TableCell>工場名</TableCell>
                    <TableCell>作成日</TableCell>
                    <TableCell>状態</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredFactories.map((factory) => (
                    <TableRow key={factory.id}>
                      <TableCell>{factory.factory_id}</TableCell>
                      <TableCell>{factory.name}</TableCell>
                      <TableCell>{new Date(factory.created_at).toLocaleDateString('ja-JP')}</TableCell>
                      <TableCell>
                        <Chip
                          label={factory.is_active ? '有効' : '無効'}
                          color={factory.is_active ? 'success' : 'default'}
                          size="small"
                          sx={{ fontSize: 'clamp(12px, 2vw, 14px)' }}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleEditFactory(factory)}
                          size="small"
                          sx={{ fontSize: 'clamp(16px, 3vw, 20px)' }}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* ライン管理タブ */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }} className="fade-in">
              <Typography variant="h6">ライン一覧</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showActiveOnly.lines}
                      onChange={(e) => handleActiveOnlyChange('lines', e.target.checked)}
                      size="small"
                      sx={{
                        color: '#1976d2',
                        '&.Mui-checked': {
                          color: '#1976d2',
                        },
                      }}
                    />
                  }
                  label="有効のみ表示"
                  sx={{ 
                    margin: 0,
                    color: '#1976d2',
                    '& .MuiFormControlLabel-label': {
                      color: '#1976d2',
                    }
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setLineDialogOpen(true)}
                >
                  ライン追加
                </Button>
              </Box>
            </Box>
            <TableContainer component={Paper} className="fade-in-delay-1">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>工場</TableCell>
                    <TableCell>ライン名</TableCell>
                    <TableCell>ラインID</TableCell>
                    <TableCell>作成日</TableCell>
                    <TableCell>状態</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        {factories.find(f => f.factory_id === line.factory_id)?.name || '不明'}
                      </TableCell>
                      <TableCell>{line.name}</TableCell>
                      <TableCell>{line.line_id}</TableCell>
                      <TableCell>{new Date(line.created_at).toLocaleDateString('ja-JP')}</TableCell>
                      <TableCell>
                        <Chip
                          label={line.is_active ? '有効' : '無効'}
                          color={line.is_active ? 'success' : 'default'}
                          size="small"
                          sx={{ fontSize: 'clamp(12px, 2vw, 14px)' }}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleEditLine(line)}
                          size="small"
                          sx={{ fontSize: 'clamp(16px, 3vw, 20px)' }}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* 従業員管理タブ */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }} className="fade-in">
              <Typography variant="h6">従業員一覧</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showActiveOnly.employees}
                      onChange={(e) => handleActiveOnlyChange('employees', e.target.checked)}
                      size="small"
                      sx={{
                        color: '#1976d2',
                        '&.Mui-checked': {
                          color: '#1976d2',
                        },
                      }}
                    />
                  }
                  label="有効のみ表示"
                  sx={{ 
                    margin: 0,
                    color: '#1976d2',
                    '& .MuiFormControlLabel-label': {
                      color: '#1976d2',
                    }
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setEmployeeDialogOpen(true)}
                >
                  従業員追加
                </Button>
              </Box>
            </Box>
            
            {/* 検索条件カード */}
            <Card sx={{ 
              marginBottom: '16px',
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ padding: '12px 16px' }}>
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: '0.16fr 0.16fr 0.16fr auto'
                  },
                  gap: '12px',
                  alignItems: 'end'
                }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>工場</InputLabel>
                    <Select
                      value={employeeFilter.factoryId}
                      label="工場"
                      onChange={(e) => handleEmployeeFilterChange('factoryId', e.target.value)}
                    >
                      <MenuItem value="">すべて</MenuItem>
                      {factories.map((factory) => (
                        <MenuItem key={factory.id} value={factory.factory_id}>
                          {factory.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth size="small">
                    <InputLabel>ライン・部署</InputLabel>
                    <Select
                      value={employeeFilter.lineId}
                      label="ライン・部署"
                      onChange={(e) => handleEmployeeFilterChange('lineId', e.target.value)}
                    >
                      <MenuItem value="">すべて</MenuItem>
                      {lines.map((line) => (
                        <MenuItem key={line.id} value={line.line_id}>
                          {line.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    label="社員検索"
                    placeholder="社員コードまたは社員名"
                    value={employeeFilter.name}
                    onChange={(e) => handleEmployeeFilterChange('name', e.target.value)}
                    size="small"
                    fullWidth
                  />
                  
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'end' }}>
                    <Button
                      variant="contained"
                      onClick={handleEmployeeSearch}
                      size="small"
                      sx={{ minWidth: '80px' }}
                    >
                      表示更新
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={resetEmployeeFilter}
                      size="small"
                      sx={{ minWidth: '80px' }}
                    >
                      リセット
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            <TableContainer component={Paper} className="fade-in-delay-1">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>従業員ID</TableCell>
                    <TableCell>名前</TableCell>
                    <TableCell>名前（ひらがな）</TableCell>
                    <TableCell>ライン・部署</TableCell>
                    <TableCell>工場</TableCell>
                    <TableCell>入社日</TableCell>
                    <TableCell>有給残日数</TableCell>
                    <TableCell>状態</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>{employee.employee_id}</TableCell>
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>{employee.name_kana || '-'}</TableCell>
                      <TableCell>
                        {lines.find(l => l.line_id === employee.line_id)?.name || '不明'}
                      </TableCell>
                      <TableCell>
                        {factories.find(f => f.factory_id === employee.factory_id)?.name || '不明'}
                      </TableCell>
                      <TableCell>
                        {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('ja-JP') : '-'}
                      </TableCell>
                      <TableCell>
                        {employee.remaining_paid_leave_days || 0}日
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={employee.is_active ? '有効' : '無効'}
                          color={employee.is_active ? 'success' : 'default'}
                          size="small"
                          sx={{ fontSize: 'clamp(12px, 2vw, 14px)' }}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleEditEmployee(employee)}
                          size="small"
                          sx={{ fontSize: 'clamp(16px, 3vw, 20px)' }}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* 端末設定タブ */}
          <TabPanel value={tabValue} index={3}>
            <DeviceConfigTab />
          </TabPanel>

          {/* シフト設定タブ */}
          <TabPanel value={tabValue} index={4}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">シフト設定</Typography>
            </Box>
            
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  シフト入力機能
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  打刻時にシフト時間を選択する機能のON/OFFを設定できます。
                  ONにすると、社員確定後にシフト選択ダイアログが表示されます。
                </Typography>
                
                <FormControlLabel
                  control={
                  <Switch
                    checked={Boolean(shiftInputEnabled)}
                    onChange={(e) => handleShiftInputToggle(e.target.checked)}
                    color="primary"
                  />
                  }
                  label={shiftInputEnabled ? "シフト入力機能 ON" : "シフト入力機能 OFF"}
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      fontSize: '16px',
                      fontWeight: shiftInputEnabled ? 'bold' : 'normal',
                      color: shiftInputEnabled ? '#1976d2' : 'text.secondary'
                    }
                  }}
                />
                
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>機能説明:</strong><br />
                    • OFF: 従来通りモーニング/アフタヌーンの自動判定<br />
                    • ON: 社員確定後にシフト時間選択ダイアログが表示<br />
                    • 30分間隔の開始時刻と勤務時間を選択可能
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </TabPanel>

          {/* 時間刻み設定タブ */}
          <TabPanel value={tabValue} index={5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }} className="fade-in">
              <Typography variant="h6">時間刻み設定</Typography>
            </Box>
            <Card>
              <CardContent>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  勤務時間の計算に使用する刻み時間を設定します。
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>時間刻みモード</InputLabel>
                  <Select
                    value={timeRoundingMode}
                    onChange={(e) => {
                      const newValue = Number(e.target.value);
                      console.log('時間刻みモード変更:', newValue);
                      setTimeRoundingMode(newValue);
                    }}
                    label="時間刻みモード"
                  >
                    {timeRoundingOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="contained" color="primary" onClick={handleTimeRoundingSubmit}>
                  設定を保存
                </Button>
              </CardContent>
            </Card>
          </TabPanel>

          {/* 手当て設定タブ */}
          <TabPanel value={tabValue} index={6}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }} className="fade-in">
              <Typography variant="h6">手当て設定</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAllowanceDialogOpen(true)}
              >
                手当て追加
              </Button>
            </Box>
            <Card>
              <CardContent>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  各種手当ての設定を管理します。
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>手当てタイプ</TableCell>
                        <TableCell>名称</TableCell>
                        <TableCell>計算方式</TableCell>
                        <TableCell>金額/割増率</TableCell>
                        <TableCell>適用条件</TableCell>
                        <TableCell>操作</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allowanceSettings.map((setting) => (
                        <TableRow key={setting.id}>
                          <TableCell>{setting.allowance_type}</TableCell>
                          <TableCell>{setting.name}</TableCell>
                          <TableCell>{setting.calculation_type}</TableCell>
                          <TableCell>
                            {setting.calculation_type === 'fixed' 
                              ? `¥${setting.fixed_amount?.toLocaleString()}` 
                              : `${setting.rate}%`
                            }
                          </TableCell>
                          <TableCell>{setting.condition_value}</TableCell>
                          <TableCell>
                            <IconButton
                              onClick={() => handleEditAllowance(setting)}
                              size="small"
                              sx={{ fontSize: 'clamp(16px, 3vw, 20px)' }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteAllowance(setting.id)}
                              sx={{
                                color: '#d32f2f',
                                '&:hover': {
                                  backgroundColor: '#ffebee',
                                  color: '#b71c1c',
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </TabPanel>

          {/* 役職設定タブ */}
          <TabPanel value={tabValue} index={7}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }} className="fade-in">
              <Typography variant="h6">役職設定</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setPositionDialogOpen(true)}
              >
                役職追加
              </Button>
            </Box>
            <Card>
              <CardContent>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  役職と手当て適用可否の設定を管理します。
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>役職コード</TableCell>
                        <TableCell>役職名</TableCell>
                        <TableCell>階層レベル</TableCell>
                        <TableCell>手当て適用</TableCell>
                        <TableCell>役職手当</TableCell>
                        <TableCell>管理手当</TableCell>
                        <TableCell>操作</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {positionSettings.map((setting) => (
                        <TableRow key={setting.id}>
                          <TableCell>{setting.position_code}</TableCell>
                          <TableCell>{setting.position_name}</TableCell>
                          <TableCell>{setting.hierarchy_level}</TableCell>
                          <TableCell>
                            {setting.overtime_allowance_eligible && '残業 '}
                            {setting.night_work_allowance_eligible && '深夜 '}
                            {setting.holiday_work_allowance_eligible && '休日 '}
                            {setting.early_work_allowance_eligible && '早朝 '}
                            {setting.night_shift_allowance_eligible && '夜勤'}
                          </TableCell>
                          <TableCell>¥{setting.position_allowance.toLocaleString()}</TableCell>
                          <TableCell>¥{setting.management_allowance.toLocaleString()}</TableCell>
                          <TableCell>
                            <IconButton
                              onClick={() => handleEditPosition(setting)}
                              size="small"
                              sx={{ fontSize: 'clamp(16px, 3vw, 20px)' }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeletePosition(setting.id)}
                              sx={{
                                color: '#d32f2f',
                                '&:hover': {
                                  backgroundColor: '#ffebee',
                                  color: '#b71c1c',
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </TabPanel>

          {/* パスワード管理タブ */}
          <TabPanel value={tabValue} index={8}>
            <AdminPasswordTab />
          </TabPanel>
        </CardContent>
      </Card>

      {/* 工場追加ダイアログ */}
      <Dialog open={factoryDialogOpen} onClose={() => setFactoryDialogOpen(false)}>
        <DialogTitle>{editingFactory ? '工場編集' : '工場追加'}</DialogTitle>
        <DialogContent sx={{ '& .MuiFormControl-root': { marginBottom: '16px' } }}>
          {editingFactory ? (
            <TextField
              margin="dense"
              label="工場ID"
              fullWidth
              variant="outlined"
              size="small"
              value={factoryForm.factory_id}
              disabled
              sx={{ 
                backgroundColor: '#f5f5f5', 
                height: '56px',
                '& .MuiInputBase-input.Mui-disabled': {
                  backgroundColor: '#f5f5f5',
                  WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)'
                }
              }}
            />
          ) : (
            <TextField
              autoFocus
              margin="dense"
              label="工場ID"
              fullWidth
              variant="outlined"
              size="small"
              value={factoryForm.factory_id}
              onChange={(e) => setFactoryForm({ ...factoryForm, factory_id: e.target.value })}
              sx={{ height: '56px' }}
            />
          )}
          <TextField
            margin="dense"
            label="工場名"
            fullWidth
            variant="outlined"
            size="small"
            value={factoryForm.name}
            onChange={(e) => setFactoryForm({ ...factoryForm, name: e.target.value })}
            sx={{ height: '56px' }}
          />
          <FormControl fullWidth margin="dense" size="small" sx={{ height: '56px' }}>
            <InputLabel>ステータス</InputLabel>
            <Select
              label="ステータス"
              value={factoryForm.is_active ? 'active' : 'inactive'}
              onChange={(e) => setFactoryForm({ ...factoryForm, is_active: e.target.value === 'active' })}
            >
              <MenuItem value="active">アクティブ</MenuItem>
              <MenuItem value="inactive">非アクティブ</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            resetFactoryForm();
            setFactoryDialogOpen(false);
          }} size="small">閉じる</Button>
          <Button onClick={handleFactorySubmit} variant="contained" size="small">{editingFactory ? '更新' : '追加'}</Button>
        </DialogActions>
      </Dialog>

      {/* ライン追加ダイアログ */}
      <Dialog open={lineDialogOpen} onClose={() => setLineDialogOpen(false)}>
        <DialogTitle>{editingLine ? 'ライン編集' : 'ライン追加'}</DialogTitle>
        <DialogContent sx={{ '& .MuiFormControl-root': { marginBottom: '16px' } }}>
          <FormControl fullWidth margin="dense" size="small" sx={{ height: '56px' }}>
            <InputLabel>工場</InputLabel>
            <Select
              autoFocus
              value={lineForm.factory_id}
              label="工場"
              size="small"
              onChange={(e) => setLineForm({ ...lineForm, factory_id: e.target.value })}
            >
              {factories.map((factory) => (
                <MenuItem key={factory.id} value={factory.id}>
                  {factory.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="ライン名"
            fullWidth
            variant="outlined"
            size="small"
            value={lineForm.name}
            onChange={(e) => setLineForm({ ...lineForm, name: e.target.value })}
            sx={{ height: '56px' }}
          />
          {editingLine ? (
            <TextField
              margin="dense"
              label="ラインID"
              fullWidth
              variant="outlined"
              size="small"
              value={lineForm.line_id}
              disabled
              sx={{ 
                backgroundColor: '#f5f5f5', 
                height: '56px',
                '& .MuiInputBase-input.Mui-disabled': {
                  backgroundColor: '#f5f5f5',
                  WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)'
                }
              }}
            />
          ) : (
            <TextField
              margin="dense"
              label="ラインID"
              fullWidth
              variant="outlined"
              size="small"
              value={lineForm.line_id}
              onChange={(e) => setLineForm({ ...lineForm, line_id: e.target.value })}
              sx={{ height: '56px' }}
            />
          )}
          <FormControl fullWidth margin="dense" size="small" sx={{ height: '56px' }}>
            <InputLabel>ステータス</InputLabel>
            <Select
              label="ステータス"
              value={lineForm.is_active ? 'active' : 'inactive'}
              onChange={(e) => setLineForm({ ...lineForm, is_active: e.target.value === 'active' })}
            >
              <MenuItem value="active">アクティブ</MenuItem>
              <MenuItem value="inactive">非アクティブ</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            resetLineForm();
            setLineDialogOpen(false);
          }} size="small">閉じる</Button>
          <Button onClick={handleLineSubmit} variant="contained" size="small">{editingLine ? '更新' : '追加'}</Button>
        </DialogActions>
      </Dialog>

      {/* 従業員追加ダイアログ */}
      <Dialog open={employeeDialogOpen} onClose={() => setEmployeeDialogOpen(false)}>
        <DialogTitle>{editingEmployee ? '従業員編集' : '従業員追加'}</DialogTitle>
        <DialogContent sx={{ '& .MuiFormControl-root': { marginBottom: '16px' } }}>
          {editingEmployee ? (
            <TextField
              margin="dense"
              label="従業員ID"
              fullWidth
              variant="outlined"
              size="small"
              value={employeeForm.employee_id}
              disabled
              sx={{ 
                backgroundColor: '#f5f5f5', 
                height: '56px',
                '& .MuiInputBase-input.Mui-disabled': {
                  backgroundColor: '#f5f5f5',
                  WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)'
                }
              }}
            />
          ) : (
            <TextField
              autoFocus
              margin="dense"
              label="従業員ID"
              fullWidth
              variant="outlined"
              size="small"
              value={employeeForm.employee_id}
              onChange={(e) => setEmployeeForm({ ...employeeForm, employee_id: e.target.value })}
              sx={{ height: '56px' }}
            />
          )}
          <TextField
            margin="dense"
            label="名前"
            fullWidth
            variant="outlined"
            size="small"
            value={employeeForm.name}
            onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
            sx={{ height: '56px' }}
          />
          <TextField
            margin="dense"
            label="名前（ひらがな）"
            fullWidth
            variant="outlined"
            size="small"
            value={employeeForm.name_kana}
            onChange={(e) => setEmployeeForm({ ...employeeForm, name_kana: e.target.value })}
            sx={{ height: '56px' }}
            helperText="音声読み上げ用のひらがな名を入力してください"
          />
          <FormControl fullWidth margin="dense" size="small" sx={{ height: '56px' }}>
            <InputLabel>ライン・部署</InputLabel>
            <Select
              value={employeeForm.line_id}
              label="ライン・部署"
              size="small"
              onChange={(e) => setEmployeeForm({ ...employeeForm, line_id: e.target.value })}
            >
              {lines.map((line) => (
                <MenuItem key={line.id} value={line.id.toString()}>
                  {line.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense" size="small" sx={{ height: '56px' }}>
            <InputLabel>工場</InputLabel>
            <Select
              value={employeeForm.factory_id}
              label="工場"
              size="small"
              onChange={(e) => setEmployeeForm({ ...employeeForm, factory_id: e.target.value })}
            >
              {factories.map((factory) => (
                <MenuItem key={factory.id} value={factory.id.toString()}>
                  {factory.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="dense"
            size="small"
            type="date"
            label="入社日"
            value={employeeForm.hire_date}
            onChange={(e) => setEmployeeForm({ ...employeeForm, hire_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth margin="dense" size="small" sx={{ height: '56px' }}>
            <InputLabel>ステータス</InputLabel>
            <Select
              value={employeeForm.status}
              label="ステータス"
              size="small"
              onChange={(e) => setEmployeeForm({ ...employeeForm, status: e.target.value })}
            >
              <MenuItem value="active">アクティブ</MenuItem>
              <MenuItem value="inactive">非アクティブ</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            resetEmployeeForm();
            setEmployeeDialogOpen(false);
          }} size="small">閉じる</Button>
          <Button onClick={handleEmployeeSubmit} variant="contained" size="small">{editingEmployee ? '更新' : '追加'}</Button>
        </DialogActions>
      </Dialog>

      {/* 手当て設定ダイアログ */}
      <Dialog open={allowanceDialogOpen} onClose={() => setAllowanceDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingAllowance ? '手当て設定編集' : '手当て設定追加'}</DialogTitle>
        <DialogContent sx={{ '& .MuiFormControl-root': { marginBottom: '16px' } }}>
          <FormControl fullWidth margin="dense">
            <InputLabel>手当てタイプ</InputLabel>
            <Select
              value={allowanceForm.allowance_type}
              label="手当てタイプ"
              onChange={(e) => setAllowanceForm({ ...allowanceForm, allowance_type: e.target.value })}
            >
              <MenuItem value="overtime">時間外労働手当</MenuItem>
              <MenuItem value="night_work">深夜労働手当</MenuItem>
              <MenuItem value="holiday_work">休日労働手当</MenuItem>
              <MenuItem value="early_work">早朝勤務手当</MenuItem>
              <MenuItem value="night_shift">夜勤手当</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="dense"
            label="名称"
            value={allowanceForm.name}
            onChange={(e) => setAllowanceForm({ ...allowanceForm, name: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>計算方式</InputLabel>
            <Select
              value={allowanceForm.calculation_type}
              label="計算方式"
              onChange={(e) => setAllowanceForm({ ...allowanceForm, calculation_type: e.target.value })}
            >
              <MenuItem value="fixed">固定金額</MenuItem>
              <MenuItem value="rate">割増率</MenuItem>
            </Select>
          </FormControl>
          {allowanceForm.calculation_type === 'fixed' ? (
            <TextField
              fullWidth
              margin="dense"
              label="固定金額"
              type="number"
              value={allowanceForm.fixed_amount}
              onChange={(e) => setAllowanceForm({ ...allowanceForm, fixed_amount: Number(e.target.value) })}
            />
          ) : (
            <TextField
              fullWidth
              margin="dense"
              label="割増率 (%)"
              type="number"
              value={allowanceForm.rate}
              onChange={(e) => setAllowanceForm({ ...allowanceForm, rate: Number(e.target.value) })}
            />
          )}
          <FormControl fullWidth margin="dense">
            <InputLabel>条件タイプ</InputLabel>
            <Select
              value={allowanceForm.condition_type}
              label="条件タイプ"
              onChange={(e) => setAllowanceForm({ ...allowanceForm, condition_type: e.target.value })}
            >
              <MenuItem value="time_range">時間帯</MenuItem>
              <MenuItem value="hours">勤務時間</MenuItem>
              <MenuItem value="shift">シフト</MenuItem>
              <MenuItem value="holiday">休日</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="dense"
            label="条件値"
            value={allowanceForm.condition_value}
            onChange={(e) => setAllowanceForm({ ...allowanceForm, condition_value: e.target.value })}
            placeholder="例: 05:00-06:00, over_8_hours, statutory_holiday"
          />
                <FormControlLabel
                  control={
              <Checkbox
                checked={allowanceForm.is_legal_requirement}
                onChange={(e) => setAllowanceForm({ ...allowanceForm, is_legal_requirement: e.target.checked })}
              />
            }
            label="法定要件"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={allowanceForm.is_active}
                onChange={(e) => setAllowanceForm({ ...allowanceForm, is_active: e.target.checked })}
              />
            }
            label="アクティブ"
          />
          <TextField
            fullWidth
            margin="dense"
            label="説明"
            multiline
            rows={3}
            value={allowanceForm.description}
            onChange={(e) => setAllowanceForm({ ...allowanceForm, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAllowanceForm({
              allowance_type: '',
              name: '',
              rate: 0,
              fixed_amount: 0,
              calculation_type: 'fixed',
              condition_type: '',
              condition_value: '',
              is_legal_requirement: false,
              is_active: true,
              description: ''
            });
            setEditingAllowance(null);
            setAllowanceDialogOpen(false);
          }}>閉じる</Button>
          <Button onClick={handleAllowanceSubmit} variant="contained">
            {editingAllowance ? '更新' : '追加'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 役職設定ダイアログ */}
      <Dialog open={positionDialogOpen} onClose={() => setPositionDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingPosition ? '役職設定編集' : '役職設定追加'}</DialogTitle>
        <DialogContent sx={{ '& .MuiFormControl-root': { marginBottom: '16px' } }}>
          <TextField
            fullWidth
            margin="dense"
            label="役職コード"
            value={positionForm.position_code}
            onChange={(e) => setPositionForm({ ...positionForm, position_code: e.target.value })}
          />
          <TextField
            fullWidth
            margin="dense"
            label="役職名"
            value={positionForm.position_name}
            onChange={(e) => setPositionForm({ ...positionForm, position_name: e.target.value })}
          />
          <TextField
            fullWidth
            margin="dense"
            label="階層レベル"
            type="number"
            value={positionForm.hierarchy_level}
            onChange={(e) => setPositionForm({ ...positionForm, hierarchy_level: Number(e.target.value) })}
          />
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>手当て適用可否</Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={positionForm.overtime_allowance_eligible}
                  onChange={(e) => setPositionForm({ ...positionForm, overtime_allowance_eligible: e.target.checked })}
                />
              }
              label="時間外労働手当"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={positionForm.night_work_allowance_eligible}
                  onChange={(e) => setPositionForm({ ...positionForm, night_work_allowance_eligible: e.target.checked })}
                />
              }
              label="深夜労働手当"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={positionForm.holiday_work_allowance_eligible}
                  onChange={(e) => setPositionForm({ ...positionForm, holiday_work_allowance_eligible: e.target.checked })}
                />
              }
              label="休日労働手当"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={positionForm.early_work_allowance_eligible}
                  onChange={(e) => setPositionForm({ ...positionForm, early_work_allowance_eligible: e.target.checked })}
                />
              }
              label="早朝勤務手当"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={positionForm.night_shift_allowance_eligible}
                  onChange={(e) => setPositionForm({ ...positionForm, night_shift_allowance_eligible: e.target.checked })}
                />
              }
              label="夜勤手当"
            />
                </Box>
          <TextField
            fullWidth
            margin="dense"
            label="役職手当"
            type="number"
            value={positionForm.position_allowance}
            onChange={(e) => setPositionForm({ ...positionForm, position_allowance: Number(e.target.value) })}
          />
          <TextField
            fullWidth
            margin="dense"
            label="管理手当"
            type="number"
            value={positionForm.management_allowance}
            onChange={(e) => setPositionForm({ ...positionForm, management_allowance: Number(e.target.value) })}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={positionForm.is_active}
                onChange={(e) => setPositionForm({ ...positionForm, is_active: e.target.checked })}
              />
            }
            label="アクティブ"
          />
          <TextField
            fullWidth
            margin="dense"
            label="説明"
            multiline
            rows={3}
            value={positionForm.description}
            onChange={(e) => setPositionForm({ ...positionForm, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setPositionForm({
              position_code: '',
              position_name: '',
              hierarchy_level: 1,
              overtime_allowance_eligible: true,
              night_work_allowance_eligible: true,
              holiday_work_allowance_eligible: true,
              early_work_allowance_eligible: true,
              night_shift_allowance_eligible: true,
              position_allowance: 0,
              management_allowance: 0,
              is_active: true,
              description: ''
            });
            setEditingPosition(null);
            setPositionDialogOpen(false);
          }}>閉じる</Button>
          <Button onClick={handlePositionSubmit} variant="contained">
            {editingPosition ? '更新' : '追加'}
          </Button>
        </DialogActions>
      </Dialog>
      </Box>

    </Box>
  );
};

export default ManagementPage;