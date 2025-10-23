class AddIsActiveToLines < ActiveRecord::Migration[8.0]
  def change
    add_column :lines, :is_active, :boolean, default: true, null: false
  end
end
