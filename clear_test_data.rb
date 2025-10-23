#!/usr/bin/env ruby

# テストデータクリアスクリプト
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
  when 'DELETE'
    request = Net::HTTP::Delete.new(uri)
  end
  
  response = http.request(request)
  {
    status: response.code.to_i,
    body: response.body
  }
end

puts "テストデータクリア開始"
puts "=" * 50

# 既存のスケジュールエントリを取得
response = make_request('GET', '/schedule_entries?employee_id=1234')
if response[:status] == 200
  entries = JSON.parse(response[:body])
  puts "既存のスケジュールエントリ数: #{entries.length}"
  
  # 各エントリを削除
  entries.each do |entry|
    if entry['schedule_type'] == 'compensatory' || entry['schedule_type'] == 'substitute'
      puts "削除中: ID=#{entry['id']}, タイプ=#{entry['schedule_type']}, 日付=#{entry['schedule_date']}"
      delete_response = make_request('DELETE', "/schedule_entries/#{entry['id']}")
      puts "削除結果: #{delete_response[:status]}"
    end
  end
else
  puts "スケジュールエントリの取得に失敗: #{response[:status]}"
end

puts "=" * 50
puts "テストデータクリア完了"

