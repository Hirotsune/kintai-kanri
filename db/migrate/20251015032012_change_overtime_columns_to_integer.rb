class ChangeOvertimeColumnsToInteger < ActiveRecord::Migration[8.0]
  def up
    # 残業時間カラムをnumeric(4,2)からintegerに変更
    change_column :attendances, :overtime_15min, :integer, default: 0, comment: "15分刻み残業時間（分）"
    change_column :attendances, :overtime_10min, :integer, default: 0, comment: "10分刻み残業時間（分）"
    change_column :attendances, :overtime_5min, :integer, default: 0, comment: "5分刻み残業時間（分）"
    change_column :attendances, :overtime_1min, :integer, default: 0, comment: "1分刻み残業時間（分）"
    
    # 既存の小数点データを整数に変換（分単位に変換）
    puts "既存の残業時間データを分単位に変換します..."
    
    # 小数点の残業時間を分単位に変換
    Attendance.where.not(overtime_15min: [nil, 0]).find_each do |attendance|
      if attendance.overtime_15min.present? && attendance.overtime_15min > 0
        # 時間単位から分単位に変換（例：0.5時間 → 30分）
        attendance.overtime_15min = (attendance.overtime_15min * 60).round
        attendance.save!
      end
    end
    
    Attendance.where.not(overtime_10min: [nil, 0]).find_each do |attendance|
      if attendance.overtime_10min.present? && attendance.overtime_10min > 0
        attendance.overtime_10min = (attendance.overtime_10min * 60).round
        attendance.save!
      end
    end
    
    Attendance.where.not(overtime_5min: [nil, 0]).find_each do |attendance|
      if attendance.overtime_5min.present? && attendance.overtime_5min > 0
        attendance.overtime_5min = (attendance.overtime_5min * 60).round
        attendance.save!
      end
    end
    
    Attendance.where.not(overtime_1min: [nil, 0]).find_each do |attendance|
      if attendance.overtime_1min.present? && attendance.overtime_1min > 0
        attendance.overtime_1min = (attendance.overtime_1min * 60).round
        attendance.save!
      end
    end
    
    puts "残業時間カラムの型変更とデータ変換が完了しました。"
  end

  def down
    # ロールバック時はintegerからnumeric(4,2)に戻す
    change_column :attendances, :overtime_15min, :decimal, precision: 4, scale: 2, default: 0.0
    change_column :attendances, :overtime_10min, :decimal, precision: 4, scale: 2, default: 0.0
    change_column :attendances, :overtime_5min, :decimal, precision: 4, scale: 2, default: 0.0
    change_column :attendances, :overtime_1min, :decimal, precision: 4, scale: 2, default: 0.0
    
    # 分単位のデータを時間単位に戻す
    Attendance.where.not(overtime_15min: [nil, 0]).find_each do |attendance|
      if attendance.overtime_15min.present? && attendance.overtime_15min > 0
        attendance.overtime_15min = (attendance.overtime_15min / 60.0).round(2)
        attendance.save!
      end
    end
    
    Attendance.where.not(overtime_10min: [nil, 0]).find_each do |attendance|
      if attendance.overtime_10min.present? && attendance.overtime_10min > 0
        attendance.overtime_10min = (attendance.overtime_10min / 60.0).round(2)
        attendance.save!
      end
    end
    
    Attendance.where.not(overtime_5min: [nil, 0]).find_each do |attendance|
      if attendance.overtime_5min.present? && attendance.overtime_5min > 0
        attendance.overtime_5min = (attendance.overtime_5min / 60.0).round(2)
        attendance.save!
      end
    end
    
    Attendance.where.not(overtime_1min: [nil, 0]).find_each do |attendance|
      if attendance.overtime_1min.present? && attendance.overtime_1min > 0
        attendance.overtime_1min = (attendance.overtime_1min / 60.0).round(2)
        attendance.save!
      end
    end
  end
end
