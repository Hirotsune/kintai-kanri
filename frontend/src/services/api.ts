import axios from 'axios';
import { Factory, Line, Employee, Attendance, PunchRequest, Report, Shift, EmployeeShift } from '../types';

const API_BASE_URL = 'http://localhost:3000/api/v1';

// axiosインスタンスの作成
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター（デバッグ用）
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// レスポンスインターセプター（デバッグ用）
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.config?.url, error.message);
    return Promise.reject(error);
  }
);

// 工場関連のAPI
export const factoryApi = {
  getAll: () => api.get<Factory[]>('/factories').then(res => res.data),
  getById: (id: number) => api.get<Factory>(`/factories/${id}`).then(res => res.data),
  create: (factory: Partial<Factory>) => api.post<Factory>('/factories', { factory }).then(res => res.data),
  update: (id: number, factory: Partial<Factory>) => api.patch<Factory>(`/factories/${id}`, { factory }).then(res => res.data),
  delete: (id: number) => api.delete(`/factories/${id}`),
};

// ライン関連のAPI
export const lineApi = {
  getAll: () => api.get<Line[]>('/lines').then(res => res.data),
  getById: (id: number) => api.get<Line>(`/lines/${id}`).then(res => res.data),
  create: (line: Partial<Line>) => api.post<Line>('/lines', { line }).then(res => res.data),
  update: (id: number, line: Partial<Line>) => api.patch<Line>(`/lines/${id}`, { line }).then(res => res.data),
  delete: (id: number) => api.delete(`/lines/${id}`),
};

// 従業員関連のAPI
export const employeeApi = {
  getAll: () => api.get<Employee[]>('/employees').then(res => res.data),
  getById: (id: number) => api.get<Employee>(`/employees/${id}`).then(res => res.data),
  create: (employee: Partial<Employee>) => api.post<Employee>('/employees', { employee }).then(res => res.data),
  update: (id: number, employee: Partial<Employee>) => api.patch<Employee>(`/employees/${id}`, { employee }).then(res => res.data),
  delete: (id: number) => api.delete(`/employees/${id}`),
};

// 勤怠関連のAPI
export const attendanceApi = {
  getAll: () => api.get<Attendance[]>('/attendances').then(res => res.data),
  getById: (id: number) => api.get<Attendance>(`/attendances/${id}`).then(res => res.data),
  create: (attendance: Partial<Attendance>) => api.post<Attendance>('/attendances', { attendance }).then(res => res.data),
  update: (id: number, attendance: Partial<Attendance>) => api.patch<Attendance>(`/attendances/${id}`, { attendance }).then(res => res.data),
  delete: (id: number) => api.delete(`/attendances/${id}`),
  punch: (punchData: PunchRequest) => api.post('/attendances/punch', punchData).then(res => res.data),
  getByEmployeeAndDate: (employeeId: string, date: string) => 
    api.get<Attendance[]>(`/attendances/employee/${employeeId}/date/${date}`).then(res => res.data),
};

// レポート関連のAPI
export const reportApi = {
  daily: (date?: string) => api.get<Report>('/reports/daily', { params: { date } }).then(res => res.data),
  monthly: (year?: number, month?: number) => api.get<Report>('/reports/monthly', { params: { year, month } }).then(res => res.data),
  lineDaily: (date?: string, lineId?: string) => api.get<Report>('/reports/line_daily', { params: { date, line_id: lineId } }).then(res => res.data),
  lineMonthly: (year?: number, month?: number, lineId?: string) => api.get<Report>('/reports/line_monthly', { params: { year, month, line_id: lineId } }).then(res => res.data),
  getLineMonthlySummary: (lineId: string, year: number, month: number) => 
    api.get(`/reports/line_monthly_summary`, { 
      params: { line_id: lineId, year, month } 
    }).then(res => res.data),
  getMonthlyAttendance: (year: number, month: number, factoryId?: string, employeeId?: string) =>
    api.get('/reports/monthly_attendance', {
      params: { year, month, factory_id: factoryId, employee_id: employeeId }
    }).then(res => res.data),
  getMonthlyBandSummary: (year: number, month: number, factoryId?: string, employeeQuery?: string) =>
    api.get('/reports/monthly_band_summary', {
      params: { year, month, factory_id: factoryId, employee_query: employeeQuery }
    }).then(res => res.data),
  getErrorList: (date?: string, factoryId?: string, lineId?: string, mode?: string) =>
    api.get('/reports/error_list', {
      params: { date, factory_id: factoryId, line_id: lineId, mode }
    }).then(res => res.data),
  getAttendanceSummary: (date: string, lineId: string) =>
    api.get('/reports/attendance_summary', {
      params: { date, line_id: lineId }
    }).then(res => res.data),
  batchSaveAttendance: (date: string, lineId: string, entries: any[]) =>
    api.post('/reports/attendance_batch_save', {
      date,
      line_id: lineId,
      entries
    }).then(res => res.data),
  saveNoteOnly: (noteData: { employee_id: string; punch_type: string; punch_time: string; note: string }) =>
    api.post('/reports/save_note_only', noteData).then(res => res.data),
  getAttendanceBook: (params: {
    year: number;
    month: number;
    scope: string;
    factory_id?: string;
    line_id?: string;
    employee_id?: string;
  }) =>
    api.get('/reports/attendance_book', { params }).then(res => res.data),
  exportAttendanceBookCsv: (params: {
    year: number;
    month: number;
    scope: string;
    factory_id?: string;
    line_id?: string;
    employee_id?: string;
  }) =>
    api.get('/reports/attendance_book_csv', { 
      params,
      responseType: 'blob'
    }).then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `出勤簿_${params.year}年${params.month}月.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return res.data;
    }),
};

// シフト関連のAPI
export const shiftApi = {
  getAll: () => api.get<Shift[]>('/shifts').then(res => res.data),
  getById: (id: number) => api.get<Shift>(`/shifts/${id}`).then(res => res.data),
  create: (shift: Partial<Shift>) => api.post<Shift>('/shifts', { shift }).then(res => res.data),
  update: (id: number, shift: Partial<Shift>) => api.patch<Shift>(`/shifts/${id}`, { shift }).then(res => res.data),
  delete: (id: number) => api.delete(`/shifts/${id}`),
};

// 従業員シフト関連のAPI
export const employeeShiftApi = {
  getAll: () => api.get<EmployeeShift[]>('/employee_shifts').then(res => res.data),
  getById: (id: number) => api.get<EmployeeShift>(`/employee_shifts/${id}`).then(res => res.data),
  getByEmployee: (employeeId: string) => api.get<EmployeeShift[]>(`/employee_shifts?employee_id=${employeeId}`).then(res => res.data),
  create: (employeeShift: Partial<EmployeeShift>) => api.post<EmployeeShift>('/employee_shifts', { employee_shift: employeeShift }).then(res => res.data),
  update: (id: number, employeeShift: Partial<EmployeeShift>) => api.patch<EmployeeShift>(`/employee_shifts/${id}`, { employee_shift: employeeShift }).then(res => res.data),
  delete: (id: number) => api.delete(`/employee_shifts/${id}`),
};

// システム設定関連のAPI（削除 - device_configsに統合）

// 端末設定関連のAPI
export const deviceConfigApi = {
  getAll: () => api.get('/device_configs').then(res => res.data),
  getById: (deviceId: string) => api.get(`/device_configs/${deviceId}`).then(res => res.data),
  getByEnv: (deviceId: string) => api.get(`/device_configs/env/${deviceId}`).then(res => res.data),
  create: (config: any) => api.post('/device_configs', { device_config: config }).then(res => res.data),
  update: (deviceId: string, config: any) => api.put(`/device_configs/${deviceId}`, { device_config: config }).then(res => res.data),
  delete: (deviceId: string) => api.delete(`/device_configs/${deviceId}`),
  getShiftInputEnabled: (deviceId: string) => 
    api.get(`/device_configs/${deviceId}/shift_input_enabled`).then(res => res.data),
  setShiftInputEnabled: (deviceId: string, enabled: boolean) => 
    api.post(`/device_configs/${deviceId}/set_shift_input_enabled`, { enabled }).then(res => res.data),
};

// 管理者パスワード関連のAPI
export const adminPasswordApi = {
  getAll: () => api.get('/admin_passwords').then(res => res.data),
  getById: (id: number) => api.get(`/admin_passwords/${id}`).then(res => res.data),
  create: (adminPassword: { password: string; password_confirmation: string; description: string; is_active?: boolean }) => 
    api.post('/admin_passwords', { admin_password: adminPassword }).then(res => res.data),
  update: (id: number, adminPassword: { password?: string; password_confirmation?: string; description?: string; is_active?: boolean }) => 
    api.patch(`/admin_passwords/${id}`, { admin_password: adminPassword }).then(res => res.data),
  delete: (id: number) => api.delete(`/admin_passwords/${id}`),
  authenticate: (password: string) => 
    api.post('/admin_passwords/authenticate', { password }).then(res => res.data),
};

// システム設定関連のAPI
export const systemSettingApi = {
  getAll: () => api.get('/system_settings').then(res => res.data),
  getByKey: (key: string) => api.get(`/system_settings/${key}`).then(res => res.data),
  update: (key: string, value: string, description?: string) => 
    api.patch(`/system_settings/${key}`, { value, description }).then(res => res.data),
  getShiftInputEnabled: () => api.get('/system_settings/shift_input_enabled').then(res => res.data),
  setShiftInputEnabled: (enabled: boolean) => 
    api.post('/system_settings/set_shift_input_enabled', { enabled }).then(res => res.data),
  getTimeRoundingMode: () => api.get('/system_settings/time_rounding_mode').then(res => res.data),
  setTimeRoundingMode: (mode: number) => 
    api.post('/system_settings/set_time_rounding_mode', { mode }).then(res => res.data),
  getTimeRoundingOptions: () => api.get('/system_settings/time_rounding_options').then(res => res.data),
};

// 手当て設定関連のAPI
export const allowanceSettingApi = {
  getAll: () => api.get('/allowance_settings').then(res => res.data),
  getById: (id: number) => api.get(`/allowance_settings/${id}`).then(res => res.data),
  create: (allowanceSetting: any) => 
    api.post('/allowance_settings', { allowance_setting: allowanceSetting }).then(res => res.data),
  update: (id: number, allowanceSetting: any) => 
    api.patch(`/allowance_settings/${id}`, { allowance_setting: allowanceSetting }).then(res => res.data),
  delete: (id: number) => api.delete(`/allowance_settings/${id}`),
  getTypes: () => api.get('/allowance_settings/types').then(res => res.data),
  getActive: () => api.get('/allowance_settings/active').then(res => res.data),
  getByType: (type: string) => api.get(`/allowance_settings/by_type/${type}`).then(res => res.data),
};

// 役職設定関連のAPI
export const positionSettingApi = {
  getAll: () => api.get('/position_settings').then(res => res.data),
  getById: (id: number) => api.get(`/position_settings/${id}`).then(res => res.data),
  create: (positionSetting: any) => 
    api.post('/position_settings', { position_setting: positionSetting }).then(res => res.data),
  update: (id: number, positionSetting: any) => 
    api.patch(`/position_settings/${id}`, { position_setting: positionSetting }).then(res => res.data),
  delete: (id: number) => api.delete(`/position_settings/${id}`),
  getCodes: () => api.get('/position_settings/codes').then(res => res.data),
  getActive: () => api.get('/position_settings/active').then(res => res.data),
  getHierarchy: () => api.get('/position_settings/hierarchy').then(res => res.data),
  getFullyEligible: () => api.get('/position_settings/fully_eligible').then(res => res.data),
  getRestricted: () => api.get('/position_settings/restricted').then(res => res.data),
};

// スケジュールエントリ関連のAPI
export const scheduleEntryApi = {
  getAll: (params?: any) => api.get('/schedule_entries', { params }).then(res => res.data),
  getById: (id: number) => api.get(`/schedule_entries/${id}`).then(res => res.data),
  create: (scheduleEntry: any) => api.post('/schedule_entries', { schedule_entry: scheduleEntry }).then(res => res.data),
  update: (id: number, scheduleEntry: any) => api.patch(`/schedule_entries/${id}`, { schedule_entry: scheduleEntry }).then(res => res.data),
  delete: (id: number) => api.delete(`/schedule_entries/${id}`),
  bulkCreate: (entries: any[]) => api.post('/schedule_entries/bulk_create', { entries }).then(res => res.data),
  
  // 振り替え休日・代休専用API
  createCompensatoryHoliday: (data: any) => api.post('/schedule_entries/create_compensatory_holiday', data).then(res => res.data),
  createSubstituteHoliday: (data: any) => api.post('/schedule_entries/create_substitute_holiday', data).then(res => res.data),
  getCompensatoryHolidays: (params?: any) => api.get('/schedule_entries/compensatory_holidays', { params }).then(res => res.data),
  getSubstituteHolidays: (params?: any) => api.get('/schedule_entries/substitute_holidays', { params }).then(res => res.data),
  useSubstitute: (id: number) => api.patch(`/schedule_entries/${id}/use_substitute`).then(res => res.data),
};

// 休暇種別関連のAPI
export const leaveTypeApi = {
  getAll: () => api.get('/leave_types').then(res => res.data),
  getById: (id: number) => api.get(`/leave_types/${id}`).then(res => res.data),
  create: (leaveType: any) => api.post('/leave_types', { leave_type: leaveType }).then(res => res.data),
  update: (id: number, leaveType: any) => api.patch(`/leave_types/${id}`, { leave_type: leaveType }).then(res => res.data),
  delete: (id: number) => api.delete(`/leave_types/${id}`),
};

export default api;