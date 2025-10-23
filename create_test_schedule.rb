#!/usr/bin/env ruby

# テスト用スケジュール作成スクリプト
require 'net/http'
require 'json'
require 'uri'

BASE_URL = 'http://localhost:3000/api/v1'

def make_request(method, path, data = nil)
  uri = URI("#{BASE_URL}#{path}")
  http = Net::HTTP.new(uri.host, uri.port)
  
  case method.upcase
  when 'POST'
    request = Net::HTTP::Post.new(uri)
    request['Content-Type'] = 'application/json'
    request.body = data.to_json if data
  end
  
  response = http.request(request)
  {
    status: response.code.to_i,
    body: response.body.force_encoding('UTF-8')
  }
end

puts "テスト用スケジュール作成"
puts "=" * 30

# 9月7日に公休を登録
holiday_data = {
  schedule_entry: {
    employee_id: "1234",
    schedule_date: "2025-09-07",
    schedule_type: "holiday",
    status: "scheduled",
    created_by: "admin",
    notes: "テスト用公休"
  }
}

puts "9月7日に公休を登録中..."
response = make_request('POST', '/schedule_entries', holiday_data)
puts "ステータス: #{response[:status]}"
puts "レスポンス: #{response[:body]}"

if response[:status] == 201
  puts "✅ 公休登録成功"
else
  puts "❌ 公休登録失敗"
end
