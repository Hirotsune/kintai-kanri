# 実際の従業員データの登録
puts "=== 従業員データの登録開始 ==="

# 既存のemployeesデータをクリア
Employee.destroy_all
puts "既存の従業員データをクリアしました"

# 工場・ラインデータが存在することを確認
if Factory.count == 0 || Line.count == 0
  puts "エラー: 工場・ラインデータが見つかりません。先にfactories_seed.rbとlines_seed.rbを実行してください。"
  exit
end

# 実際の従業員データ（全247名）
employees_data = [
  {
    employee_id: "1",
    name: "三好　兼治",
    department: "工場外",
    line_id: "0",
    factory_id: "0",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "みよし　けんじ"
  },
  {
    employee_id: "6",
    name: "安廣　健児",
    department: "第１工場",
    line_id: "6",
    factory_id: "1",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "やすひろ　けんじ"
  },
  {
    employee_id: "7",
    name: "山口　欣重",
    department: "第３工場",
    line_id: "38",
    factory_id: "3",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "やまぐち　きんじゅう"
  },
  {
    employee_id: "9",
    name: "長副　孝之",
    department: "第１工場",
    line_id: "6",
    factory_id: "1",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "ながそえ　たかゆき"
  },
  {
    employee_id: "13",
    name: "渡辺　隆一",
    department: "第１工場",
    line_id: "14",
    factory_id: "1",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "わたなべ　りゅういち"
  },
  {
    employee_id: "18",
    name: "本田　陵子",
    department: "工場外",
    line_id: "503",
    factory_id: "0",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "ほんだ　りょうこ"
  },
  {
    employee_id: "20",
    name: "木下　正晴",
    department: "望岳台工場",
    line_id: "41",
    factory_id: "10",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "きのした　まさはる"
  },
  {
    employee_id: "21",
    name: "中村　ひとみ",
    department: "工場外",
    line_id: "503",
    factory_id: "0",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "なかむら　ひとみ"
  },
  {
    employee_id: "23",
    name: "吉村　美代子",
    department: "第１工場",
    line_id: "13",
    factory_id: "1",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "よしむら　みよこ"
  },
  {
    employee_id: "24",
    name: "上瀧　洋平",
    department: "望岳台工場",
    line_id: "42",
    factory_id: "10",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "うえたき　ようへい"
  },
  {
    employee_id: "25",
    name: "芳永　智秀",
    department: "第１工場",
    line_id: "12",
    factory_id: "1",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "よしなが　ともひで"
  },
  {
    employee_id: "30",
    name: "鈴木　満里子",
    department: "第３工場",
    line_id: "38",
    factory_id: "3",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "すずき　まりこ"
  },
  {
    employee_id: "31",
    name: "奥　久美",
    department: "望岳台工場",
    line_id: "45",
    factory_id: "10",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "おく　くみ"
  },
  {
    employee_id: "32",
    name: "大竹　弘美",
    department: "第１工場",
    line_id: "13",
    factory_id: "1",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "おおたけ　ひろみ"
  },
  {
    employee_id: "33",
    name: "山下　リエ",
    department: "第３工場",
    line_id: "38",
    factory_id: "3",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "やました　りえ"
  },
  {
    employee_id: "34",
    name: "佐藤　貴美子",
    department: "第１工場",
    line_id: "11",
    factory_id: "1",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "さとう　きみこ"
  },
  {
    employee_id: "36",
    name: "鐘ヶ江　一子",
    department: "第３工場",
    line_id: "38",
    factory_id: "3",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "かねがえ　いちこ"
  },
  {
    employee_id: "37",
    name: "木下　政秀",
    department: "望岳台工場",
    line_id: "43",
    factory_id: "10",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "きのした　まさひで"
  },
  {
    employee_id: "38",
    name: "永田　恵子",
    department: "第３工場",
    line_id: "38",
    factory_id: "3",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "ながた　けいこ"
  },
  {
    employee_id: "39",
    name: "堀田　まゆみ",
    department: "第１工場",
    line_id: "13",
    factory_id: "1",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "ほった　まゆみ"
  },
  {
    employee_id: "41",
    name: "熊谷　栄二",
    department: "第３工場",
    line_id: "38",
    factory_id: "3",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "くまがい　えいじ"
  },
  {
    employee_id: "42",
    name: "吉村　博和",
    department: "第１工場",
    line_id: "12",
    factory_id: "1",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "よしむら　ひろかず"
  },
  {
    employee_id: "45",
    name: "松田　理絵",
    department: "工場外",
    line_id: "503",
    factory_id: "0",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "まつだ　りえ"
  },
  {
    employee_id: "48",
    name: "長原　一親",
    department: "第１工場",
    line_id: "14",
    factory_id: "1",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "ながはら　かずちか"
  },
  {
    employee_id: "54",
    name: "山下　慎太郎",
    department: "望岳台工場",
    line_id: "42",
    factory_id: "10",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "やました　しんたろう"
  },
  {
    employee_id: "56",
    name: "岡島　智恵子",
    department: "第３工場",
    line_id: "38",
    factory_id: "3",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "おかしま　ちえこ"
  },
  {
    employee_id: "60",
    name: "杉崎　千俊",
    department: "工場外",
    line_id: "501",
    factory_id: "0",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "すぎさき　せんしゅん"
  },
  {
    employee_id: "61",
    name: "佐藤　美和",
    department: "工場外",
    line_id: "503",
    factory_id: "0",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "さとう　みわ"
  },
  {
    employee_id: "65",
    name: "島田　由里",
    department: "第３工場",
    line_id: "38",
    factory_id: "3",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "しまだ　ゆり"
  },
  {
    employee_id: "86",
    name: "崎平聡一郎",
    department: "望岳台工場",
    line_id: "42",
    factory_id: "10",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "さきひら　そういちろう"
  },
  {
    employee_id: "91",
    name: "河田　由美",
    department: "第３工場",
    line_id: "38",
    factory_id: "3",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "かわた　ゆみ"
  },
  {
    employee_id: "97",
    name: "佐藤　清",
    department: "第１工場",
    line_id: "12",
    factory_id: "1",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "さとう　きよし"
  },
  {
    employee_id: "98",
    name: "大庭　稔",
    department: "第１工場",
    line_id: "6",
    factory_id: "1",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "おおば　みのる"
  },
  {
    employee_id: "100",
    name: "今井　真理子",
    department: "第１工場",
    line_id: "14",
    factory_id: "1",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "いまい　まりこ"
  },
  {
    employee_id: "106",
    name: "古賀　智江",
    department: "第１工場",
    line_id: "14",
    factory_id: "1",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "こが　ちえ"
  },
  {
    employee_id: "108",
    name: "寺田　龍矢",
    department: "望岳台工場",
    line_id: "42",
    factory_id: "10",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "てらだ　りゅうや"
  },
  {
    employee_id: "114",
    name: "矢山　智美",
    department: "望岳台工場",
    line_id: "43",
    factory_id: "10",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "ややま　ともみ"
  },
  {
    employee_id: "116",
    name: "江本　千鶴",
    department: "工場外",
    line_id: "503",
    factory_id: "0",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "えもと　ちづる"
  },
  {
    employee_id: "119",
    name: "滑石　賢治",
    department: "望岳台工場",
    line_id: "43",
    factory_id: "10",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "なめし　けんじ"
  },
  {
    employee_id: "121",
    name: "宮本　和幸",
    department: "第１工場",
    line_id: "12",
    factory_id: "1",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "みやもと　かずゆき"
  },
  {
    employee_id: "125",
    name: "新ヶ江眞理子",
    department: "第３工場",
    line_id: "38",
    factory_id: "3",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "しんがえ　まりこ"
  },
  {
    employee_id: "126",
    name: "藤井　礼子",
    department: "望岳台工場",
    line_id: "41",
    factory_id: "10",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "ふじい　れいこ"
  },
  {
    employee_id: "127",
    name: "渡辺　勝美",
    department: "第３工場",
    line_id: "38",
    factory_id: "3",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "わたなべ　かつみ"
  },
  {
    employee_id: "134",
    name: "三好　幸",
    department: "工場外",
    line_id: "0",
    factory_id: "0",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "みよし　さち"
  },
  {
    employee_id: "135",
    name: "甲斐　秀和",
    department: "工場外",
    line_id: "501",
    factory_id: "0",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "かい　ひでかず"
  },
  {
    employee_id: "138",
    name: "中村　ひろみ",
    department: "望岳台工場",
    line_id: "41",
    factory_id: "10",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "なかむら　ひろみ"
  },
  {
    employee_id: "140",
    name: "古賀　義信",
    department: "第１工場",
    line_id: "11",
    factory_id: "1",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "こが　よしのぶ"
  },
  {
    employee_id: "141",
    name: "丸井　教雄",
    department: "第１工場",
    line_id: "6",
    factory_id: "1",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "まるい　のりお"
  },
  {
    employee_id: "144",
    name: "佐藤　洋一",
    department: "工場外",
    line_id: "504",
    factory_id: "0",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "さとう　よういち"
  },
  {
    employee_id: "149",
    name: "古賀　奈津美",
    department: "第１工場",
    line_id: "13",
    factory_id: "1",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "こが　なつみ"
  },
  {
    employee_id: "154",
    name: "米川　賢史",
    department: "工場外",
    line_id: "503",
    factory_id: "0",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "よねかわ　けんし"
  },
  {
    employee_id: "156",
    name: "山野　朝男",
    department: "第１工場",
    line_id: "11",
    factory_id: "1",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "やまの　あさお"
  },
  {
    employee_id: "157",
    name: "福田　マリ子",
    department: "第１工場",
    line_id: "11",
    factory_id: "1",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "ふくだ　まりこ"
  },
  {
    employee_id: "158",
    name: "和田　孝志",
    department: "第３工場",
    line_id: "36",
    factory_id: "3",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "わだ　たかし"
  },
  {
    employee_id: "162",
    name: "小川　正和",
    department: "望岳台工場",
    line_id: "41",
    factory_id: "10",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "おがわ　まさかず"
  },
  {
    employee_id: "163",
    name: "山下　正和",
    department: "第３工場",
    line_id: "38",
    factory_id: "3",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "やました　まさかず"
  },
  {
    employee_id: "169",
    name: "木村　純子",
    department: "望岳台工場",
    line_id: "41",
    factory_id: "10",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "きむら　じゅんこ"
  },
  {
    employee_id: "178",
    name: "奥　昇久",
    department: "望岳台工場",
    line_id: "45",
    factory_id: "10",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "おく　のぶひさ"
  },
  {
    employee_id: "184",
    name: "小嶺　光吉",
    department: "第１工場",
    line_id: "11",
    factory_id: "1",
    status: "active",
    position: "employee",
    position_name: "一般社員",
    hire_date: "2025-10-07",
    name_kana: "こみね　みつよし"
  }
]

# 従業員データの登録
employees_data.each do |employee_attrs|
  # 工場・ラインが存在することを確認
  factory = Factory.find_by(factory_id: employee_attrs[:factory_id])
  line = Line.find_by(line_id: employee_attrs[:line_id])
  
  if factory.nil?
    puts "警告: 工場ID #{employee_attrs[:factory_id]} が見つかりません。スキップ: #{employee_attrs[:name]}"
    next
  end
  
  if line.nil?
    puts "警告: ラインID #{employee_attrs[:line_id]} が見つかりません。スキップ: #{employee_attrs[:name]}"
    next
  end

  employee = Employee.create!(employee_attrs)
  puts "作成: #{employee.name} (ID: #{employee.employee_id}, 工場: #{factory.name}, ライン: #{line.name})"
end

puts "=== 従業員データの登録完了 ==="
puts "作成された従業員数: #{Employee.count}"

# 従業員データの確認（工場別）
puts "\n=== 登録された従業員一覧（工場別） ==="
Factory.all.order(:factory_id).each do |factory|
  puts "\n【#{factory.name}】"
  factory.employees.order(:employee_id).each do |employee|
    puts "  #{employee.employee_id}: #{employee.name} (#{employee.line.name})"
  end
end
