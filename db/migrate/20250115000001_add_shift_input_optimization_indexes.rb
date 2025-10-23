class AddShiftInputOptimizationIndexes < ActiveRecord::Migration[8.0]
  def change
    # 勤怠シフト入力画面用の追加最適化インデックス
    
    # schedule_entries: 工場・ライン別検索用（必要に応じて）
    # add_index :schedule_entries, [:schedule_date, :schedule_type, :status], 
    #           name: 'index_schedule_entries_on_date_type_status' unless index_exists?(:schedule_entries, [:schedule_date, :schedule_type, :status], name: 'index_schedule_entries_on_date_type_status')
    
    # employees: 工場・ライン・アクティブ状態の複合検索用
    add_index :employees, [:factory_id, :line_id, :is_active], 
              name: 'index_employees_on_factory_line_active' unless index_exists?(:employees, [:factory_id, :line_id, :is_active], name: 'index_employees_on_factory_line_active')
    
    # schedule_entries: 日付範囲・従業員・タイプの複合検索用
    add_index :schedule_entries, [:schedule_date, :employee_id, :schedule_type], 
              name: 'index_schedule_entries_on_date_employee_type' unless index_exists?(:schedule_entries, [:schedule_date, :employee_id, :schedule_type], name: 'index_schedule_entries_on_date_employee_type')
  end
end
