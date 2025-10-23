# CSVファイルから勤怠データをインポートするスクリプト
# 使用方法: rails runner db/seeds/import_attendance_from_csv.rb

def parse_punch_time(time_str)
  return nil if time_str.nil? || time_str.strip.empty?
  
  # 時刻文字列を解析
  time_str = time_str.strip
  
  # "2025/6/2 13:00"形式の場合（日付付き時刻）
  if time_str.match?(/^\d{4}\/\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}$/)
    begin
      # 日付部分を削除して時刻部分のみを抽出
      time_part = time_str.split(' ')[1]  # "13:00"部分を取得
      return Time.zone.parse(time_part)
    rescue => e
      puts "日付付き時刻解析エラー: #{time_str} - #{e.message}"
      return nil
    end
  end
  
  # "0830"形式の場合
  if time_str.match?(/^\d{4}$/)
    hour = time_str[0..1].to_i
    minute = time_str[2..3].to_i
    return Time.zone.parse("#{hour}:#{minute}")
  end
  
  # "8:30"や"08:30"形式の場合
  if time_str.match?(/^\d{1,2}:\d{2}$/)
    return Time.zone.parse(time_str)
  end
  
  puts "未対応の時刻形式: #{time_str}"
  nil
rescue => e
  puts "時刻解析エラー: #{time_str} - #{e.message}"
  nil
end

def round_time_up(time, minutes)
  return nil if time.nil?
  
  # 指定した分単位で切り上げ
  total_minutes = time.hour * 60 + time.min
  rounded_minutes = ((total_minutes + minutes - 1) / minutes) * minutes
  
  hour = rounded_minutes / 60
  minute = rounded_minutes % 60
  
  Time.zone.parse("#{hour}:#{minute}")
end

def round_time_down(time, minutes)
  return nil if time.nil?
  
  # 指定した分単位で切り下げ
  total_minutes = time.hour * 60 + time.min
  rounded_minutes = (total_minutes / minutes) * minutes
  
  hour = rounded_minutes / 60
  minute = rounded_minutes % 60
  
  Time.zone.parse("#{hour}:#{minute}")
end

def calculate_rounded_times(attendance)
  # 各時間刻みで丸め処理を実行
  [15, 10, 5, 1].each do |minutes|
    # 出社時間（切り上げ）
    if attendance.clock_in_time
      attendance.send("clock_in_rounded_#{minutes}min=", round_time_up(attendance.clock_in_time, minutes))
    end
    
    # 退社時間（切り下げ）
    if attendance.clock_out_time
      attendance.send("clock_out_rounded_#{minutes}min=", round_time_down(attendance.clock_out_time, minutes))
    end
    
    # 昼休憩1の計算（休憩時間を考慮）
    if attendance.lunch_out1_time && attendance.lunch_in1_time
      # 昼休出1（切り下げ）
      lunch_out_rounded = round_time_down(attendance.lunch_out1_time, minutes)
      attendance.send("lunch_out1_#{minutes}min=", lunch_out_rounded)
      
      # 昼休入1（切り上げ）
      lunch_in_rounded = round_time_up(attendance.lunch_in1_time, minutes)
      
      # 休憩時間が1時間以内の場合の調整
      break_duration_minutes = (attendance.lunch_in1_time - attendance.lunch_out1_time) / 60
      if break_duration_minutes <= 60
        # lunch_in_roundedを調整して1時間以内に収める
        lunch_in_rounded = lunch_out_rounded + 1.hour
      end
      
      attendance.send("lunch_in1_#{minutes}min=", lunch_in_rounded)
    end
    
    # 昼休憩2の計算（もしデータがあれば）
    if attendance.lunch_out2_time && attendance.lunch_in2_time
      # 昼休出2（切り下げ）
      lunch_out2_rounded = round_time_down(attendance.lunch_out2_time, minutes)
      attendance.send("lunch_out2_#{minutes}min=", lunch_out2_rounded)
      
      # 昼休入2（切り上げ）
      lunch_in2_rounded = round_time_up(attendance.lunch_in2_time, minutes)
      
      # 休憩時間が1時間以内の場合の調整
      break_duration_minutes = (attendance.lunch_in2_time - attendance.lunch_out2_time) / 60
      if break_duration_minutes <= 60
        # lunch_in2_roundedを調整して1時間以内に収める
        lunch_in2_rounded = lunch_out2_rounded + 1.hour
      end
      
      attendance.send("lunch_in2_#{minutes}min=", lunch_in2_rounded)
    end
    
    # 各刻み時間ごとのトータル労働時間を計算
    calculate_total_work_time(attendance, minutes)
  end
end

def calculate_total_work_time(attendance, minutes)
  # 出社時間と退社時間の丸め値
  clock_in_rounded = attendance.send("clock_in_rounded_#{minutes}min")
  clock_out_rounded = attendance.send("clock_out_rounded_#{minutes}min")
  
  # デバッグ情報（最初の1行のみ）
  if attendance.employee_id == "6" && attendance.work_date == Date.parse("2025-06-02")
    puts "  DEBUG: #{minutes}分刻みの計算開始"
    puts "    出社時間: #{clock_in_rounded}"
    puts "    退社時間: #{clock_out_rounded}"
  end
  
  return unless clock_in_rounded && clock_out_rounded
  
  # 総労働時間（分単位）
  total_minutes = (clock_out_rounded - clock_in_rounded) / 60
  if attendance.employee_id == "6" && attendance.work_date == Date.parse("2025-06-02")
    puts "    総労働時間: #{total_minutes}分"
  end
  
  # 休憩時間の計算
  break_minutes = 0
  
  # 昼休憩1の時間
  lunch_out1_rounded = attendance.send("lunch_out1_#{minutes}min")
  lunch_in1_rounded = attendance.send("lunch_in1_#{minutes}min")
  if lunch_out1_rounded && lunch_in1_rounded
    break_minutes += (lunch_in1_rounded - lunch_out1_rounded) / 60
    if attendance.employee_id == "6" && attendance.work_date == Date.parse("2025-06-02")
      puts "    昼休憩1: #{lunch_out1_rounded} - #{lunch_in1_rounded} = #{(lunch_in1_rounded - lunch_out1_rounded) / 60}分"
    end
  end
  
  # 昼休憩2の時間
  lunch_out2_rounded = attendance.send("lunch_out2_#{minutes}min")
  lunch_in2_rounded = attendance.send("lunch_in2_#{minutes}min")
  if lunch_out2_rounded && lunch_in2_rounded
    break_minutes += (lunch_in2_rounded - lunch_out2_rounded) / 60
    if attendance.employee_id == "6" && attendance.work_date == Date.parse("2025-06-02")
      puts "    昼休憩2: #{lunch_out2_rounded} - #{lunch_in2_rounded} = #{(lunch_in2_rounded - lunch_out2_rounded) / 60}分"
    end
  end
  
  if attendance.employee_id == "6" && attendance.work_date == Date.parse("2025-06-02")
    puts "    合計休憩時間: #{break_minutes}分"
  end
  
  # 実労働時間（休憩を除く）- 分単位の整数
  actual_work_minutes = total_minutes - break_minutes
  
  # マイナス値の場合は0に設定
  actual_work_minutes = 0 if actual_work_minutes < 0
  
  if attendance.employee_id == "6" && attendance.work_date == Date.parse("2025-06-02")
    puts "    実労働時間: #{actual_work_minutes}分"
  end
  
  # 分単位の整数として設定
  attendance.send("total_work_time_#{minutes}min=", actual_work_minutes.to_i)
  if attendance.employee_id == "6" && attendance.work_date == Date.parse("2025-06-02")
    puts "    設定値: #{actual_work_minutes.to_i}分"
  end
end

# CSVファイルのパス
csv_file_path = "C:/Users/user/Desktop/Kintai_kako/kintai_202506_202508.csv"

puts "CSVファイルから勤怠データをインポート開始..."
puts "ファイルパス: #{csv_file_path}"

# 既存の勤怠データを削除
puts "既存の勤怠データを削除中..."
Attendance.delete_all
puts "削除完了"

# スキップされた従業員を記録
skipped_employees = Set.new
imported_count = 0
error_count = 0

begin
  # より安全なCSV読み込み方法（2行目から開始）
  File.open(csv_file_path, 'r:BOM|Windows-31J:UTF-8') do |file|
    # 1行目（ヘッダー）を読み込む
    header_line = file.readline
    puts "ヘッダー行: #{header_line.strip}"
    
    # 2行目（説明行）をスキップ
    description_line = file.readline
    puts "説明行（スキップ）: #{description_line.strip}"
    
    # 3行目からデータを読み込み
    CSV.new(file, headers: false, liberal_parsing: true, quote_char: '"', skip_blanks: true).each do |row|
    begin
      # 列インデックスを使用（ヘッダーがないため）
      employee_id = row[1]&.strip  # TanCode列
      employee_name = row[2]&.strip  # TanName列
      work_date_str = row[3]&.strip  # KintDate列
      
      # 必須フィールドのチェック
      if employee_id.nil? || work_date_str.nil?
        puts "警告: 必須フィールドが不足 - 行をスキップ"
        puts "  社員コード: #{employee_id.inspect}"
        puts "  日付: #{work_date_str.inspect}"
        puts "  行データ: #{row.to_h.keys.join(', ')}"
        next
      end
      
      # 従業員の存在確認
      employee = Employee.find_by(employee_id: employee_id)
      unless employee
        skipped_employees.add(employee_id)
        puts "警告: 従業員ID #{employee_id} が見つかりません。スキップ: #{row['氏名']}"
        next
      end
      
      # 日付の解析
      work_date = Date.parse(work_date_str)
      
      # 打刻時間の解析（指定されたマッピング）
      clock_in_time = parse_punch_time(row[27])     # Dakoku1 - 出社
      lunch_out1_time = parse_punch_time(row[28])   # Dakoku2 - 昼休出1
      lunch_in1_time = parse_punch_time(row[29])    # Dakoku3 - 昼休入1
      lunch_out2_time = nil                         # 使用しない
      lunch_in2_time = nil                          # 使用しない
      clock_out_time = parse_punch_time(row[30])    # Dakoku4 - 退社
      
      # 15分丸め時間（指定されたマッピング）
      clock_in_rounded_15min = parse_punch_time(row[36])  # CTM1 - 出社（15分丸め）
      lunch_out1_15min = parse_punch_time(row[37])       # CTM2 - 昼休出1（15分丸め）
      lunch_in1_15min = parse_punch_time(row[38])        # CTM3 - 昼休入1（15分丸め）
      clock_out_rounded_15min = parse_punch_time(row[39]) # CTM4 - 退社（15分丸め）
      
      # デバッグ用：最初の数行のデータを確認
      if imported_count < 3
        puts "デバッグ - 行#{imported_count + 1}:"
        puts "  基本情報:"
        puts "    社員コード: #{employee_id}"
        puts "    社員名: #{employee_name}"
        puts "    勤怠日付: #{work_date}"
        puts "  基本打刻時間（指定されたマッピング）:"
        puts "    Dakoku1(出社): #{row[27]} -> #{clock_in_time}"
        puts "    Dakoku2(昼休出1): #{row[28]} -> #{lunch_out1_time}"
        puts "    Dakoku3(昼休入1): #{row[29]} -> #{lunch_in1_time}"
        puts "    Dakoku4(退社): #{row[30]} -> #{clock_out_time}"
        puts "  15分丸め時間（指定されたマッピング）:"
        puts "    CTM1(出社15分丸め): #{row[36]} -> #{clock_in_rounded_15min}"
        puts "    CTM2(昼休出1 15分丸め): #{row[37]} -> #{lunch_out1_15min}"
        puts "    CTM3(昼休入1 15分丸め): #{row[38]} -> #{lunch_in1_15min}"
        puts "    CTM4(退社15分丸め): #{row[39]} -> #{clock_out_rounded_15min}"
      end
      
      # 勤怠レコードを作成
      attendance = Attendance.new(
        employee_id: employee_id,
        employee_name: employee_name,  # 社員名を追加
        work_date: work_date,
        factory_id: employee.factory_id || 'DEFAULT',  # 必須フィールド
        line_id: employee.line_id || 'DEFAULT',        # 必須フィールド
        shift_type: 'morning',  # デフォルトでmorningを設定
        clock_in_time: clock_in_time,
        lunch_out1_time: lunch_out1_time,
        lunch_in1_time: lunch_in1_time,
        lunch_out2_time: lunch_out2_time,
        lunch_in2_time: lunch_in2_time,
        clock_out_time: clock_out_time,
        # 15分丸め時間（CSVから直接取得）
        clock_in_rounded_15min: clock_in_rounded_15min,
        lunch_out1_15min: lunch_out1_15min,
        lunch_in1_15min: lunch_in1_15min,
        clock_out_rounded_15min: clock_out_rounded_15min
      )
      
      # 10分、5分、1分の丸め時間を計算
      calculate_rounded_times(attendance)
      
      # デバッグ用：計算後の退社時間の確認
      if imported_count < 3
        puts "  計算後の退社時間:"
        puts "    15分丸め: #{attendance.clock_out_rounded_15min}"
        puts "    10分丸め: #{attendance.clock_out_rounded_10min}"
        puts "    5分丸め: #{attendance.clock_out_rounded_5min}"
        puts "    1分丸め: #{attendance.clock_out_rounded_1min}"
        puts "  計算後の出社時間:"
        puts "    15分丸め: #{attendance.clock_in_rounded_15min}"
        puts "    10分丸め: #{attendance.clock_in_rounded_10min}"
        puts "    5分丸め: #{attendance.clock_in_rounded_5min}"
        puts "    1分丸め: #{attendance.clock_in_rounded_1min}"
        puts "  計算後の昼休出1時間:"
        puts "    15分丸め: #{attendance.lunch_out1_15min}"
        puts "    10分丸め: #{attendance.lunch_out1_10min}"
        puts "    5分丸め: #{attendance.lunch_out1_5min}"
        puts "    1分丸め: #{attendance.lunch_out1_1min}"
        puts "  計算後のトータル労働時間（休憩除く）:"
        puts "    15分丸め: #{attendance.total_work_time_15min}分"
        puts "    10分丸め: #{attendance.total_work_time_10min}分"
        puts "    5分丸め: #{attendance.total_work_time_5min}分"
        puts "    1分丸め: #{attendance.total_work_time_1min}分"
      end
      
      # 保存
      if attendance.save
        imported_count += 1
        puts "インポート成功: #{employee_id}_#{work_date} - #{employee.name}" if imported_count % 100 == 0
      else
        puts "エラー: #{employee_id}_#{work_date} - バリデーションに失敗しました: #{attendance.errors.full_messages.join(', ')}"
        error_count += 1
      end
      
    rescue => e
      puts "エラー: 行処理中にエラーが発生しました - #{e.message}"
      error_count += 1
    end
    end
  end
  
rescue => e
  puts "CSVファイル読み込みエラー: #{e.message}"
  exit 1
end

puts "\n=== インポート完了 ==="
puts "インポート成功: #{imported_count}件"
puts "エラー: #{error_count}件"
puts "スキップされた従業員: #{skipped_employees.size}名"
if skipped_employees.any?
  puts "スキップされた従業員ID: #{skipped_employees.to_a.join(', ')}"
end

puts "\nみなし時間の計算が完了しました。"
puts "各打刻タイプの15分、10分、5分、1分刻みの丸め時間が設定されています。"
puts "各刻み時間ごとの休憩を除いたトータル労働時間も分単位の整数で計算されています。"
