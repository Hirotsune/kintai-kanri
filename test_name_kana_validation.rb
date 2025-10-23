#!/usr/bin/env ruby

# name_kanaバリデーションのテストスクリプト
require_relative 'config/environment'

puts "=== name_kanaバリデーションのテスト ==="

# ID = 2の従業員を取得
employee = Employee.find(2)
puts "対象従業員: ID=#{employee.id}, employee_id=#{employee.employee_id}, name=#{employee.name}"

# 様々なname_kanaパターンをテスト
test_cases = [
  'さとう　はなこ',  # 全角スペース
  'さとう はなこ',   # 半角スペース
  'さとうはなこ',    # スペースなし
  'さとう・はなこ',  # 中点
  'さとう　はなこ　', # 前後に全角スペース
  '田中太郎',        # 漢字（エラーになるべき）
  'tanaka',         # 英字（エラーになるべき）
  '',               # 空文字
  nil               # nil
]

test_cases.each do |test_value|
  employee.name_kana = test_value
  employee.valid?
  
  if employee.errors.empty?
    puts "✅ '#{test_value}' → 有効"
  else
    puts "❌ '#{test_value}' → エラー: #{employee.errors.full_messages.join(', ')}"
  end
end






