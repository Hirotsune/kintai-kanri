class CreateEmployees < ActiveRecord::Migration[8.0]
  def change
    create_table :employees do |t|
      t.string :employee_id
      t.string :name
      t.string :department
      t.references :line, null: false, foreign_key: true
      t.references :factory, null: false, foreign_key: true
      t.string :status

      t.timestamps
    end
  end
end
