class CreateFactories < ActiveRecord::Migration[8.0]
  def change
    create_table :factories do |t|
      t.string :factory_id
      t.string :name

      t.timestamps
    end
  end
end
