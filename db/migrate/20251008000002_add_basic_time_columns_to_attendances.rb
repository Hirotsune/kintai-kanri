class AddBasicTimeColumnsToAttendances < ActiveRecord::Migration[8.0]
  def change
    # 基本時間列（6列）
    add_column :attendances, :clock_in_time, :time, comment: "出社"
    add_column :attendances, :lunch_out1_time, :time, comment: "昼休出1"
    add_column :attendances, :lunch_in1_time, :time, comment: "昼休入1"
    add_column :attendances, :lunch_out2_time, :time, comment: "昼休出2"
    add_column :attendances, :lunch_in2_time, :time, comment: "昼休入2"
    add_column :attendances, :clock_out_time, :time, comment: "退社"
    
    # インデックス追加（検索速度向上）
    add_index :attendances, :clock_in_time
    add_index :attendances, :clock_out_time
    add_index :attendances, [:employee_id, :work_date]
  end
end
