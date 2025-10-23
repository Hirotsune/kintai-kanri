# 縦型データを横型に変換するスクリプト

puts "=== 縦型データを横型に変換開始 ==="

# 既存の打刻データを削除
puts "既存の打刻データを削除中..."
Attendance.destroy_all
puts "削除完了: #{Attendance.count}件"

# 勤怠ファイルから横型データを作成
file_path = "C:/Users/user/Desktop/KintYm.txt"

# 勤務区分マッピング
kinmu_kbn_mapping = {
  '1' => '出勤',
  '2' => '公休',
  '3' => '有給',
  '4' => '欠勤',
  '5' => '振休',
  '6' => '代休',
  '7' => '慶弔',
  '8' => '休出'
}

# 時刻パース用のメソッド
def parse_punch_time(date_str, time_str)
  return nil if time_str.blank? || time_str == '0'
  
  date_part = date_str.split(' ')[0]
  datetime_str = "#{date_part} #{time_str}"
  
  if time_str.include?(':')
    hour, minute = time_str.split(':').map(&:to_i)
    if hour >= 24
      date = Date.parse(date_part) + 1.day
      hour -= 24
      datetime_str = "#{date} #{hour}:#{minute.to_s.rjust(2, '0')}"
    end
  end
  
  DateTime.parse(datetime_str)
rescue => e
  puts "時刻パースエラー: #{datetime_str} - #{e.message}"
  nil
end

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

# 処理用のハッシュ
daily_attendance = {}
success_count = 0
error_count = 0
skipped_employees = Set.new

# ファイルを読み込み
data_lines = File.readlines(file_path, encoding: 'UTF-8')[2..-1]

data_lines.each_with_index do |line, index|
  fields = line.strip.split("\t")
  
  if fields.length < 44
    puts "警告: 行 #{index + 3} - フィールド数が不足しています。スキップします。"
    error_count += 1
    next
  end
  
  # 必要なフィールドを抽出
  employee_id = fields[1].strip
  employee_name = fields[2].strip
  kintai_date = fields[3].strip
  time1 = fields[4].strip  # 出社
  time2 = fields[6].strip  # 昼休出1
  time3 = fields[8].strip  # 昼休入1
  time4 = fields[10].strip # 退社
  kinmu_kbn = fields[40].strip
  
  # 従業員が存在するかチェック
  employee = Employee.find_by(employee_id: employee_id)
  unless employee
    skipped_employees.add("#{employee_id}: #{employee_name}")
    next
  end
  
  # 勤怠日をパース
  work_date = Date.parse(kintai_date.split(' ')[0])
  kintai_month_str = work_date.strftime('%Y-%m')
  
  # 日付キー
  date_key = "#{employee_id}_#{work_date}"
  
  # 既存のレコードがあるかチェック
  if daily_attendance[date_key]
    attendance = daily_attendance[date_key]
  else
    # 新しいレコードを作成
    attendance = {
      employee_id: employee_id,
      work_date: work_date,
      factory_id: employee.factory_id,
      line_id: employee.line_id,
      shift_type: 'morning',
      kintai_month: kintai_month_str,
      note: "インポート: #{employee_name}",
      clock_in_time: nil,
      lunch_out1_time: nil,
      lunch_in1_time: nil,
      lunch_out2_time: nil,
      lunch_in2_time: nil,
      clock_out_time: nil
    }
    daily_attendance[date_key] = attendance
  end
  
  # 打刻時間を設定
  case kinmu_kbn
  when '1' # 出勤
    if time1.present? && time1 != '0'
      punch_time = parse_punch_time(kintai_date, time1)
      attendance[:clock_in_time] = punch_time&.to_time
      
      # 丸め処理
      [15, 10, 5, 1].each do |minutes|
        rounded_time = round_punch_time(punch_time, '出社', minutes)
        attendance["clock_in_rounded_#{minutes}min".to_sym] = rounded_time
      end
    end
    
    if time2.present? && time2 != '0'
      punch_time = parse_punch_time(kintai_date, time2)
      attendance[:lunch_out1_time] = punch_time&.to_time
      
      # 丸め処理
      [15, 10, 5, 1].each do |minutes|
        rounded_time = round_punch_time(punch_time, '昼休出１', minutes)
        attendance["lunch_out1_#{minutes}min".to_sym] = rounded_time
      end
    end
    
    if time3.present? && time3 != '0'
      punch_time = parse_punch_time(kintai_date, time3)
      attendance[:lunch_in1_time] = punch_time&.to_time
      
      # 丸め処理
      [15, 10, 5, 1].each do |minutes|
        rounded_time = round_punch_time(punch_time, '昼休入１', minutes)
        attendance["lunch_in1_#{minutes}min".to_sym] = rounded_time
      end
    end
    
    if time4.present? && time4 != '0'
      punch_time = parse_punch_time(kintai_date, time4)
      attendance[:clock_out_time] = punch_time&.to_time
      
      # 丸め処理
      [15, 10, 5, 1].each do |minutes|
        rounded_time = round_punch_time(punch_time, '退社', minutes)
        attendance["clock_out_rounded_#{minutes}min".to_sym] = rounded_time
      end
    end
  end
end

# データベースに保存
puts "\nデータベースに保存中..."
daily_attendance.each do |date_key, attrs|
  begin
    Attendance.create!(attrs)
    success_count += 1
    puts "作成: #{attrs[:employee_id]} - #{attrs[:work_date]}"
  rescue => e
    puts "エラー: #{date_key} - #{e.message}"
    error_count += 1
  end
end

puts "\n=== 横型データ変換完了 ==="
puts "成功: #{success_count}件"
puts "エラー: #{error_count}件"
puts "スキップされた従業員数: #{skipped_employees.size}名"
puts "登録された勤怠レコード数: #{Attendance.count}件"

# 結果確認
puts "\n=== 結果確認 ==="
sample = Attendance.first
if sample
  puts "サンプルデータ:"
  puts "従業員ID: #{sample.employee_id}"
  puts "勤怠日: #{sample.work_date}"
  puts "出社: #{sample.clock_in_time&.strftime('%H:%M') || 'なし'}"
  puts "昼休出1: #{sample.lunch_out1_time&.strftime('%H:%M') || 'なし'}"
  puts "昼休入1: #{sample.lunch_in1_time&.strftime('%H:%M') || 'なし'}"
  puts "退社: #{sample.clock_out_time&.strftime('%H:%M') || 'なし'}"
end
