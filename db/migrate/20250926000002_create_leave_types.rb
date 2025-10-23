class CreateLeaveTypes < ActiveRecord::Migration[8.0]
  def change
    create_table :leave_types do |t|
      t.string :name, null: false
      t.string :code, null: false
      t.text :description
      t.boolean :requires_approval, default: true
      t.boolean :is_paid, default: false
      t.boolean :is_active, default: true

      t.timestamps
    end

    add_index :leave_types, :code, unique: true
  end
end
