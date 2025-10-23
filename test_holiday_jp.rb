#!/usr/bin/env ruby

# HolidayJp gemのテスト
require 'date'

# HolidayJp gemを読み込み
begin
  require 'holiday_jp'
  puts "HolidayJp gemが正常に読み込まれました"
  
  # テスト日付
  test_date = Date.parse('2025-09-07')  # 日曜日
  puts "テスト日付: #{test_date} (#{test_date.strftime('%A')})"
  puts "日曜日かどうか: #{test_date.sunday?}"
  puts "祝日かどうか: #{HolidayJp.holiday?(test_date)}"
  
  # 振休作成のテスト
  puts "\n振休作成テスト:"
  puts "有効な休日かどうか: #{test_date.sunday? || HolidayJp.holiday?(test_date)}"
  
rescue LoadError => e
  puts "HolidayJp gemの読み込みに失敗: #{e.message}"
rescue => e
  puts "エラー: #{e.message}"
end
