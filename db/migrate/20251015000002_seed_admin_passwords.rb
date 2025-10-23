class SeedAdminPasswords < ActiveRecord::Migration[7.0]
  def up
    # 管理者専用パスワードを作成（トップ画面用パスワードとは別）
    AdminPassword.create!(
      password: '3441',
      password_confirmation: '3441',
      description: '管理者専用パスワード',
      is_active: true
    )
  end

  def down
    AdminPassword.destroy_all
  end
end
