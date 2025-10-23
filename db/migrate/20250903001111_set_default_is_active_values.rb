class SetDefaultIsActiveValues < ActiveRecord::Migration[7.0]
  def up
    # 既存のfactoriesにis_activeをtrueに設定
    execute "UPDATE factories SET is_active = true WHERE is_active IS NULL"
    
    # 既存のlinesにis_activeをtrueに設定
    execute "UPDATE lines SET is_active = true WHERE is_active IS NULL"
  end

  def down
    # ロールバック時は何もしない
  end
end