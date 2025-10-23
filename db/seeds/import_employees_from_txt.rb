# TXTファイルから従業員データをインポートするスクリプト
puts "=== TXTファイルから従業員データのインポート開始 ==="

# 既存のemployeesデータをクリア
Employee.destroy_all
puts "既存の従業員データをクリアしました"

# 工場・ラインデータが存在することを確認
if Factory.count == 0 || Line.count == 0
  puts "エラー: 工場・ラインデータが見つかりません。先にfactories_seed.rbとlines_seed.rbを実行してください。"
  exit
end

# TXTファイルのパス
txt_file_path = "C:/Users/user/Desktop/従業員一覧.txt"

# ファイルが存在するかチェック
unless File.exist?(txt_file_path)
  puts "エラー: ファイルが見つかりません: #{txt_file_path}"
  exit
end

# ファイルを読み込み
puts "ファイルを読み込み中: #{txt_file_path}"
lines = File.readlines(txt_file_path, encoding: 'UTF-8')

# ヘッダー行をスキップ（1行目）
data_lines = lines[1..-1]

puts "データ行数: #{data_lines.length}"

# 従業員データの登録
success_count = 0
error_count = 0

data_lines.each_with_index do |line, index|
  # タブで分割
  fields = line.strip.split("\t")
  
  # フィールド数チェック
  if fields.length < 6
    puts "警告: 行 #{index + 2} のフィールド数が不足しています: #{fields.length}"
    error_count += 1
    next
  end
  
  # データを抽出
  employee_id = fields[0].strip
  name = fields[1].strip
  line_id = fields[2].strip
  line_name = fields[3].strip
  factory_id = fields[4].strip
  factory_name = fields[5].strip
  
  # 工場・ラインが存在することを確認
  factory = Factory.find_by(factory_id: factory_id)
  line = Line.find_by(line_id: line_id)
  
  if factory.nil?
    puts "警告: 工場ID #{factory_id} が見つかりません。スキップ: #{name}"
    error_count += 1
    next
  end
  
  if line.nil?
    puts "警告: ラインID #{line_id} が見つかりません。スキップ: #{name}"
    error_count += 1
    next
  end
  
  # ひらがな名を生成（簡易版）
  name_kana = case name
  when /三好.*兼治/
    "みよし　けんじ"
  when /安廣.*健児/
    "やすひろ　けんじ"
  when /山口.*欣重/
    "やまぐち　きんじゅう"
  when /長副.*孝之/
    "ながそえ　たかゆき"
  when /渡辺.*隆一/
    "わたなべ　りゅういち"
  when /本田.*陵子/
    "ほんだ　りょうこ"
  when /木下.*正晴/
    "きのした　まさはる"
  when /中村.*ひとみ/
    "なかむら　ひとみ"
  when /吉村.*美代子/
    "よしむら　みよこ"
  when /上瀧.*洋平/
    "うえたき　ようへい"
  when /芳永.*智秀/
    "よしなが　ともひで"
  when /鈴木.*満里子/
    "すずき　まりこ"
  when /奥.*久美/
    "おく　くみ"
  when /大竹.*弘美/
    "おおたけ　ひろみ"
  when /山下.*リエ/
    "やました　りえ"
  when /佐藤.*貴美子/
    "さとう　きみこ"
  when /鐘ヶ江.*一子/
    "かねがえ　いちこ"
  when /木下.*政秀/
    "きのした　まさひで"
  when /永田.*恵子/
    "ながた　けいこ"
  when /堀田.*まゆみ/
    "ほった　まゆみ"
  when /熊谷.*栄二/
    "くまがい　えいじ"
  when /吉村.*博和/
    "よしむら　ひろかず"
  when /松田.*理絵/
    "まつだ　りえ"
  when /長原.*一親/
    "ながはら　かずちか"
  when /山下.*慎太郎/
    "やました　しんたろう"
  when /岡島.*智恵子/
    "おかしま　ちえこ"
  when /杉崎.*千俊/
    "すぎさき　せんしゅん"
  when /佐藤.*美和/
    "さとう　みわ"
  when /島田.*由里/
    "しまだ　ゆり"
  when /崎平聡一郎/
    "さきひら　そういちろう"
  when /河田.*由美/
    "かわた　ゆみ"
  when /佐藤.*清/
    "さとう　きよし"
  when /大庭.*稔/
    "おおば　みのる"
  when /今井.*真理子/
    "いまい　まりこ"
  when /古賀.*智江/
    "こが　ちえ"
  when /寺田.*龍矢/
    "てらだ　りゅうや"
  when /矢山.*智美/
    "ややま　ともみ"
  when /江本.*千鶴/
    "えもと　ちづる"
  when /滑石.*賢治/
    "なめし　けんじ"
  when /宮本.*和幸/
    "みやもと　かずゆき"
  when /新ヶ江眞理子/
    "しんがえ　まりこ"
  when /藤井.*礼子/
    "ふじい　れいこ"
  when /渡辺.*勝美/
    "わたなべ　かつみ"
  when /三好.*幸/
    "みよし　さち"
  when /甲斐.*秀和/
    "かい　ひでかず"
  when /中村.*ひろみ/
    "なかむら　ひろみ"
  when /古賀.*義信/
    "こが　よしのぶ"
  when /丸井.*教雄/
    "まるい　のりお"
  when /佐藤.*洋一/
    "さとう　よういち"
  when /古賀.*奈津美/
    "こが　なつみ"
  when /米川.*賢史/
    "よねかわ　けんし"
  when /山野.*朝男/
    "やまの　あさお"
  when /福田.*マリ子/
    "ふくだ　まりこ"
  when /和田.*孝志/
    "わだ　たかし"
  when /小川.*正和/
    "おがわ　まさかず"
  when /山下.*正和/
    "やました　まさかず"
  when /木村.*純子/
    "きむら　じゅんこ"
  when /奥.*昇久/
    "おく　のぶひさ"
  when /小嶺.*光吉/
    "こみね　みつよし"
  else
    # 外国人名や特殊な名前の場合は空文字
    ""
  end
  
  # 従業員データを作成
  employee_data = {
    employee_id: employee_id,
    name: name,
    department: factory_name,
    line_id: line_id,
    factory_id: factory_id,
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: name_kana
  }
  
  begin
    employee = Employee.create!(employee_data)
    puts "作成: #{employee.name} (ID: #{employee.employee_id}, 工場: #{factory.name}, ライン: #{line.name})"
    success_count += 1
  rescue => e
    puts "エラー: #{name} (ID: #{employee_id}) - #{e.message}"
    error_count += 1
  end
end

puts "\n=== インポート完了 ==="
puts "成功: #{success_count}名"
puts "エラー: #{error_count}名"
puts "合計: #{success_count + error_count}名"

# 従業員データの確認（工場別）
puts "\n=== 登録された従業員一覧（工場別） ==="
Factory.all.order(:factory_id).each do |factory|
  puts "\n【#{factory.name}】"
  factory.employees.order(:employee_id).each do |employee|
    puts "  #{employee.employee_id}: #{employee.name} (#{employee.line.name})"
  end
end
