#!/usr/bin/env ruby

# 振休作成のデバッグスクリプト
require_relative 'config/environment'

begin
  puts "振休作成テスト開始"
  
  # 従業員の存在確認
  employee = Employee.find_by(employee_id: '1234')
  if employee
    puts "従業員が見つかりました: #{employee.name}"
  else
    puts "従業員が見つかりません"
    exit 1
  end
  
  # 振休作成
  entry = ScheduleEntry.create_compensatory_holiday(
    '1234', 
    Date.parse('2025-09-07'), 
    Date.parse('2025-09-12'), 
    {notes: 'テスト'}
  )
  
  puts "振休作成成功: #{entry.inspect}"
  
rescue => e
  puts "エラー: #{e.message}"
  puts "バックトレース:"
  puts e.backtrace.first(10)
end
