class CreateShifts < ActiveRecord::Migration[7.0]
  def change
    create_table :shifts do |t|
      t.string :name, null: false                    # "日勤", "夜勤", "短時間勤務"
      t.time :start_time, null: false                # 開始時刻
      t.decimal :duration_hours, precision: 3, scale: 1, null: false  # 勤務時間
      t.integer :date_boundary_hour, null: false     # 日付境界時刻
      t.string :factory_id                           # 工場ID（オプション）
      t.boolean :is_active, default: true            # 有効/無効
      t.text :description                            # 説明
      
      t.timestamps
    end
    
    add_index :shifts, [:factory_id, :is_active]
    add_index :shifts, :name
  end
end
