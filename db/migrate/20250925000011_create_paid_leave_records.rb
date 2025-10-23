class CreatePaidLeaveRecords < ActiveRecord::Migration[8.0]
  def change
    create_table :paid_leave_records do |t|
      t.string :employee_id, null: false, comment: '従業員ID'
      t.date :leave_date, null: false, comment: '有給取得日'
      t.integer :days, null: false, default: 1, comment: '取得日数'
      t.string :reason, comment: '取得理由'
      t.string :status, default: 'approved', comment: '承認状態'
      t.text :notes, comment: '備考'
      t.string :approved_by, comment: '承認者'
      t.datetime :approved_at, comment: '承認日時'
      t.timestamps
    end
    
    add_index :paid_leave_records, :employee_id
    add_index :paid_leave_records, :leave_date
    add_index :paid_leave_records, :status
    add_index :paid_leave_records, [:employee_id, :leave_date], unique: true
  end
end

