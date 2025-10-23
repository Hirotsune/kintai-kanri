class CreateAdminPasswords < ActiveRecord::Migration[7.0]
  def change
    create_table :admin_passwords do |t|
      t.string :password_digest, null: false
      t.string :description
      t.boolean :is_active, default: true
      t.timestamps
    end

    add_index :admin_passwords, :is_active
  end
end
