# 休憩時間を考慮した正しい丸め計算スクリプト
puts "休憩時間を考慮した丸め計算の修正開始..."

# 丸め計算の関数
def round_time_down(time, minutes)
  return nil if time.nil?
  total_minutes = time.hour * 60 + time.min
  rounded_minutes = (total_minutes / minutes) * minutes
  Time.zone.local(2000, 1, 1, rounded_minutes / 60, rounded_minutes % 60)
end

def round_time_up(time, minutes)
  return nil if time.nil?
  total_minutes = time.hour * 60 + time.min
  rounded_minutes = ((total_minutes + minutes - 1) / minutes) * minutes
  Time.zone.local(2000, 1, 1, rounded_minutes / 60, rounded_minutes % 60)
end

# 対象レコードを取得
attendances = Attendance.where("lunch_out1_time IS NOT NULL AND lunch_in1_time IS NOT NULL")
puts "修正対象レコード数: #{attendances.count}件"

updated_count = 0
error_count = 0

attendances.find_each do |attendance|
  begin
    lunch_out_time = attendance.lunch_out1_time
    lunch_in_time = attendance.lunch_in1_time
    
    # 15分刻みの計算
    lunch_out_15min = round_time_down(lunch_out_time, 15)
    lunch_in_15min = round_time_up(lunch_in_time, 15)
    
    # 休憩時間が1時間以内の場合の調整
    break_duration_minutes = (lunch_in_time - lunch_out_time) / 60
    if break_duration_minutes <= 60
      lunch_in_15min = lunch_out_15min + 1.hour
    end
    
    # 10分刻みの計算
    lunch_out_10min = round_time_down(lunch_out_time, 10)
    lunch_in_10min = round_time_up(lunch_in_time, 10)
    if break_duration_minutes <= 60
      lunch_in_10min = lunch_out_10min + 1.hour
    end
    
    # 5分刻みの計算
    lunch_out_5min = round_time_down(lunch_out_time, 5)
    lunch_in_5min = round_time_up(lunch_in_time, 5)
    if break_duration_minutes <= 60
      lunch_in_5min = lunch_out_5min + 1.hour
    end
    
    # 1分刻みの計算
    lunch_out_1min = round_time_down(lunch_out_time, 1)
    lunch_in_1min = round_time_up(lunch_in_time, 1)
    if break_duration_minutes <= 60
      lunch_in_1min = lunch_out_1min + 1.hour
    end
    
    # データベースを更新
    attendance.update!(
      lunch_out1_15min: lunch_out_15min,
      lunch_in1_15min: lunch_in_15min,
      lunch_out1_10min: lunch_out_10min,
      lunch_in1_10min: lunch_in_10min,
      lunch_out1_5min: lunch_out_5min,
      lunch_in1_5min: lunch_in_5min,
      lunch_out1_1min: lunch_out_1min,
      lunch_in1_1min: lunch_in_1min
    )
    
    updated_count += 1
    
    # 進捗表示
    if updated_count % 1000 == 0
      puts "処理済み: #{updated_count}件"
    end
    
  rescue => e
    error_count += 1
    puts "エラー: #{attendance.id} - #{e.message}"
  end
end

puts "=== 修正完了 ==="
puts "更新成功: #{updated_count}件"
puts "エラー: #{error_count}件"

# 修正結果の確認
puts "\n=== 修正結果の確認 ==="
sample = Attendance.where("lunch_out1_time IS NOT NULL AND lunch_in1_time IS NOT NULL").first
if sample
  puts "サンプルレコード ID: #{sample.id}"
  puts "lunch_out1_time: #{sample.lunch_out1_time}"
  puts "lunch_in1_time: #{sample.lunch_in1_time}"
  puts "lunch_out1_15min: #{sample.lunch_out1_15min}"
  puts "lunch_in1_15min: #{sample.lunch_in1_15min}"
  
  if sample.lunch_out1_15min && sample.lunch_in1_15min
    break_duration = (sample.lunch_in1_15min - sample.lunch_out1_15min) / 60
    puts "休憩時間（15分刻み）: #{break_duration}分"
  end
end
