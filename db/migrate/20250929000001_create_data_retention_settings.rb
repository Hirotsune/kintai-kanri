class CreateDataRetentionSettings < ActiveRecord::Migration[8.0]
  def change
    create_table :data_retention_settings do |t|
      t.string :table_name, null: false
      t.integer :retention_years, null: false, default: 3
      t.boolean :archive_before_delete, default: true
      t.string :archive_location
      t.boolean :is_active, default: true
      t.text :description
      t.timestamps
    end

    add_index :data_retention_settings, :table_name, unique: true
    add_index :data_retention_settings, :is_active

    # デフォルト設定を挿入
    execute <<-SQL
      INSERT INTO data_retention_settings (table_name, retention_years, archive_before_delete, description, created_at, updated_at) VALUES
      ('attendances', 3, true, '勤怠データは3年間保持', NOW(), NOW()),
      ('schedule_entries', 3, true, 'スケジュールデータは3年間保持', NOW(), NOW()),
      ('paid_leave_records', 7, true, '有給記録は7年間保持（法的要件）', NOW(), NOW()),
      ('paid_leave_calculation_logs', 5, true, '有給計算ログは5年間保持', NOW(), NOW());
    SQL
  end
end
