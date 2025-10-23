#!/usr/bin/env ruby

# 2025年9月の休日確認スクリプト
require 'date'

puts "2025年9月の休日確認"
puts "=" * 30

# 2025年9月の日付をチェック
(1..30).each do |day|
  date = Date.new(2025, 9, day)
  day_name = date.strftime('%A')
  
  # 日曜日かどうか
  is_sunday = date.sunday?
  
  # 祝日かどうか（手動チェック）
  is_holiday = false
  case [date.month, date.day]
  when [9, 15]  # 敬老の日
    is_holiday = true
  when [9, 23]  # 秋分の日
    is_holiday = true
  end
  
  if is_sunday || is_holiday
    holiday_type = is_sunday ? "日曜日" : "祝日"
    puts "#{date.strftime('%Y-%m-%d (%a)')} - #{holiday_type}"
  end
end

puts "\n振休・代休テスト用の推奨日付:"
puts "元の休日（振休元）: 2025-09-15 (敬老の日) または 2025-09-23 (秋分の日)"
puts "振休先: 2025-10-01 (未来の平日)"
puts "代休対象: 2025-09-15 (敬老の日) または 2025-09-23 (秋分の日)"
