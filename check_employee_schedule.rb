#!/usr/bin/env ruby

# 従業員のスケジュール確認スクリプト
require_relative 'config/environment'

puts "従業員のスケジュール確認"
puts "=" * 30

# 従業員の確認
employee = Employee.find_by(employee_id: '1234')
if employee
  puts "従業員: #{employee.name}"
else
  puts "従業員が見つかりません"
  exit 1
end

# 9月7日のスケジュール確認
puts "\n9月7日のスケジュール:"
schedule = ScheduleEntry.where(employee_id: '1234', schedule_date: Date.parse('2025-09-07')).first
if schedule
  puts "スケジュールタイプ: #{schedule.schedule_type}"
  puts "ステータス: #{schedule.status}"
  puts "詳細: #{schedule.inspect}"
else
  puts "スケジュールなし"
end

# 9月の全スケジュール確認
puts "\n9月の全スケジュール:"
schedules = ScheduleEntry.where(employee_id: '1234', schedule_date: Date.parse('2025-09-01')..Date.parse('2025-09-30'))
schedules.each do |s|
  puts "#{s.schedule_date}: #{s.schedule_type} (#{s.status})"
end
