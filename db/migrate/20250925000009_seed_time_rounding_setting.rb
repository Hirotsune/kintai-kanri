class SeedTimeRoundingSetting < ActiveRecord::Migration[7.0]
  def up
    # 時間刻み設定の初期値（15分刻み）
    execute <<-SQL
      INSERT INTO system_settings (key, value, description, created_at, updated_at)
      VALUES ('time_rounding_mode', '15', '勤務時間の計算に使用する刻み時間（15=15分刻み, 10=10分刻み, 5=5分刻み, 1=1分刻み）', NOW(), NOW());
    SQL
  end

  def down
    execute "DELETE FROM system_settings WHERE key = 'time_rounding_mode';"
  end
end
