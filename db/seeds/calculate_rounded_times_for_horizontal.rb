# 横型データの丸め時間を計算・設定するスクリプト

puts "=== 横型データの丸め時間計算開始 ==="

# 丸め処理のルールに基づくメソッド
def round_punch_time(punch_time, punch_type, minutes)
  return nil if punch_time.nil?
  
  time = punch_time.to_time
  hour = time.hour
  min = time.min
  
  case punch_type
  when '出社'
    # 出社：切り上げ
    rounded_min = ((min.to_f / minutes).ceil * minutes) % 60
    if rounded_min == 0 && min > 0
      hour += 1
    end
  when '昼休出１', '昼休出２'
    # 昼休出：切り下げ
    rounded_min = (min / minutes) * minutes
  when '昼休入１'
    # 昼休入1：1時間以内は1時間扱い、超過時は切り上げ
    if punch_time.hour == 13 && punch_time.min <= 59
      hour = 14
      rounded_min = 0
    else
      rounded_min = ((min.to_f / minutes).ceil * minutes) % 60
      if rounded_min == 0 && min > 0
        hour += 1
      end
    end
  when '昼休入２'
    # 昼休入2：切り上げ
    rounded_min = ((min.to_f / minutes).ceil * minutes) % 60
    if rounded_min == 0 && min > 0
      hour += 1
    end
  when '退社'
    # 退社：切り下げ
    rounded_min = (min / minutes) * minutes
  else
    rounded_min = (min / minutes) * minutes
  end
  
  if rounded_min >= 60
    hour += 1
    rounded_min = 0
  end
  
  if minutes == 1
    rounded_min = min
  end
  
  Time.new(time.year, time.month, time.day, hour, rounded_min, 0)
end

# 処理対象の勤怠データ
attendances = Attendance.all
puts "対象レコード数: #{attendances.count}"

success_count = 0
error_count = 0

attendances.find_each do |attendance|
  begin
    # 出社時間の丸め処理
    if attendance.clock_in_time.present?
      [15, 10, 5, 1].each do |minutes|
        rounded_time = round_punch_time(attendance.clock_in_time, '出社', minutes)
        attendance.update_column("clock_in_rounded_#{minutes}min", rounded_time)
      end
    end
    
    # 昼休出1時間の丸め処理
    if attendance.lunch_out1_time.present?
      [15, 10, 5, 1].each do |minutes|
        rounded_time = round_punch_time(attendance.lunch_out1_time, '昼休出１', minutes)
        attendance.update_column("lunch_out1_#{minutes}min", rounded_time)
      end
    end
    
    # 昼休入1時間の丸め処理
    if attendance.lunch_in1_time.present?
      [15, 10, 5, 1].each do |minutes|
        rounded_time = round_punch_time(attendance.lunch_in1_time, '昼休入１', minutes)
        attendance.update_column("lunch_in1_#{minutes}min", rounded_time)
      end
    end
    
    # 昼休出2時間の丸め処理
    if attendance.lunch_out2_time.present?
      [15, 10, 5, 1].each do |minutes|
        rounded_time = round_punch_time(attendance.lunch_out2_time, '昼休出２', minutes)
        attendance.update_column("lunch_out2_#{minutes}min", rounded_time)
      end
    end
    
    # 昼休入2時間の丸め処理
    if attendance.lunch_in2_time.present?
      [15, 10, 5, 1].each do |minutes|
        rounded_time = round_punch_time(attendance.lunch_in2_time, '昼休入２', minutes)
        attendance.update_column("lunch_in2_#{minutes}min", rounded_time)
      end
    end
    
    # 退社時間の丸め処理
    if attendance.clock_out_time.present?
      [15, 10, 5, 1].each do |minutes|
        rounded_time = round_punch_time(attendance.clock_out_time, '退社', minutes)
        attendance.update_column("clock_out_rounded_#{minutes}min", rounded_time)
      end
    end
    
    success_count += 1
    puts "処理完了: #{attendance.employee_id} - #{attendance.work_date}"
    
  rescue => e
    puts "エラー: #{attendance.employee_id} - #{attendance.work_date} - #{e.message}"
    error_count += 1
  end
end

puts "\n=== 丸め時間計算完了 ==="
puts "成功: #{success_count}件"
puts "エラー: #{error_count}件"

# 結果確認
puts "\n=== 結果確認 ==="
sample = Attendance.first
if sample
  puts "サンプルデータ:"
  puts "従業員ID: #{sample.employee_id}"
  puts "勤怠日: #{sample.work_date}"
  puts "出社: #{sample.clock_in_time&.strftime('%H:%M')} -> 15分刻み: #{sample.clock_in_rounded_15min&.strftime('%H:%M')}"
  puts "昼休出1: #{sample.lunch_out1_time&.strftime('%H:%M')} -> 15分刻み: #{sample.lunch_out1_15min&.strftime('%H:%M')}"
  puts "昼休入1: #{sample.lunch_in1_time&.strftime('%H:%M')} -> 15分刻み: #{sample.lunch_in1_15min&.strftime('%H:%M')}"
  puts "退社: #{sample.clock_out_time&.strftime('%H:%M')} -> 15分刻み: #{sample.clock_out_rounded_15min&.strftime('%H:%M')}"
end
