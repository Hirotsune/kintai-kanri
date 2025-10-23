#!/usr/bin/env ruby

# 従業員データの確認スクリプト
require_relative 'config/environment'

puts "=== 従業員データの確認 ==="

# 全従業員を取得
employees = Employee.all

puts "総従業員数: #{employees.count}"
puts "\n従業員一覧:"
employees.each do |emp|
  puts "ID: #{emp.id}, employee_id: #{emp.employee_id}, name: #{emp.name}, name_kana: #{emp.name_kana}"
end

# employee_id = '2345'の重複チェック
puts "\n=== employee_id = '2345' の重複チェック ==="
duplicates = Employee.where(employee_id: '2345')
puts "employee_id = '2345' のレコード数: #{duplicates.count}"
duplicates.each do |emp|
  puts "ID: #{emp.id}, employee_id: #{emp.employee_id}, name: #{emp.name}"
end

# ID = 2の従業員情報
puts "\n=== ID = 2 の従業員情報 ==="
employee_2 = Employee.find_by(id: 2)
if employee_2
  puts "ID: #{employee_2.id}, employee_id: #{employee_2.employee_id}, name: #{employee_2.name}, name_kana: #{employee_2.name_kana}"
else
  puts "ID = 2 の従業員が見つかりません"
end

puts "\n=== バリデーションエラーのテスト ==="
if employee_2
  # 現在のデータでバリデーションをテスト
  puts "現在のデータでのバリデーション:"
  employee_2.valid?
  puts "エラー: #{employee_2.errors.full_messages}" unless employee_2.errors.empty?
  
  # name_kanaを設定してバリデーションをテスト
  puts "\nname_kana = 'さとう　はなこ' でのバリデーション:"
  employee_2.name_kana = 'さとう　はなこ'
  employee_2.valid?
  puts "エラー: #{employee_2.errors.full_messages}" unless employee_2.errors.empty?
end





