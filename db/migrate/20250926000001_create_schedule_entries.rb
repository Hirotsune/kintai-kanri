class CreateScheduleEntries < ActiveRecord::Migration[8.0]
  def change
    create_table :schedule_entries do |t|
      t.string :employee_id, null: false
      t.date :schedule_date, null: false
      t.string :schedule_type, null: false # 'shift', 'holiday', 'paid_leave', 'special_leave', 'absence'
      t.integer :shift_id
      t.string :leave_type
      t.time :start_time
      t.time :end_time
      t.string :reason
      t.string :status, default: 'scheduled' # 'scheduled', 'confirmed', 'cancelled'
      t.string :created_by
      t.string :approved_by
      t.datetime :approved_at
      t.text :notes
      t.boolean :is_active, default: true

      t.timestamps
    end

    add_index :schedule_entries, [:employee_id, :schedule_date]
    add_index :schedule_entries, :schedule_type
    add_index :schedule_entries, :status
    
    # 外部キー制約（shiftsのみ、employeesはアプリケーションレベルで整合性を保つ）
    add_foreign_key :schedule_entries, :shifts, column: :shift_id
  end
end
