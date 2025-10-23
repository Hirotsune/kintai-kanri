class AddScheduledTimesToAttendances < ActiveRecord::Migration[7.0]
  def change
    add_column :attendances, :scheduled_start_time, :time, comment: "予定開始時刻"
    add_column :attendances, :scheduled_end_time, :time, comment: "予定終了時刻"
    add_column :attendances, :scheduled_break_duration_minutes, :integer, comment: "予定休憩時間（分）"
    
    add_index :attendances, :scheduled_start_time
    add_index :attendances, :scheduled_end_time
  end
end
