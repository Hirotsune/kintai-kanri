class CreateAllowanceSettings < ActiveRecord::Migration[7.0]
  def change
    create_table :allowance_settings do |t|
      t.string :allowance_type, null: false
      # 'overtime', 'night_work', 'holiday_work', 'early_work', 'night_shift'
      t.string :name, null: false
      t.decimal :rate, precision: 5, scale: 2, default: 0  # 割増率（%）
      t.decimal :fixed_amount, precision: 8, scale: 2, default: 0  # 固定金額
      t.string :calculation_type, null: false  # 'rate', 'fixed', 'both'
      t.string :condition_type, null: false  # 'time_range', 'hours', 'shift'
      t.string :condition_value, null: false
      t.boolean :is_legal_requirement, default: false  # 法的要件かどうか
      t.boolean :is_active, default: true
      t.text :description
      t.timestamps
    end
    
    add_index :allowance_settings, :allowance_type
    add_index :allowance_settings, :is_active
  end
end
