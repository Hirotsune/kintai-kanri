class AddShiftInputToDeviceConfigs < ActiveRecord::Migration[7.0]
  def change
    add_column :device_configs, :shift_input_enabled, :boolean, default: false, null: false
  end
end
