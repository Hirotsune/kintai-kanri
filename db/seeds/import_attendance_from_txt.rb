# 勤怠ファイルから勤怠データをインポートするスクリプト

# 時刻パース用のメソッドを先に定義
def parse_punch_time(date_str, time_str)
  # 日付と時刻を結合してパース
  date_part = date_str.split(' ')[0]  # "2025/6/2 0:00" -> "2025/6/2"
  datetime_str = "#{date_part} #{time_str}"
  
  # 時刻が24時間を超える場合の処理
  if time_str.include?(':')
    hour, minute = time_str.split(':').map(&:to_i)
    if hour >= 24
      # 翌日扱い
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

puts "=== 勤怠ファイルから勤怠データのインポート開始 ==="

# 既存のattendancesデータをクリア
Attendance.destroy_all
puts "既存の勤怠データをクリアしました"

# 従業員データが存在することを確認
if Employee.count == 0
  puts "エラー: 従業員データが見つかりません。先にemployees_seed.rbを実行してください。"
  exit
end

# 勤怠ファイルのパス
txt_file_path = "C:/Users/user/Desktop/KintYm.txt"

# ファイルが存在するかチェック
unless File.exist?(txt_file_path)
  puts "エラー: ファイルが見つかりません: #{txt_file_path}"
  exit
end

# ファイルを読み込み
puts "ファイルを読み込み中: #{txt_file_path}"
lines = File.readlines(txt_file_path, encoding: 'UTF-8')

# ヘッダー行をスキップ（1-2行目）
data_lines = lines[2..-1]

puts "データ行数: #{data_lines.length}"

# 勤務区分のマッピング
work_status_mapping = {
  '1' => 'shift',        # 出勤
  '2' => 'holiday'       # 公休
}

# 勤務名のマッピング
work_name_mapping = {
  '1' => '出勤',
  '2' => '公休'
}

# シフト名のマッピング
shift_name_mapping = {
  '0' => 'なし',
  '1' => '出勤'
}

# 勤怠データの登録
success_count = 0
error_count = 0
skipped_employees = Set.new
processed_employees = Set.new

data_lines.each_with_index do |line, index|
  # タブで分割
  fields = line.strip.split("\t")
  
  # フィールド数チェック
  if fields.length < 40
    puts "警告: 行 #{index + 3} のフィールド数が不足しています: #{fields.length}"
    error_count += 1
    next
  end
  
  begin
    # データを抽出
    kintai_month = fields[0].strip  # 勤怠月
    employee_id = fields[1].strip   # 社員コード
    employee_name = fields[2].strip # 社員名
    kintai_date = fields[3].strip   # 勤怠日
    time1 = fields[4].strip         # 出社時間
    time2 = fields[6].strip         # 昼休出1
    time3 = fields[8].strip         # 昼休入1
    time4 = fields[10].strip        # 退社時間
    line_kbn = fields[32].strip     # ラインコード
    line_name = fields[33].strip    # ライン名
    kinmu_kbn = fields[40].strip    # 勤務区分
    kinmu_name = fields[41].strip   # 勤務名
    kinmu_kbn_shift = fields[42].strip # シフト区分
    kinmu_shift_name = fields[43].strip # シフト名
    
    # 従業員が存在するかチェック
    employee = Employee.find_by(employee_id: employee_id)
    unless employee
      # 退職者など、従業員データに存在しない場合はスキップ（エラーカウントしない）
      skipped_employees.add("#{employee_id}: #{employee_name}")
      next
    end
    
    # 勤怠日をパース
    work_date = Date.parse(kintai_date.split(' ')[0])
    
    # 勤怠月を設定
    kintai_month_str = work_date.strftime('%Y-%m')
    
    # 工場・ライン情報を取得
    factory_id = employee.factory_id
    line_id = employee.line_id
    
    # 勤務区分をマッピング
    schedule_type = work_status_mapping[kinmu_kbn] || 'shift'
    
    # 打刻データを処理
    punch_data = []
    
    # 出社打刻
    if time1.present? && time1 != '0'
      punch_time = parse_punch_time(kintai_date, time1)
      punch_data << {
        punch_type: '出社',
        punch_time: punch_time,
        work_date: work_date,
        employee_id: employee_id,
        factory_id: factory_id,
        line_id: line_id,
        shift_type: 'morning',
        kintai_month: kintai_month_str,
        note: "インポート: #{employee_name}"
      }
      puts "DEBUG: 出社時間 #{time1} -> #{punch_time}"
    end
    
    # 昼休出1打刻
    if time2.present? && time2 != '0'
      punch_time = parse_punch_time(kintai_date, time2)
      punch_data << {
        punch_type: '昼休出１',
        punch_time: punch_time,
        work_date: work_date,
        employee_id: employee_id,
        factory_id: factory_id,
        line_id: line_id,
        shift_type: 'morning',
        kintai_month: kintai_month_str,
        note: "インポート: #{employee_name}"
      }
      puts "DEBUG: 昼休出1時間 #{time2} -> #{punch_time}"
    end
    
    # 昼休入1打刻
    if time3.present? && time3 != '0'
      punch_time = parse_punch_time(kintai_date, time3)
      punch_data << {
        punch_type: '昼休入１',
        punch_time: punch_time,
        work_date: work_date,
        employee_id: employee_id,
        factory_id: factory_id,
        line_id: line_id,
        shift_type: 'morning',
        kintai_month: kintai_month_str,
        note: "インポート: #{employee_name}"
      }
      puts "DEBUG: 昼休入1時間 #{time3} -> #{punch_time}"
    end
    
    # 退社打刻
    if time4.present? && time4 != '0'
      punch_time = parse_punch_time(kintai_date, time4)
      punch_data << {
        punch_type: '退社',
        punch_time: punch_time,
        work_date: work_date,
        employee_id: employee_id,
        factory_id: factory_id,
        line_id: line_id,
        shift_type: 'morning',
        kintai_month: kintai_month_str,
        note: "インポート: #{employee_name}"
      }
    end
    
    # 勤怠データを作成
    punch_data.each do |punch_attrs|
      attendance = Attendance.create!(punch_attrs)
      puts "作成: #{employee_name} - #{attendance.punch_type} #{attendance.punch_time.strftime('%H:%M')}"
    end
    
    success_count += 1
    processed_employees.add(employee_id)
    
  rescue => e
    puts "エラー: 行 #{index + 3} - #{e.message}"
    error_count += 1
  end
end

puts "\n=== インポート完了 ==="
puts "成功: #{success_count}行"
puts "エラー: #{error_count}行"
puts "処理された従業員数: #{processed_employees.size}名"
puts "スキップされた従業員数: #{skipped_employees.size}名"

# スキップされた従業員の一覧（最初の10名のみ表示）
if skipped_employees.any?
  puts "\nスキップされた従業員（最初の10名）:"
  skipped_employees.first(10).each do |employee_info|
    puts "  #{employee_info}"
  end
  if skipped_employees.size > 10
    puts "  ... 他 #{skipped_employees.size - 10}名"
  end
end

# 勤怠データの確認
puts "\n=== 登録された勤怠データの確認 ==="
puts "総勤怠レコード数: #{Attendance.count}"

# 月別の勤怠データ数
monthly_counts = Attendance.group(:kintai_month).count
puts "\n月別勤怠データ数:"
monthly_counts.each do |month, count|
  puts "  #{month}: #{count}件"
end

# 従業員別の勤怠データ数（上位10名）
employee_counts = Attendance.group(:employee_id).count.sort_by { |k, v| -v }.first(10)
puts "\n従業員別勤怠データ数（上位10名）:"
employee_counts.each do |employee_id, count|
  employee = Employee.find_by(employee_id: employee_id)
  employee_name = employee ? employee.name : "不明"
  puts "  #{employee_id}: #{employee_name} - #{count}件"
end

# 打刻タイプ別の件数
punch_type_counts = Attendance.group(:punch_type).count
puts "\n打刻タイプ別件数:"
punch_type_counts.each do |punch_type, count|
  puts "  #{punch_type}: #{count}件"
end
