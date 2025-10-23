class AddShiftInputScheduleOptimizationIndexes < ActiveRecord::Migration[8.0]
  def change
    # 勤怠シフト入力画面のスケジュール登録用最適化インデックス
    
    # schedule_entries: 従業員・日付・アクティブ状態の複合検索用
    add_index :schedule_entries, [:employee_id, :schedule_date, :is_active], 
              name: 'index_schedule_entries_on_employee_date_active' unless index_exists?(:schedule_entries, [:employee_id, :schedule_date, :is_active], name: 'index_schedule_entries_on_employee_date_active')
    
    # schedule_entries: 日付・アクティブ状態の複合検索用（一括削除用）
    add_index :schedule_entries, [:schedule_date, :is_active], 
              name: 'index_schedule_entries_on_date_active' unless index_exists?(:schedule_entries, [:schedule_date, :is_active], name: 'index_schedule_entries_on_date_active')
  end
end
