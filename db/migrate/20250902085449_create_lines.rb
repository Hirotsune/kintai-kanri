class CreateLines < ActiveRecord::Migration[8.0]
  def change
    create_table :lines do |t|
      t.string :line_id
      t.string :name
      t.references :factory, null: false, foreign_key: true

      t.timestamps
    end
  end
end
