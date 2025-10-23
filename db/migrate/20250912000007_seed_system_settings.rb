class SeedSystemSettings < ActiveRecord::Migration[7.0]
  def up
    # シフト入力機能のデフォルト設定（OFF）
    SystemSetting.find_or_create_by(key: 'shift_input_enabled') do |setting|
      setting.value = 'false'
      setting.description = 'シフト入力機能のON/OFF設定'
    end
  end

  def down
    SystemSetting.where(key: 'shift_input_enabled').destroy_all
  end
end
