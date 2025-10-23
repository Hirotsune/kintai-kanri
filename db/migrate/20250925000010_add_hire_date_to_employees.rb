class AddHireDateToEmployees < ActiveRecord::Migration[8.0]
  def up
    # まずNULL許可で列を追加
    add_column :employees, :hire_date, :date, comment: '入社日'
    add_column :employees, :paid_leave_days, :integer, default: 0, comment: '有給日数'
    add_column :employees, :used_paid_leave_days, :integer, default: 0, comment: '使用済み有給日数'
    add_column :employees, :remaining_paid_leave_days, :integer, default: 0, comment: '有給残日数'
    add_column :employees, :last_paid_leave_calculation_date, :date, comment: '最終有給計算日'
    
    # 既存の従業員データにデフォルトの入社日を設定（2024年1月1日）
    execute "UPDATE employees SET hire_date = '2024-01-01' WHERE hire_date IS NULL"
    
    # 有給日数を初期化（6ヶ月経過していない場合は0日）
    execute "UPDATE employees SET paid_leave_days = 0, remaining_paid_leave_days = 0 WHERE hire_date >= '2024-07-01'"
    # 6ヶ月経過している場合は10日付与
    execute "UPDATE employees SET paid_leave_days = 10, remaining_paid_leave_days = 10 WHERE hire_date < '2024-07-01'"
    
    # 入社日をNOT NULLに変更
    change_column_null :employees, :hire_date, false
    
    add_index :employees, :hire_date
    add_index :employees, :last_paid_leave_calculation_date
  end

  def down
    remove_index :employees, :hire_date
    remove_index :employees, :last_paid_leave_calculation_date
    
    remove_column :employees, :hire_date
    remove_column :employees, :paid_leave_days
    remove_column :employees, :used_paid_leave_days
    remove_column :employees, :remaining_paid_leave_days
    remove_column :employees, :last_paid_leave_calculation_date
  end
end
