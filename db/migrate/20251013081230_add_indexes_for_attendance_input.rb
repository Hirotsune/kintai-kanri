class AddIndexesForAttendanceInput < ActiveRecord::Migration[8.0]
  def change
    # 勤怠入力画面用の最適化インデックス
    
    # employeesテーブル: line_id + is_active の複合インデックス
    add_index :employees, [:line_id, :is_active], 
              name: 'index_employees_on_line_id_and_is_active' unless index_exists?(:employees, [:line_id, :is_active], name: 'index_employees_on_line_id_and_is_active')
    
    # 勤怠入力画面でよく使われるクエリパターン用
    add_index :attendances, [:work_date, :employee_id, :clock_in_time], 
              name: 'index_attendances_on_work_date_employee_clock_in',
              where: 'clock_in_time IS NOT NULL' unless index_exists?(:attendances, [:work_date, :employee_id, :clock_in_time], name: 'index_attendances_on_work_date_employee_clock_in')
    
    # ライン別勤怠データ取得用
    add_index :attendances, [:work_date, :line_id], 
              name: 'index_attendances_on_work_date_and_line_id' unless index_exists?(:attendances, [:work_date, :line_id], name: 'index_attendances_on_work_date_and_line_id')
  end
end