class ChangeLineIdAndFactoryIdToStringInEmployees < ActiveRecord::Migration[8.0]
  def up
    # 外部キー制約を一時的に削除
    remove_foreign_key :employees, :lines
    remove_foreign_key :employees, :factories
    
    # カラムの型を変更
    change_column :employees, :line_id, :string
    change_column :employees, :factory_id, :string
    
    # 既存データを更新（数値IDを文字列IDに変換）
    execute <<-SQL
      UPDATE employees 
      SET line_id = (
        SELECT lines.line_id 
        FROM lines 
        WHERE lines.id = employees.line_id::integer
      )
    SQL
    
    execute <<-SQL
      UPDATE employees 
      SET factory_id = (
        SELECT factories.factory_id 
        FROM factories 
        WHERE factories.id = employees.factory_id::integer
      )
    SQL
    
    # 一意性制約を追加（外部キー制約の前提条件）
    add_index :lines, :line_id, unique: true
    add_index :factories, :factory_id, unique: true
    
    # 外部キー制約を再追加（文字列IDを参照）
    add_foreign_key :employees, :lines, column: :line_id, primary_key: :line_id
    add_foreign_key :employees, :factories, column: :factory_id, primary_key: :factory_id
  end

  def down
    # 外部キー制約を削除
    remove_foreign_key :employees, :lines
    remove_foreign_key :employees, :factories
    
    # 一意性制約を削除
    remove_index :lines, :line_id
    remove_index :factories, :factory_id
    
    # カラムの型を元に戻す
    change_column :employees, :line_id, :bigint
    change_column :employees, :factory_id, :bigint
    
    # 外部キー制約を再追加（数値IDを参照）
    add_foreign_key :employees, :lines, column: :line_id, primary_key: :id
    add_foreign_key :employees, :factories, column: :factory_id, primary_key: :id
  end
end
