class RecalculateWorkTimeAndOvertimeForExistingData < ActiveRecord::Migration[8.0]
  def up
    # 出社時間と退社時間が両方存在する勤怠データを取得
    attendances = Attendance.where.not(clock_in_time: nil, clock_out_time: nil)
    
    puts "勤務時間と残業時間を再計算します。対象件数: #{attendances.count}件"
    
    attendances.find_each.with_index do |attendance, index|
      # 各刻みでの勤務時間を計算
      [15, 10, 5, 1].each do |minutes|
        # 出社時間（丸め済み）
        clock_in_rounded = case minutes
        when 15 then attendance.clock_in_rounded_15min
        when 10 then attendance.clock_in_rounded_10min
        when 5 then attendance.clock_in_rounded_5min
        when 1 then attendance.clock_in_rounded_1min
        end
        
        # 退社時間（丸め済み）
        clock_out_rounded = case minutes
        when 15 then attendance.clock_out_rounded_15min
        when 10 then attendance.clock_out_rounded_10min
        when 5 then attendance.clock_out_rounded_5min
        when 1 then attendance.clock_out_rounded_1min
        end
        
        next unless clock_in_rounded.present? && clock_out_rounded.present?
        
        # 時間計算
        start_time = Time.parse("#{attendance.work_date} #{clock_in_rounded}")
        end_time = Time.parse("#{attendance.work_date} #{clock_out_rounded}")
        
        # 昼休時間を考慮した実労働時間を計算（各刻みの丸め済み時間を使用）
        total_work_minutes = calculate_actual_work_time_with_rounding(start_time, end_time, attendance, minutes)
        
        # 各刻みの勤務時間を保存（分単位）
        case minutes
        when 15
          attendance.total_work_time_15min = total_work_minutes
        when 10
          attendance.total_work_time_10min = total_work_minutes
        when 5
          attendance.total_work_time_5min = total_work_minutes
        when 1
          attendance.total_work_time_1min = total_work_minutes
        end
        
        # 8時間（480分）を超える場合は残業時間を計算（分単位）
        if total_work_minutes > 480
          overtime_minutes = total_work_minutes - 480
          
          case minutes
          when 15
            attendance.overtime_15min = overtime_minutes
          when 10
            attendance.overtime_10min = overtime_minutes
          when 5
            attendance.overtime_5min = overtime_minutes
          when 1
            attendance.overtime_1min = overtime_minutes
          end
        else
          # 8時間以下の場合は残業時間を0に設定
          case minutes
          when 15
            attendance.overtime_15min = 0
          when 10
            attendance.overtime_10min = 0
          when 5
            attendance.overtime_5min = 0
          when 1
            attendance.overtime_1min = 0
          end
        end
      end
      
      # データを保存
      attendance.save!
      
      # 進捗表示
      if (index + 1) % 100 == 0
        puts "処理済み: #{index + 1}件"
      end
    end
    
    puts "勤務時間と残業時間の再計算が完了しました。"
  end

  def down
    # ロールバック時は勤務時間と残業時間をリセット
    Attendance.update_all(
      total_work_time_15min: 0,
      total_work_time_10min: 0,
      total_work_time_5min: 0,
      total_work_time_1min: 0,
      overtime_15min: 0,
      overtime_10min: 0,
      overtime_5min: 0,
      overtime_1min: 0
    )
  end

  private

  # 実労働時間計算メソッド（刻み毎の丸め済み時間を使用）
  def calculate_actual_work_time_with_rounding(start_time, end_time, attendance, minutes)
    total_minutes = ((end_time - start_time) / 60).to_i
    
    # 昼休時間を差し引く（刻み毎の丸め済み時間を使用）
    lunch_break_minutes = 0
    
    # 昼休出1と昼休入1がある場合
    if attendance.lunch_out1_time.present? && attendance.lunch_in1_time.present?
      # 刻み毎の丸め済み時間を取得
      lunch_out1_rounded = case minutes
      when 15 then attendance.lunch_out1_15min
      when 10 then attendance.lunch_out1_10min
      when 5 then attendance.lunch_out1_5min
      when 1 then attendance.lunch_out1_1min
      end
      
      lunch_in1_rounded = case minutes
      when 15 then attendance.lunch_in1_15min
      when 10 then attendance.lunch_in1_10min
      when 5 then attendance.lunch_in1_5min
      when 1 then attendance.lunch_in1_1min
      end
      
      if lunch_out1_rounded.present? && lunch_in1_rounded.present?
        lunch_out1 = Time.parse("#{attendance.work_date} #{lunch_out1_rounded}")
        lunch_in1 = Time.parse("#{attendance.work_date} #{lunch_in1_rounded}")
        lunch_break_minutes += ((lunch_in1 - lunch_out1) / 60).to_i
      end
    end
    
    # 昼休出2と昼休入2がある場合
    if attendance.lunch_out2_time.present? && attendance.lunch_in2_time.present?
      # 刻み毎の丸め済み時間を取得
      lunch_out2_rounded = case minutes
      when 15 then attendance.lunch_out2_15min
      when 10 then attendance.lunch_out2_10min
      when 5 then attendance.lunch_out2_5min
      when 1 then attendance.lunch_out2_1min
      end
      
      lunch_in2_rounded = case minutes
      when 15 then attendance.lunch_in2_15min
      when 10 then attendance.lunch_in2_10min
      when 5 then attendance.lunch_in2_5min
      when 1 then attendance.lunch_in2_1min
      end
      
      if lunch_out2_rounded.present? && lunch_in2_rounded.present?
        lunch_out2 = Time.parse("#{attendance.work_date} #{lunch_out2_rounded}")
        lunch_in2 = Time.parse("#{attendance.work_date} #{lunch_in2_rounded}")
        lunch_break_minutes += ((lunch_in2 - lunch_out2) / 60).to_i
      end
    end
    
    # 実労働時間 = 総時間 - 昼休時間
    actual_work_minutes = total_minutes - lunch_break_minutes
    
    # 負の値にならないようにする
    [actual_work_minutes, 0].max
  end
end
