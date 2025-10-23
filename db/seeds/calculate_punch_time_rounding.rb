# 打刻時間の丸め処理を計算するスクリプト

puts "=== 打刻時間の丸め処理計算開始 ==="

# 丸め処理のルールに基づくメソッド
def round_punch_time(punch_time, punch_type, minutes)
  return nil if punch_time.nil?
  
  time = punch_time.to_time
  hour = time.hour
  min = time.min
  sec = time.sec
  
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
      # 13:00から1時間以内（13:00-13:59）は14:00扱い
      hour = 14
      rounded_min = 0
    else
      # 1時間超過時は切り上げ
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
    # その他：切り下げ
    rounded_min = (min / minutes) * minutes
  end
  
  # 時間の調整
  if rounded_min >= 60
    hour += 1
    rounded_min = 0
  end
  
  # 1分刻みの場合は秒を切り捨て
  if minutes == 1
    rounded_min = min
  end
  
  Time.new(time.year, time.month, time.day, hour, rounded_min, 0)
end

# 処理対象の打刻タイプ
punch_types = ['出社', '昼休出１', '昼休入１', '昼休出２', '昼休入２', '退社']

# 丸め単位
rounding_modes = [15, 10, 5]

# 各打刻タイプごとに処理
punch_types.each do |punch_type|
  puts "\n=== #{punch_type}の丸め処理 ==="
  
  # 該当する打刻データを取得
  attendances = Attendance.where(punch_type: punch_type)
  puts "対象レコード数: #{attendances.count}"
  
  attendances.find_each do |attendance|
    next if attendance.punch_time.nil?
    
    # 各丸め単位で計算
    rounding_modes.each do |minutes|
      rounded_time = round_punch_time(attendance.punch_time, punch_type, minutes)
      
      # 対応する列に保存
      case punch_type
      when '出社'
        attendance.update_column("clock_in_rounded_#{minutes}min", rounded_time)
      when '昼休出１'
        attendance.update_column("lunch_out1_#{minutes}min", rounded_time)
      when '昼休入１'
        attendance.update_column("lunch_in1_#{minutes}min", rounded_time)
      when '昼休出２'
        attendance.update_column("lunch_out2_#{minutes}min", rounded_time)
      when '昼休入２'
        attendance.update_column("lunch_in2_#{minutes}min", rounded_time)
      when '退社'
        attendance.update_column("clock_out_rounded_#{minutes}min", rounded_time)
      end
    end
    
    # 1分刻みは元の時間（秒を切り捨て）
    if punch_type == '出社'
      attendance.update_column(:clock_in_rounded_1min, attendance.punch_time.to_time.change(sec: 0))
    elsif punch_type == '退社'
      attendance.update_column(:clock_out_rounded_1min, attendance.punch_time.to_time.change(sec: 0))
    end
    
    puts "処理完了: #{attendance.employee_id} - #{punch_type} #{attendance.punch_time.strftime('%H:%M')}"
  end
end

puts "\n=== 打刻時間の丸め処理計算完了 ==="

# 結果確認
puts "\n=== 結果確認 ==="
punch_types.each do |punch_type|
  count = Attendance.where(punch_type: punch_type).count
  puts "#{punch_type}: #{count}件"
end

# サンプルデータの確認
puts "\n=== サンプルデータ確認 ==="
sample = Attendance.where(punch_type: '出社').first
if sample
  puts "出社時間: #{sample.punch_time.strftime('%H:%M:%S')}"
  puts "15分刻み: #{sample.clock_in_rounded_15min&.strftime('%H:%M')}"
  puts "10分刻み: #{sample.clock_in_rounded_10min&.strftime('%H:%M')}"
  puts "5分刻み: #{sample.clock_in_rounded_5min&.strftime('%H:%M')}"
  puts "1分刻み: #{sample.clock_in_rounded_1min&.strftime('%H:%M')}"
end
