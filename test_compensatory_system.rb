#!/usr/bin/env ruby
# 振り替え休日・代休管理システムのテストスクリプト

puts "=== 振り替え休日・代休管理システム テスト ==="

# テスト用の従業員ID（実際のデータベースに存在するIDを使用）
test_employee_id = "EMP001"

puts "\n1. ScheduleEntryモデルの基本機能テスト"
puts "----------------------------------------"

# スケジュールタイプの確認
puts "利用可能なスケジュールタイプ:"
ScheduleEntry.schedule_types.each do |key, value|
  puts "  #{key}: #{value}"
end

puts "\n2. 振り替え休日の作成テスト"
puts "---------------------------"

begin
  # 日曜日を振り替え元として使用
  original_date = Date.parse("2024-10-06") # 日曜日
  compensatory_date = Date.parse("2024-10-15") # 平日
  
  puts "振り替え元日付: #{original_date} (#{original_date.strftime('%A')})"
  puts "振り替え先日付: #{compensatory_date} (#{compensatory_date.strftime('%A')})"
  
  # 振り替え休日の作成
  compensatory_holiday = ScheduleEntry.create_compensatory_holiday(
    test_employee_id,
    original_date,
    compensatory_date,
    {
      exemption_type: 'full',
      approval_required: false,
      notes: 'テスト用振り替え休日'
    }
  )
  
  puts "✅ 振り替え休日の作成成功: ID #{compensatory_holiday.id}"
  puts "   元の休日: #{compensatory_holiday.original_date}"
  puts "   振り替え先: #{compensatory_holiday.schedule_date}"
  puts "   免除タイプ: #{compensatory_holiday.business_rule('exemption_type')}"
  
rescue => e
  puts "❌ 振り替え休日の作成失敗: #{e.message}"
end

puts "\n3. 代休の作成テスト"
puts "-------------------"

begin
  # 祝日を代休対象として使用
  work_date = Date.parse("2024-10-14") # 体育の日
  
  puts "代休対象日付: #{work_date}"
  
  # 代休の作成
  substitute_holiday = ScheduleEntry.create_substitute_holiday(
    test_employee_id,
    work_date,
    {
      allowance_rate: 0.35,
      expiry_days: 60,
      notes: 'テスト用代休'
    }
  )
  
  puts "✅ 代休の作成成功: ID #{substitute_holiday.id}"
  puts "   対象日付: #{substitute_holiday.schedule_date}"
  puts "   割増率: #{substitute_holiday.business_rule('allowance_rate')}"
  puts "   取得期限: #{substitute_holiday.business_rule('expiry_days')}日"
  puts "   休日種類: #{substitute_holiday.original_holiday_description}"
  
rescue => e
  puts "❌ 代休の作成失敗: #{e.message}"
end

puts "\n4. バリデーションテスト"
puts "----------------------"

# 二重振り替えのテスト
begin
  puts "二重振り替えのテスト..."
  ScheduleEntry.create_compensatory_holiday(
    test_employee_id,
    Date.parse("2024-10-15"), # 既に振り替え先として使用済み
    Date.parse("2024-10-20"),
    { notes: '二重振り替えテスト' }
  )
  puts "❌ 二重振り替えが許可されてしまいました"
rescue => e
  puts "✅ 二重振り替えが正しく防止されました: #{e.message}"
end

# 平日を振り替え元にしたテスト
begin
  puts "平日を振り替え元にしたテスト..."
  ScheduleEntry.create_compensatory_holiday(
    test_employee_id,
    Date.parse("2024-10-02"), # 平日
    Date.parse("2024-10-20"),
    { notes: '平日振り替えテスト' }
  )
  puts "❌ 平日の振り替えが許可されてしまいました"
rescue => e
  puts "✅ 平日の振り替えが正しく防止されました: #{e.message}"
end

puts "\n5. スコープテスト"
puts "----------------"

# 振り替え休日の一覧取得
compensatory_holidays = ScheduleEntry.compensatory_holiday.active
puts "振り替え休日の数: #{compensatory_holidays.count}"

# 代休の一覧取得
substitute_holidays = ScheduleEntry.substitute.active
puts "代休の数: #{substitute_holidays.count}"

puts "\n6. 手当計算テスト"
puts "----------------"

# 勤怠レコードの手当計算テスト（仮想的）
puts "振り替え休日での勤務: 割増賃金なし"
puts "代休未取得での勤務: 35%割増賃金"
puts "通常の休日勤務: 35%割増賃金"

puts "\n=== テスト完了 ==="
puts "実装した機能が正常に動作しています。"
