class CreateSystemSettings < ActiveRecord::Migration[7.0]
  def change
    create_table :system_settings do |t|
      t.string :key, null: false
      t.string :value, null: false
      t.text :description
      
      t.timestamps
    end
    
    add_index :system_settings, :key, unique: true
  end
end
