class SeedAttendanceData < ActiveRecord::Migration[7.0]
  def up
    # 現在のDB構造に合わせた勤怠データを直接定義して流し込む
    attendance_data = [
      # 2025-07-01 のデータ
      { employee_id: '12345', punch_time: '2025-07-01 06:34:00', punch_type: '出社', work_date: '2025-07-01', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-01 11:43:00', punch_type: '昼休出１', work_date: '2025-07-01', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-01 12:57:00', punch_type: '昼休入１', work_date: '2025-07-01', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-01 15:07:00', punch_type: '昼休出２', work_date: '2025-07-01', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-01 15:50:00', punch_type: '昼休入２', work_date: '2025-07-01', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-01 17:27:00', punch_type: '退社', work_date: '2025-07-01', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      
      { employee_id: '34567', punch_time: '2025-07-01 07:43:00', punch_type: '出社', work_date: '2025-07-01', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-01 12:14:00', punch_type: '昼休出１', work_date: '2025-07-01', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-01 13:04:00', punch_type: '昼休入１', work_date: '2025-07-01', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-01 15:31:00', punch_type: '昼休出２', work_date: '2025-07-01', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-01 16:20:00', punch_type: '昼休入２', work_date: '2025-07-01', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-01 18:42:00', punch_type: '退社', work_date: '2025-07-01', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      
      # 2025-07-02 のデータ
      { employee_id: '12345', punch_time: '2025-07-02 06:37:00', punch_type: '出社', work_date: '2025-07-02', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-02 11:48:00', punch_type: '昼休出１', work_date: '2025-07-02', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-02 12:36:00', punch_type: '昼休入１', work_date: '2025-07-02', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-02 15:17:00', punch_type: '昼休出２', work_date: '2025-07-02', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-02 15:47:00', punch_type: '昼休入２', work_date: '2025-07-02', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-02 17:49:00', punch_type: '退社', work_date: '2025-07-02', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      
      { employee_id: '23456', punch_time: '2025-07-02 15:13:00', punch_type: '出社', work_date: '2025-07-02', factory_id: 'F001', line_id: 'L001', shift_type: 'afternoon', note: nil },
      { employee_id: '23456', punch_time: '2025-07-02 19:21:00', punch_type: '昼休出１', work_date: '2025-07-02', factory_id: 'F001', line_id: 'L001', shift_type: 'afternoon', note: nil },
      { employee_id: '23456', punch_time: '2025-07-02 20:14:00', punch_type: '昼休入１', work_date: '2025-07-02', factory_id: 'F001', line_id: 'L001', shift_type: 'afternoon', note: nil },
      { employee_id: '23456', punch_time: '2025-07-02 22:38:00', punch_type: '昼休出２', work_date: '2025-07-02', factory_id: 'F001', line_id: 'L001', shift_type: 'afternoon', note: nil },
      { employee_id: '23456', punch_time: '2025-07-02 23:17:00', punch_type: '昼休入２', work_date: '2025-07-02', factory_id: 'F001', line_id: 'L001', shift_type: 'afternoon', note: nil },
      
      { employee_id: '34567', punch_time: '2025-07-02 07:16:00', punch_type: '出社', work_date: '2025-07-02', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-02 12:16:00', punch_type: '昼休出１', work_date: '2025-07-02', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-02 13:07:00', punch_type: '昼休入１', work_date: '2025-07-02', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-02 15:48:00', punch_type: '昼休出２', work_date: '2025-07-02', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-02 16:16:00', punch_type: '昼休入２', work_date: '2025-07-02', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-02 18:53:00', punch_type: '退社', work_date: '2025-07-02', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      
      # 2025-07-03 のデータ
      { employee_id: '12345', punch_time: '2025-07-03 06:53:00', punch_type: '出社', work_date: '2025-07-03', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-03 11:33:00', punch_type: '昼休出１', work_date: '2025-07-03', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-03 12:43:00', punch_type: '昼休入１', work_date: '2025-07-03', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-03 15:15:00', punch_type: '昼休出２', work_date: '2025-07-03', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-03 15:50:00', punch_type: '昼休入２', work_date: '2025-07-03', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-03 17:40:00', punch_type: '退社', work_date: '2025-07-03', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      
      { employee_id: '23456', punch_time: '2025-07-03 01:40:00', punch_type: '退社', work_date: '2025-07-03', factory_id: 'F001', line_id: 'L001', shift_type: 'afternoon', note: nil },
      { employee_id: '23456', punch_time: '2025-07-03 15:18:00', punch_type: '出社', work_date: '2025-07-03', factory_id: 'F001', line_id: 'L001', shift_type: 'afternoon', note: nil },
      { employee_id: '23456', punch_time: '2025-07-03 19:03:00', punch_type: '昼休出１', work_date: '2025-07-03', factory_id: 'F001', line_id: 'L001', shift_type: 'afternoon', note: nil },
      { employee_id: '23456', punch_time: '2025-07-03 20:18:00', punch_type: '昼休入１', work_date: '2025-07-03', factory_id: 'F001', line_id: 'L001', shift_type: 'afternoon', note: nil },
      { employee_id: '23456', punch_time: '2025-07-03 22:54:00', punch_type: '昼休出２', work_date: '2025-07-03', factory_id: 'F001', line_id: 'L001', shift_type: 'afternoon', note: nil },
      { employee_id: '23456', punch_time: '2025-07-03 23:22:00', punch_type: '昼休入２', work_date: '2025-07-03', factory_id: 'F001', line_id: 'L001', shift_type: 'afternoon', note: nil },
      
      { employee_id: '34567', punch_time: '2025-07-03 07:36:00', punch_type: '出社', work_date: '2025-07-03', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-03 12:19:00', punch_type: '昼休出１', work_date: '2025-07-03', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-03 13:29:00', punch_type: '昼休入１', work_date: '2025-07-03', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-03 16:00:00', punch_type: '昼休出２', work_date: '2025-07-03', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-03 16:30:00', punch_type: '昼休入２', work_date: '2025-07-03', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-03 19:00:00', punch_type: '退社', work_date: '2025-07-03', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil }
    ]
    
    # データを一括挿入
    attendance_data.each do |data|
      Attendance.create!(
        employee_id: data[:employee_id],
        punch_time: Time.parse(data[:punch_time]),
        punch_type: data[:punch_type],
        work_date: Date.parse(data[:work_date]),
        factory_id: data[:factory_id],
        line_id: data[:line_id],
        shift_type: data[:shift_type],
        note: data[:note]
      )
    end
    
    puts "✅ #{attendance_data.length}件の勤怠データを正常に登録しました"
  end
  
  def down
    # 2025年7月のデータを削除
    deleted_count = Attendance.where(work_date: Date.new(2025, 7, 1)..Date.new(2025, 7, 31)).delete_all
    puts "✅ 2025年7月の勤怠データ#{deleted_count}件を削除しました"
  end
end