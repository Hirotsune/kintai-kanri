class CreatePaidLeaveCalculationLogs < ActiveRecord::Migration[8.0]
  def change
    create_table :paid_leave_calculation_logs do |t|
      t.string :employee_id, null: false, comment: '従業員ID'
      t.date :calculation_date, null: false, comment: '計算日'
      t.integer :previous_days, default: 0, comment: '前回の有給日数'
      t.integer :new_days, null: false, comment: '新しい有給日数'
      t.integer :added_days, null: false, comment: '追加された日数'
      t.string :calculation_reason, null: false, comment: '計算理由'
      t.text :notes, comment: '備考'
      t.timestamps
    end
    
    add_index :paid_leave_calculation_logs, :employee_id
    add_index :paid_leave_calculation_logs, :calculation_date
    add_index :paid_leave_calculation_logs, :calculation_reason
  end
end

