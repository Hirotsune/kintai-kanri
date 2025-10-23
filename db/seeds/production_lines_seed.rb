# 実際のExcelデータから抽出したラインデータ
puts "=== ラインデータの登録開始 ==="

# 既存のlinesデータをクリア
Line.destroy_all
puts "既存のラインデータをクリアしました"

# 工場データが存在することを確認
if Factory.count == 0
  puts "エラー: 工場データが見つかりません。先にproduction_factories_seed.rbを実行してください。"
  exit
end

# 実際のExcelデータから抽出したライン情報
lines_data = [
  # 本社・管理部門 (factory_id: "0")
  {
    line_id: "0",
    name: "なし",
    factory_id: "0",
    is_active: true
  },
  {
    line_id: "111",
    name: "その他",
    factory_id: "0",
    is_active: true
  },
  
  # 第一工場 (factory_id: "1")
  {
    line_id: "4",
    name: "第一工場　製造",
    factory_id: "1",
    is_active: true
  },
  {
    line_id: "34",
    name: "第一工場　女子",
    factory_id: "1",
    is_active: true
  },
  
  # 第三工場 (factory_id: "3")
  {
    line_id: "33",
    name: "第三工場　すし",
    factory_id: "3",
    is_active: true
  },
  
  # 第二工場 (factory_id: "10")
  {
    line_id: "41",
    name: "第二工場　16号",
    factory_id: "10",
    is_active: true
  },
  {
    line_id: "42",
    name: "第二工場　量産",
    factory_id: "10",
    is_active: true
  }
]

lines_data.each do |line_attrs|
  # 工場が存在することを確認
  factory = Factory.find_by(factory_id: line_attrs[:factory_id])
  if factory.nil?
    puts "警告: 工場ID #{line_attrs[:factory_id]} が見つかりません。スキップ: #{line_attrs[:name]}"
    next
  end
  
  line = Line.create!(line_attrs)
  puts "作成: #{line.name} (ID: #{line.line_id}, 工場: #{factory.name})"
end

puts "=== ラインデータの登録完了 ==="
puts "作成されたライン数: #{Line.count}"

# ラインデータの確認（工場別）
puts "\n=== 登録されたライン一覧（工場別） ==="
Factory.all.order(:factory_id).each do |factory|
  puts "\n【#{factory.name}】"
  factory.lines.order(:line_id).each do |line|
    puts "  #{line.line_id}: #{line.name}"
  end
end