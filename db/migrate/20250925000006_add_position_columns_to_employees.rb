class AddPositionColumnsToEmployees < ActiveRecord::Migration[7.0]
  def change
    # 役職情報
    add_column :employees, :position, :string, default: 'employee'
    # 'employee', 'manager', 'director', 'executive'
    add_column :employees, :position_name, :string, default: '一般社員'
    # '一般社員', '主任', '課長', '部長', '役員'
    
    # 手当て適用フラグ
    add_column :employees, :overtime_allowance_eligible, :boolean, default: true
    add_column :employees, :night_work_allowance_eligible, :boolean, default: true
    add_column :employees, :holiday_work_allowance_eligible, :boolean, default: true
    add_column :employees, :early_work_allowance_eligible, :boolean, default: true
    add_column :employees, :night_shift_allowance_eligible, :boolean, default: true
    
    # 役職変更履歴
    add_column :employees, :position_changed_at, :datetime
    add_column :employees, :previous_position, :string
    
    # インデックス追加
    add_index :employees, :position
    add_index :employees, :overtime_allowance_eligible
    add_index :employees, :night_work_allowance_eligible
  end
end
