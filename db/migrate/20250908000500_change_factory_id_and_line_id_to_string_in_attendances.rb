class ChangeFactoryIdAndLineIdToStringInAttendances < ActiveRecord::Migration[8.0]
  def up
    # 外部キー制約を一時的に削除
    remove_foreign_key :attendances, :factories
    remove_foreign_key :attendances, :lines
    
    # カラムの型を変更
    change_column :attendances, :factory_id, :string
    change_column :attendances, :line_id, :string
  end

  def down
    # カラムの型を元に戻す
    change_column :attendances, :factory_id, :bigint
    change_column :attendances, :line_id, :bigint
    
    # 外部キー制約を再追加
    add_foreign_key :attendances, :factories, column: :factory_id, primary_key: :id
    add_foreign_key :attendances, :lines, column: :line_id, primary_key: :id
  end
end
