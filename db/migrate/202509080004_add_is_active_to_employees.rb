class AddIsActiveToEmployees < ActiveRecord::Migration[7.0]
  def change
    add_column :employees, :is_active, :boolean, default: true, null: false
  end
end
