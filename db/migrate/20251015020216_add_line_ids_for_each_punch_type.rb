class AddLineIdsForEachPunchType < ActiveRecord::Migration[8.0]
  def change
    # 各打刻タイプごとのラインIDカラムを追加
    add_column :attendances, :clock_in_line_id, :string, comment: "出社時のラインID"
    add_column :attendances, :lunch_in1_line_id, :string, comment: "昼休入1時のラインID"
    add_column :attendances, :lunch_in2_line_id, :string, comment: "昼休入2時のラインID"
    add_column :attendances, :clock_out_line_id, :string, comment: "退社時のラインID"
    
    # インデックスを追加（検索速度向上）
    add_index :attendances, :clock_in_line_id
    add_index :attendances, :lunch_in1_line_id
    add_index :attendances, :lunch_in2_line_id
    add_index :attendances, :clock_out_line_id
  end
end
