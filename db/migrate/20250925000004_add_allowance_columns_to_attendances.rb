class AddAllowanceColumnsToAttendances < ActiveRecord::Migration[7.0]
  def change
    # 法的割増手当て
    add_column :attendances, :overtime_allowance, :decimal, precision: 8, scale: 2, default: 0
    add_column :attendances, :night_work_allowance, :decimal, precision: 8, scale: 2, default: 0
    add_column :attendances, :holiday_work_allowance, :decimal, precision: 8, scale: 2, default: 0
    
    # 会社独自手当て
    add_column :attendances, :early_work_allowance, :decimal, precision: 8, scale: 2, default: 0
    add_column :attendances, :night_shift_allowance, :decimal, precision: 8, scale: 2, default: 0
    
    # 手当て詳細
    add_column :attendances, :overtime_hours, :decimal, precision: 4, scale: 2, default: 0
    add_column :attendances, :night_work_hours, :decimal, precision: 4, scale: 2, default: 0
    add_column :attendances, :holiday_work_hours, :decimal, precision: 4, scale: 2, default: 0
    
    # 手当て合計
    add_column :attendances, :total_legal_allowance, :decimal, precision: 8, scale: 2, default: 0
    add_column :attendances, :total_company_allowance, :decimal, precision: 8, scale: 2, default: 0
    add_column :attendances, :total_allowance, :decimal, precision: 8, scale: 2, default: 0
    
    # インデックス追加
    add_index :attendances, :overtime_allowance
    add_index :attendances, :night_work_allowance
    add_index :attendances, :holiday_work_allowance
    add_index :attendances, :total_allowance
  end
end
