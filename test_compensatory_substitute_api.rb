#!/usr/bin/env ruby

# 振休・代休APIテストスクリプト
require 'net/http'
require 'json'
require 'uri'

BASE_URL = 'http://localhost:3000/api/v1'

def make_request(method, path, data = nil)
  uri = URI("#{BASE_URL}#{path}")
  http = Net::HTTP.new(uri.host, uri.port)
  
  case method.upcase
  when 'GET'
    request = Net::HTTP::Get.new(uri)
  when 'POST'
    request = Net::HTTP::Post.new(uri)
    request['Content-Type'] = 'application/json'
    request.body = data.to_json if data
  when 'PATCH'
    request = Net::HTTP::Patch.new(uri)
    request['Content-Type'] = 'application/json'
    request.body = data.to_json if data
  end
  
  response = http.request(request)
  {
    status: response.code.to_i,
    body: response.body,
    headers: response.to_hash
  }
end

def test_compensatory_holiday_creation
  puts "\n=== 振休作成テスト ==="
  
  # 振休作成データ
  compensatory_data = {
    compensatory_holiday: {
      employee_id: "1234",
      original_date: "2025-09-07",  # 日曜日
      compensatory_date: "2025-10-01",  # 未来の日付
      notes: "テスト用振休"
    }
  }
  
  response = make_request('POST', '/schedule_entries/create_compensatory_holiday', compensatory_data)
  
  puts "ステータス: #{response[:status]}"
  puts "レスポンス: #{response[:body].force_encoding('UTF-8')}"
  
  if response[:status] == 201
    puts "✅ 振休作成成功"
    return JSON.parse(response[:body])
  else
    puts "❌ 振休作成失敗"
    return nil
  end
end

def test_substitute_holiday_creation
  puts "\n=== 代休作成テスト ==="
  
  # 代休作成データ
  substitute_data = {
    substitute_holiday: {
      employee_id: "1234",
      work_date: "2025-09-15",  # 敬老の日（祝日）
      allowance_rate: 0.35,
      expiry_days: 60,
      notes: "テスト用代休"
    }
  }
  
  response = make_request('POST', '/schedule_entries/create_substitute_holiday', substitute_data)
  
  puts "ステータス: #{response[:status]}"
  puts "レスポンス: #{response[:body].force_encoding('UTF-8')}"
  
  if response[:status] == 201
    puts "✅ 代休作成成功"
    return JSON.parse(response[:body])
  else
    puts "❌ 代休作成失敗"
    return nil
  end
end

def test_compensatory_holidays_list
  puts "\n=== 振休一覧取得テスト ==="
  
  response = make_request('GET', '/schedule_entries/compensatory_holidays?employee_id=1234')
  
  puts "ステータス: #{response[:status]}"
  puts "レスポンス: #{response[:body].force_encoding('UTF-8')}"
  
  if response[:status] == 200
    puts "✅ 振休一覧取得成功"
    return JSON.parse(response[:body])
  else
    puts "❌ 振休一覧取得失敗"
    return nil
  end
end

def test_substitute_holidays_list
  puts "\n=== 代休一覧取得テスト ==="
  
  response = make_request('GET', '/schedule_entries/substitute_holidays?employee_id=1234')
  
  puts "ステータス: #{response[:status]}"
  puts "レスポンス: #{response[:body].force_encoding('UTF-8')}"
  
  if response[:status] == 200
    puts "✅ 代休一覧取得成功"
    return JSON.parse(response[:body])
  else
    puts "❌ 代休一覧取得失敗"
    return nil
  end
end

def test_double_compensatory_prevention
  puts "\n=== 二重振休防止テスト ==="
  
  # 同じ日付で振休を再度作成しようとする
  compensatory_data = {
    compensatory_holiday: {
      employee_id: "1234",
      original_date: "2025-09-07",  # 既に振休として使用済み
      compensatory_date: "2025-10-02",  # 未来の平日
      notes: "二重振休テスト"
    }
  }
  
  response = make_request('POST', '/schedule_entries/create_compensatory_holiday', compensatory_data)
  
  puts "ステータス: #{response[:status]}"
  puts "レスポンス: #{response[:body].force_encoding('UTF-8')}"
  
  if response[:status] == 422
    puts "✅ 二重振休防止成功（期待されるエラー）"
  else
    puts "❌ 二重振休防止失敗（エラーが発生すべき）"
  end
end

def test_invalid_holiday_date
  puts "\n=== 無効な休日指定テスト ==="
  
  # 平日を休日として指定
  compensatory_data = {
    compensatory_holiday: {
      employee_id: "1234",
      original_date: "2025-09-09",  # 火曜日（平日）
      compensatory_date: "2025-10-03",  # 未来の平日
      notes: "無効な休日テスト"
    }
  }
  
  response = make_request('POST', '/schedule_entries/create_compensatory_holiday', compensatory_data)
  
  puts "ステータス: #{response[:status]}"
  puts "レスポンス: #{response[:body].force_encoding('UTF-8')}"
  
  if response[:status] == 422
    puts "✅ 無効な休日指定エラー成功（期待されるエラー）"
  else
    puts "❌ 無効な休日指定エラー失敗（エラーが発生すべき）"
  end
end

# メイン実行
puts "振休・代休APIテスト開始"
puts "=" * 50

# 1. 振休作成テスト
compensatory_entry = test_compensatory_holiday_creation

# 2. 代休作成テスト
substitute_entry = test_substitute_holiday_creation

# 3. 振休一覧取得テスト
test_compensatory_holidays_list

# 4. 代休一覧取得テスト
test_substitute_holidays_list

# 5. 二重振休防止テスト
test_double_compensatory_prevention

# 6. 無効な休日指定テスト
test_invalid_holiday_date

puts "\n" + "=" * 50
puts "振休・代休APIテスト完了"

if compensatory_entry && substitute_entry
  puts "✅ 全てのテストが正常に完了しました"
else
  puts "❌ 一部のテストが失敗しました"
end
