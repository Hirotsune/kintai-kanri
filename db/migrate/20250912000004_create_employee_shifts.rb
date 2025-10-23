class CreateEmployeeShifts < ActiveRecord::Migration[7.0]
  def change
    create_table :employee_shifts do |t|
      t.references :employee, null: false, foreign_key: true
      t.references :shift, null: false, foreign_key: true
      t.boolean :is_default, default: false          # デフォルトシフト
      t.date :effective_from                         # 適用開始日
      t.date :effective_to                           # 適用終了日
      
      t.timestamps
    end
    
    add_index :employee_shifts, [:employee_id, :is_default]
    add_index :employee_shifts, [:employee_id, :effective_from, :effective_to], name: 'idx_emp_shifts_effective'
  end
end
