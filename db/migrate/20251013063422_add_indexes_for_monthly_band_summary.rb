class AddIndexesForMonthlyBandSummary < ActiveRecord::Migration[8.0]
  def change
    # attendancesテーブルの複合インデックス（勤怠集計用）
    add_index :attendances, [:work_date, :employee_id], 
              name: 'index_attendances_on_work_date_and_employee_id'
    
    add_index :attendances, [:work_date, :factory_id], 
              name: 'index_attendances_on_work_date_and_factory_id'
    
    add_index :attendances, [:employee_id, :work_date, :factory_id], 
              name: 'index_attendances_on_employee_work_date_factory'
    
    # employeesテーブルの検索用インデックス
    add_index :employees, [:is_active, :employee_id], 
              name: 'index_employees_on_active_and_employee_id'
    
    add_index :employees, [:is_active, :name], 
              name: 'index_employees_on_active_and_name'
    
    # 既存のインデックスが重複しないよう確認
    # 必要に応じて既存のインデックスを削除
  end
end