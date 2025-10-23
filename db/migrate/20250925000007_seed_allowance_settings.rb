class SeedAllowanceSettings < ActiveRecord::Migration[7.0]
  def up
    # 早朝勤務手当て
    execute <<-SQL
      INSERT INTO allowance_settings (allowance_type, name, rate, fixed_amount, calculation_type, condition_type, condition_value, is_legal_requirement, is_active, description, created_at, updated_at)
      VALUES ('early_work', '早朝勤務手当', 0, 3500, 'fixed', 'time_range', '05:00-06:00', false, true, '5時台出勤時の早朝勤務手当', NOW(), NOW());
    SQL
    
    execute <<-SQL
      INSERT INTO allowance_settings (allowance_type, name, rate, fixed_amount, calculation_type, condition_type, condition_value, is_legal_requirement, is_active, description, created_at, updated_at)
      VALUES ('early_work', '早朝勤務手当', 0, 1000, 'fixed', 'time_range', '06:00-07:00', false, true, '6時台出勤時の早朝勤務手当', NOW(), NOW());
    SQL
    
    execute <<-SQL
      INSERT INTO allowance_settings (allowance_type, name, rate, fixed_amount, calculation_type, condition_type, condition_value, is_legal_requirement, is_active, description, created_at, updated_at)
      VALUES ('night_work', '深夜勤務手当', 25.0, 0, 'rate', 'time_range', '22:00-05:00', true, true, '深夜時間帯の勤務手当（25%割増）', NOW(), NOW());
    SQL
    
    execute <<-SQL
      INSERT INTO allowance_settings (allowance_type, name, rate, fixed_amount, calculation_type, condition_type, condition_value, is_legal_requirement, is_active, description, created_at, updated_at)
      VALUES ('night_shift', '夜勤手当', 0, 5000, 'fixed', 'shift', '22:00-06:00', false, true, '夜勤シフト時の固定手当', NOW(), NOW());
    SQL
  end

  def down
    execute "DELETE FROM allowance_settings WHERE allowance_type IN ('early_work', 'night_work', 'night_shift');"
  end
end
