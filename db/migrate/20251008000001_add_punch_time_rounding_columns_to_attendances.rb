class AddPunchTimeRoundingColumnsToAttendances < ActiveRecord::Migration[8.0]
  def change
    # 出勤時間の丸め列（各モード）
    add_column :attendances, :clock_in_rounded_15min, :time
    add_column :attendances, :clock_in_rounded_10min, :time
    add_column :attendances, :clock_in_rounded_5min, :time
    add_column :attendances, :clock_in_rounded_1min, :time
    
    # 昼休出1時間の丸め列（各モード）
    add_column :attendances, :lunch_out1_15min, :time
    add_column :attendances, :lunch_out1_10min, :time
    add_column :attendances, :lunch_out1_5min, :time
    add_column :attendances, :lunch_out1_1min, :time
    
    # 昼休入1時間の丸め列（各モード）
    add_column :attendances, :lunch_in1_15min, :time
    add_column :attendances, :lunch_in1_10min, :time
    add_column :attendances, :lunch_in1_5min, :time
    add_column :attendances, :lunch_in1_1min, :time
    
    # 昼休出2時間の丸め列（各モード）
    add_column :attendances, :lunch_out2_15min, :time
    add_column :attendances, :lunch_out2_10min, :time
    add_column :attendances, :lunch_out2_5min, :time
    add_column :attendances, :lunch_out2_1min, :time
    
    # 昼休入2時間の丸め列（各モード）
    add_column :attendances, :lunch_in2_15min, :time
    add_column :attendances, :lunch_in2_10min, :time
    add_column :attendances, :lunch_in2_5min, :time
    add_column :attendances, :lunch_in2_1min, :time
    
    # インデックス追加（検索速度向上）
    add_index :attendances, :clock_in_rounded_15min
    add_index :attendances, :clock_in_rounded_10min
    add_index :attendances, :clock_in_rounded_5min
    add_index :attendances, :clock_in_rounded_1min
  end
end
