#!/usr/bin/env ruby

# special_leaveデータの確認と削除スクリプト
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
  when 'DELETE'
    request = Net::HTTP::Delete.new(uri)
  end
  
  response = http.request(request)
  {
    status: response.code.to_i,
    body: response.body,
    headers: response.to_hash
  }
end

def check_special_leave_data
  puts "=== special_leaveデータの確認 ==="
  
  # 全スケジュールエントリを取得
  response = make_request('GET', '/schedule_entries?start_date=2025-09-01&end_date=2025-09-30')
  
  if response[:status] == 200
    data = JSON.parse(response[:body])
    special_leave_entries = data.select { |entry| entry['schedule_type'] == 'special_leave' }
    
    puts "special_leaveデータ数: #{special_leave_entries.count}"
    
    if special_leave_entries.any?
      puts "\nspecial_leaveデータの詳細:"
      special_leave_entries.each do |entry|
        puts "ID: #{entry['id']}, 社員ID: #{entry['employee_id']}, 日付: #{entry['schedule_date']}, ステータス: #{entry['status']}, is_active: #{entry['is_active']}"
      end
      
      puts "\n削除処理を実行しますか？ (y/n)"
      response = gets.chomp.downcase
      
      if response == 'y'
        delete_special_leave_data(special_leave_entries)
      else
        puts "削除処理をキャンセルしました"
      end
    else
      puts "special_leaveデータは見つかりませんでした"
    end
  else
    puts "データの取得に失敗しました: #{response[:status]}"
    puts "レスポンス: #{response[:body]}"
  end
end

def delete_special_leave_data(entries)
  puts "\n=== special_leaveデータの削除 ==="
  
  entries.each do |entry|
    puts "ID #{entry['id']} を削除中..."
    response = make_request('DELETE', "/schedule_entries/#{entry['id']}")
    
    if response[:status] == 204
      puts "✅ ID #{entry['id']} の削除が完了しました"
    else
      puts "❌ ID #{entry['id']} の削除に失敗しました: #{response[:status]}"
      puts "レスポンス: #{response[:body]}"
    end
  end
  
  puts "\n削除処理が完了しました"
  
  # 削除後の確認
  puts "\n=== 削除後の確認 ==="
  check_special_leave_data
end

# メイン実行
puts "special_leaveデータの確認と削除スクリプト"
puts "=" * 50
check_special_leave_data
