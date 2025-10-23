class SeedPositionSettings < ActiveRecord::Migration[7.0]
  def up
    # 一般社員（全手当て適用）
    execute <<-SQL
      INSERT INTO position_settings (position_code, position_name, hierarchy_level, overtime_allowance_eligible, night_work_allowance_eligible, holiday_work_allowance_eligible, early_work_allowance_eligible, night_shift_allowance_eligible, position_allowance, management_allowance, is_active, description, created_at, updated_at)
      VALUES ('employee', '一般社員', 1, true, true, true, true, true, 0, 0, true, '一般社員（全手当て適用）', NOW(), NOW());
    SQL
    
    # 主任（全手当て適用）
    execute <<-SQL
      INSERT INTO position_settings (position_code, position_name, hierarchy_level, overtime_allowance_eligible, night_work_allowance_eligible, holiday_work_allowance_eligible, early_work_allowance_eligible, night_shift_allowance_eligible, position_allowance, management_allowance, is_active, description, created_at, updated_at)
      VALUES ('manager', '主任', 2, true, true, true, true, true, 5000, 0, true, '主任（全手当て適用）', NOW(), NOW());
    SQL
    
    # 課長（時間外手当てのみ適用）
    execute <<-SQL
      INSERT INTO position_settings (position_code, position_name, hierarchy_level, overtime_allowance_eligible, night_work_allowance_eligible, holiday_work_allowance_eligible, early_work_allowance_eligible, night_shift_allowance_eligible, position_allowance, management_allowance, is_active, description, created_at, updated_at)
      VALUES ('director', '課長', 3, true, false, false, false, false, 15000, 10000, true, '課長（時間外手当てのみ適用）', NOW(), NOW());
    SQL
    
    # 部長（手当て適用なし）
    execute <<-SQL
      INSERT INTO position_settings (position_code, position_name, hierarchy_level, overtime_allowance_eligible, night_work_allowance_eligible, holiday_work_allowance_eligible, early_work_allowance_eligible, night_shift_allowance_eligible, position_allowance, management_allowance, is_active, description, created_at, updated_at)
      VALUES ('executive', '部長', 4, false, false, false, false, false, 30000, 20000, true, '部長（手当て適用なし）', NOW(), NOW());
    SQL
  end

  def down
    execute "DELETE FROM position_settings;"
  end
end
