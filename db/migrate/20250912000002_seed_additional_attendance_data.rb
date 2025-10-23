class SeedAdditionalAttendanceData < ActiveRecord::Migration[7.0]
  def up
    # 2025年7月4日〜5日の追加勤怠データ
    additional_attendance_data = [
      # 2025-07-04 のデータ
      { employee_id: '12345', punch_time: '2025-07-04 06:40:00', punch_type: '出社', work_date: '2025-07-04', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-04 11:30:00', punch_type: '昼休出１', work_date: '2025-07-04', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-04 12:48:00', punch_type: '昼休入１', work_date: '2025-07-04', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-04 15:27:00', punch_type: '昼休出２', work_date: '2025-07-04', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-04 15:59:00', punch_type: '昼休入２', work_date: '2025-07-04', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-04 17:02:00', punch_type: '退社', work_date: '2025-07-04', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },

      { employee_id: '23456', punch_time: '2025-07-04 01:40:00', punch_type: '退社', work_date: '2025-07-04', factory_id: 'F001', line_id: 'L001', shift_type: 'afternoon', note: nil },
      { employee_id: '23456', punch_time: '2025-07-04 15:27:00', punch_type: '出社', work_date: '2025-07-04', factory_id: 'F001', line_id: 'L001', shift_type: 'afternoon', note: nil },
      { employee_id: '23456', punch_time: '2025-07-04 19:09:00', punch_type: '昼休出１', work_date: '2025-07-04', factory_id: 'F001', line_id: 'L001', shift_type: 'afternoon', note: nil },
      { employee_id: '23456', punch_time: '2025-07-04 20:28:00', punch_type: '昼休入１', work_date: '2025-07-04', factory_id: 'F001', line_id: 'L001', shift_type: 'afternoon', note: nil },
      { employee_id: '23456', punch_time: '2025-07-04 23:00:00', punch_type: '昼休出２', work_date: '2025-07-04', factory_id: 'F001', line_id: 'L001', shift_type: 'afternoon', note: nil },
      { employee_id: '23456', punch_time: '2025-07-04 23:29:00', punch_type: '昼休入２', work_date: '2025-07-04', factory_id: 'F001', line_id: 'L001', shift_type: 'afternoon', note: nil },

      { employee_id: '34567', punch_time: '2025-07-04 07:21:00', punch_type: '出社', work_date: '2025-07-04', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-04 12:18:00', punch_type: '昼休出１', work_date: '2025-07-04', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-04 13:28:00', punch_type: '昼休入１', work_date: '2025-07-04', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-04 15:35:00', punch_type: '昼休出２', work_date: '2025-07-04', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-04 16:16:00', punch_type: '昼休入２', work_date: '2025-07-04', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-04 18:34:00', punch_type: '退社', work_date: '2025-07-04', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },

      # 2025-07-05 のデータ
      { employee_id: '12345', punch_time: '2025-07-05 06:44:00', punch_type: '出社', work_date: '2025-07-05', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-05 11:36:00', punch_type: '昼休出１', work_date: '2025-07-05', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-05 12:55:00', punch_type: '昼休入１', work_date: '2025-07-05', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-05 15:11:00', punch_type: '昼休出２', work_date: '2025-07-05', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-05 15:49:00', punch_type: '昼休入２', work_date: '2025-07-05', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },
      { employee_id: '12345', punch_time: '2025-07-05 17:30:00', punch_type: '退社', work_date: '2025-07-05', factory_id: 'F001', line_id: 'L001', shift_type: 'morning', note: nil },

      { employee_id: '34567', punch_time: '2025-07-05 07:44:00', punch_type: '出社', work_date: '2025-07-05', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-05 12:15:00', punch_type: '昼休出１', work_date: '2025-07-05', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-05 13:23:00', punch_type: '昼休入１', work_date: '2025-07-05', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-05 15:32:00', punch_type: '昼休出２', work_date: '2025-07-05', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-05 16:23:00', punch_type: '昼休入２', work_date: '2025-07-05', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil },
      { employee_id: '34567', punch_time: '2025-07-05 18:51:00', punch_type: '退社', work_date: '2025-07-05', factory_id: 'F001', line_id: 'L002', shift_type: 'morning', note: nil }
    ]

    # データを一括挿入
    additional_attendance_data.each do |data|
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

    puts "✅ #{additional_attendance_data.length}件の追加勤怠データを正常に登録しました"
  end

  def down
    # 2025年7月4日〜5日のデータを削除
    deleted_count = Attendance.where(work_date: Date.new(2025, 7, 4)..Date.new(2025, 7, 5)).delete_all
    puts "✅ 2025年7月4日〜5日の勤怠データ#{deleted_count}件を削除しました"
  end
end
