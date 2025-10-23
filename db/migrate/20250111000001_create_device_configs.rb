class CreateDeviceConfigs < ActiveRecord::Migration[7.0]
  def change
    create_table :device_configs do |t|
      t.string :device_id, null: false, index: { unique: true }
      t.string :device_name, null: false
      t.string :device_type, default: 'kiosk'
      t.string :location
      t.boolean :show_factory_selection, default: false
      t.boolean :show_line_selection, default: false
      t.text :punch_buttons_config
      t.text :line_ids_config # 表示するラインIDのリスト（JSON形式）

      t.timestamps
    end
  end
end

