// 工場の型定義
export interface Factory {
    id: number;
    factory_id: string;
    name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  
  // ラインの型定義
  export interface Line {
    id: number;
    line_id: string;
    name: string;
    factory_id: string;  // 文字列型（F001など）
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  
  // 従業員の型定義
  export interface Employee {
    id: number;
    employee_id: string;  // string型に修正（数字のみ、例："001"）
    name: string;
    name_kana?: string;   // ひらがな名（オプショナル）
    department: string;
    line_id: string;      // 文字列型に修正（L001など）
    factory_id: string;   // 文字列型に修正（F001など）
    factory_name: string; // 工場名
    hire_date: string;    // 入社日
    paid_leave_days: number; // 有給日数
    used_paid_leave_days: number; // 使用済み有給日数
    remaining_paid_leave_days: number; // 有給残日数
    last_paid_leave_calculation_date?: string; // 最終有給計算日
    line_name: string;    // ライン名
    status: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  
  // 勤怠の型定義（横型テーブル対応）
  export interface Attendance {
    employee_id: string;  // 文字列型（E001など）
    work_date: string;
    factory_id: string;   // 文字列型（F001など）
    line_id: string;      // 文字列型（L001など）
    employee_name?: string;
    shift_type?: string;
    clock_in_time?: string;
    clock_in_line_id?: string;  // 出社時のラインID
    lunch_out1_time?: string;
    lunch_in1_time?: string;
    lunch_in1_line_id?: string;  // 昼休入1時のラインID
    lunch_out2_time?: string;
    lunch_in2_time?: string;
    lunch_in2_line_id?: string;  // 昼休入2時のラインID
    clock_out_time?: string;
    clock_out_line_id?: string;  // 退社時のラインID
    total_work_time_15min?: number;
    total_work_time_10min?: number;
    total_work_time_5min?: number;
    total_work_time_1min?: number;
    created_at: string;
    updated_at: string;
  }

  // 従業員情報付き勤怠の型定義（APIレスポンス用）
  export interface AttendanceWithEmployee {
    id: number;
    employee_id: string;  // 文字列型に修正
    punch_time: string;
    punch_type: string;
    work_date: string;
    factory_id: string;   // 文字列型に修正
    line_id: string;      // 文字列型に修正
    shift_type: string;
    created_at: string;
    updated_at: string;
    total_work_time_15min?: number;  // 15分刻み総労働時間（分）
    total_work_time_10min?: number;  // 10分刻み総労働時間（分）
    total_work_time_5min?: number;   // 5分刻み総労働時間（分）
    total_work_time_1min?: number;   // 1分刻み総労働時間（分）
    employee: {
      id: number;
      employee_id: string;
      name: string;
      department: string;
      line_id: number;
      factory_id: number;
      status: string;
      created_at: string;
      updated_at: string;
    };
    factory: {
      id: number;
      factory_id: string;
      name: string;
      created_at: string;
      updated_at: string;
    };
    line: {
      id: number;
      line_id: string;
      name: string;
      factory_id: number;
      created_at: string;
      updated_at: string;
    };
  }
  
  // 打刻タイプの型定義
  export type PunchType = '出社' | '昼休出１' | '昼休入１' | '昼休出２' | '昼休入２' | '退社';
  
  // シフトタイプの型定義
  export type ShiftType = 'morning' | 'afternoon';
  
  // 従業員ステータスの型定義
  export type EmployeeStatus = 'active' | 'inactive';
  
  // 打刻リクエストの型定義
  export interface PunchRequest {
    employee_id: string;  // string型に修正（数字のみ、例："001"）
    punch_type: string;
    factory_id: string;   // 工場ID（F001など）
    line_id: string;      // ラインID（L001など）
  }
  
  // APIレスポンスの型定義
  export interface ApiResponse<T> {
    data?: T;
    errors?: string[];
    message?: string;
  }
  
  // シフトの型定義
  export interface Shift {
    id: number;
    name: string;
    start_time: string;
    end_time: string;  // 追加
    duration_hours: number;
    date_boundary_hour: number;
    factory_id?: string;
    is_active: boolean;
    description?: string;
    created_at: string;
    updated_at: string;
  }

  // 従業員シフトの型定義
  export interface EmployeeShift {
    id: number;
    employee_id: string;
    shift_id: number;
    is_default: boolean;
    effective_from?: string;
    effective_to?: string;
    created_at: string;
    updated_at: string;
    employee?: Employee;
    shift?: Shift;
  }

  // レポートの型定義
  export interface Report {
    date?: string;
    year?: number;
    month?: number;
    line_id?: string;
    total_attendances: number;
    total_employees: number;
    attendances: AttendanceWithEmployee[];  // AttendanceWithEmployeeに変更
  }

  // システム設定の型定義
  export interface SystemSetting {
    id: number;
    key: string;
    value: string;
    description?: string;
    created_at: string;
    updated_at: string;
  }

  // 手当て設定の型定義
  export interface AllowanceSetting {
    id: number;
    allowance_type: string;
    name: string;
    rate?: number;
    fixed_amount?: number;
    calculation_type: string;
    condition_type: string;
    condition_value: string;
    is_legal_requirement: boolean;
    is_active: boolean;
    description?: string;
    created_at: string;
    updated_at: string;
  }

  // 役職設定の型定義
  export interface PositionSetting {
    id: number;
    position_code: string;
    position_name: string;
    hierarchy_level: number;
    overtime_allowance_eligible: boolean;
    night_work_allowance_eligible: boolean;
    holiday_work_allowance_eligible: boolean;
    early_work_allowance_eligible: boolean;
    night_shift_allowance_eligible: boolean;
    position_allowance: number;
    management_allowance: number;
    is_active: boolean;
    description?: string;
    created_at: string;
    updated_at: string;
  }

  // 管理者パスワードの型定義
  export interface AdminPassword {
    id: number;
    description: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }

  // 有給取得記録の型定義
  export interface PaidLeaveRecord {
    id: number;
    employee_id: string;
    leave_date: string;
    days: number;
    reason?: string;
    status: 'pending' | 'approved' | 'rejected';
    notes?: string;
    approved_by?: string;
    approved_at?: string;
    created_at: string;
    updated_at: string;
  }

  // 有給計算ログの型定義
  export interface PaidLeaveCalculationLog {
    id: number;
    employee_id: string;
    calculation_date: string;
    previous_days: number;
    new_days: number;
    added_days: number;
    calculation_reason: string;
    notes?: string;
    created_at: string;
    updated_at: string;
  }

  // 休暇種別の型定義
  export interface LeaveType {
    id: number;
    name: string;
    code: string;
    description?: string;
    requires_approval: boolean;
    is_paid: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }

  // スケジュールエントリの型定義
  export interface ScheduleEntry {
    id: number;
    employee_id: string;
    schedule_date: string;
    schedule_type: string;
    shift_id?: number;
    leave_type?: string;
    start_time?: string;
    end_time?: string;
    reason?: string;
    status: string;
    created_by: string;
    approved_by?: string;
    approved_at?: string;
    notes?: string;
    is_active: boolean;
    is_compensatory?: boolean;
    original_date?: string;
    compensatory_type?: string;
    allowance_override?: any;
    business_rules?: any;
    created_at: string;
    updated_at: string;
  }