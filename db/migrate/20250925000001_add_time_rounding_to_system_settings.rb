class AddTimeRoundingToSystemSettings < ActiveRecord::Migration[7.0]
  def change
    add_column :system_settings, :time_rounding_mode, :integer, default: 15
    # 15 = 15分刻み, 10 = 10分刻み, 5 = 5分刻み, 1 = 1分刻み
  end
end
