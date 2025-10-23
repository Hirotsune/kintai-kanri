class CreateOfflineChanges < ActiveRecord::Migration[8.0]
  def change
    create_table :offline_changes do |t|
      t.string :table_name, null: false
      t.string :operation, null: false # 'create', 'update', 'delete'
      t.string :record_id
      t.jsonb :data, null: false
      t.jsonb :original_data
      t.string :status, default: 'pending' # 'pending', 'synced', 'failed'
      t.datetime :synced_at
      t.text :error_message
      t.integer :retry_count, default: 0
      t.timestamps
    end

    add_index :offline_changes, [:status, :created_at]
    add_index :offline_changes, [:table_name, :operation]
    add_index :offline_changes, :data, using: :gin
  end
end
