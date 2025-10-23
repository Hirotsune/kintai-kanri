class CreatePositionSettings < ActiveRecord::Migration[7.0]
  def change
    create_table :position_settings do |t|
      t.string :position_code, null: false  # 'employee', 'manager', 'director', 'executive'
      t.string :position_name, null: false  # '一般社員', '主任', '課長', '部長', '役員'
      t.integer :hierarchy_level, null: false  # 1=一般社員, 2=主任, 3=課長, 4=部長, 5=役員
      
      # 手当て適用フラグ
      t.boolean :overtime_allowance_eligible, default: true
      t.boolean :night_work_allowance_eligible, default: true
      t.boolean :holiday_work_allowance_eligible, default: true
      t.boolean :early_work_allowance_eligible, default: true
      t.boolean :night_shift_allowance_eligible, default: true
      
      # 役職手当て
      t.decimal :position_allowance, precision: 8, scale: 2, default: 0
      t.decimal :management_allowance, precision: 8, scale: 2, default: 0
      
      t.boolean :is_active, default: true
      t.text :description
      t.timestamps
    end
    
    add_index :position_settings, :position_code
    add_index :position_settings, :hierarchy_level
  end
end
