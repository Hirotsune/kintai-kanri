class ChangeFactoryIdToStringInLines < ActiveRecord::Migration[8.0]
  def up
    # 外部キー制約を一時的に削除
    remove_foreign_key :lines, :factories
    
    # カラムの型を変更
    change_column :lines, :factory_id, :string
    
    # 既存データを更新（数値IDを文字列factory_idに変換）
    execute <<-SQL
      UPDATE lines 
      SET factory_id = (
        SELECT factories.factory_id 
        FROM factories 
        WHERE factories.id = lines.factory_id::integer
      )
    SQL
  end

  def down
    # カラムの型を元に戻す
    change_column :lines, :factory_id, :bigint
    
    # 外部キー制約を再追加
    add_foreign_key :lines, :factories, column: :factory_id, primary_key: :id
  end
end
