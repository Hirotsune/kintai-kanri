# 実際のExcelデータから抽出した工場データ
puts "=== 工場データの登録開始 ==="

# 既存のfactoriesデータをクリア
Factory.destroy_all
puts "既存の工場データをクリアしました"

# 実際のExcelデータから抽出した工場情報
factories_data = [
  {
    factory_id: "0",
    name: "なし",
    is_active: true
  },
  {
    factory_id: "1", 
    name: "第一工場",
    is_active: true
  },
  {
    factory_id: "3",
    name: "第三工場", 
    is_active: true
  },
  {
    factory_id: "10",
    name: "第二工場",
    is_active: true
  }
]

factories_data.each do |factory_attrs|
  factory = Factory.create!(factory_attrs)
  puts "作成: #{factory.name} (ID: #{factory.factory_id}, Active: #{factory.is_active})"
end

puts "=== 工場データの登録完了 ==="
puts "作成された工場数: #{Factory.count}"

# 工場データの確認
puts "\n=== 登録された工場一覧 ==="
Factory.all.each do |factory|
  puts "  #{factory.factory_id}: #{factory.name}"
end