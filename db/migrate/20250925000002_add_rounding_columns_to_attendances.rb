class AddRoundingColumnsToAttendances < ActiveRecord::Migration[7.0]
  def change
    # 退社時刻（各モード）
    add_column :attendances, :clock_out_rounded_15min, :time
    add_column :attendances, :clock_out_rounded_10min, :time
    add_column :attendances, :clock_out_rounded_5min, :time
    add_column :attendances, :clock_out_rounded_1min, :time
    
    # 残業時間（各モード）
    add_column :attendances, :overtime_15min, :decimal, precision: 4, scale: 2, default: 0
    add_column :attendances, :overtime_10min, :decimal, precision: 4, scale: 2, default: 0
    add_column :attendances, :overtime_5min, :decimal, precision: 4, scale: 2, default: 0
    add_column :attendances, :overtime_1min, :decimal, precision: 4, scale: 2, default: 0
    
    # 就業合計時間（各モード）
    add_column :attendances, :total_work_time_15min, :decimal, precision: 4, scale: 2, default: 0
    add_column :attendances, :total_work_time_10min, :decimal, precision: 4, scale: 2, default: 0
    add_column :attendances, :total_work_time_5min, :decimal, precision: 4, scale: 2, default: 0
    add_column :attendances, :total_work_time_1min, :decimal, precision: 4, scale: 2, default: 0
    
    # インデックス追加（検索速度向上）
    add_index :attendances, :total_work_time_15min
    add_index :attendances, :total_work_time_10min
    add_index :attendances, :total_work_time_5min
    add_index :attendances, :total_work_time_1min
  end
end
