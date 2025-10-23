class AddNameKanaToEmployees < ActiveRecord::Migration[8.0]
  def change
    add_column :employees, :name_kana, :string, null: true, comment: '社員名（ひらがな）'
    
    # インデックスを追加（検索用）
    add_index :employees, :name_kana
  end
end

