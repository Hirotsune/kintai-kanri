class AddLineDailyReportOptimizationIndexes < ActiveRecord::Migration[8.0]
  def change
    # ライン別実績表用の最適化インデックス
    
    # attendances: 日付・ラインID・従業員IDの複合インデックス（メインクエリ用）
    add_index :attendances, [:work_date, :line_id, :employee_id], 
              name: 'index_attendances_on_work_date_line_employee' unless index_exists?(:attendances, [:work_date, :line_id, :employee_id], name: 'index_attendances_on_work_date_line_employee')
    
    # attendances: 日付・従業員ID・打刻時間の複合インデックス（ソート用）
    add_index :attendances, [:work_date, :employee_id, :punch_time], 
              name: 'index_attendances_on_work_date_employee_punch_time' unless index_exists?(:attendances, [:work_date, :employee_id, :punch_time], name: 'index_attendances_on_work_date_employee_punch_time')
    
    # employees: ラインID・アクティブ状態・従業員IDの複合インデックス（JOIN最適化用）
    add_index :employees, [:line_id, :is_active, :employee_id], 
              name: 'index_employees_on_line_active_employee_id' unless index_exists?(:employees, [:line_id, :is_active, :employee_id], name: 'index_employees_on_line_active_employee_id')
    
    # attendances: ラインID・日付の複合インデックス（ライン別集計用）
    add_index :attendances, [:line_id, :work_date], 
              name: 'index_attendances_on_line_id_work_date' unless index_exists?(:attendances, [:line_id, :work_date], name: 'index_attendances_on_line_id_work_date')
  end
end
