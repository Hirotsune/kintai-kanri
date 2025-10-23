class FixOvertimeCalculationForExistingData < ActiveRecord::Migration[8.0]
  def up
    # 出社時間と退社時間が両方存在する勤怠データを取得
    attendances = Attendance.where.not(clock_in_time: nil, clock_out_time: nil)
    
    puts "残業時間の計算を修正します。対象件数: #{attendances.count}件"
    
    attendances.find_each.with_index do |attendance, index|
      # 各刻みでの残業時間を正しく再計算
      [15, 10, 5, 1].each do |minutes|
        # 各刻みの勤務時間を取得
        total_work_minutes = case minutes
        when 15 then attendance.total_work_time_15min
        when 10 then attendance.total_work_time_10min
        when 5 then attendance.total_work_time_5min
        when 1 then attendance.total_work_time_1min
        end
        
        next unless total_work_minutes.present? && total_work_minutes > 0
        
        # 8時間（480分）を超える場合は残業時間を正しく計算
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
    
    puts "残業時間の計算修正が完了しました。"
  end

  def down
    # ロールバック時は残業時間をリセット
    Attendance.update_all(
      overtime_15min: 0,
      overtime_10min: 0,
      overtime_5min: 0,
      overtime_1min: 0
    )
  end
end
