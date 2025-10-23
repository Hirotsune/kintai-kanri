class DeviceConfig < ApplicationRecord
  validates :device_id, presence: true, uniqueness: true
  validates :device_name, presence: true
  validates :device_type, inclusion: { in: %w[kiosk admin mobile] }
  validates :device_id, format: { 
    with: /\A[a-zA-Z0-9_]+\z/, 
    message: "英数字とアンダースコアのみ使用可能です" 
  }
  validates :device_id, length: { maximum: 20 }

  # ボタン設定のJSON処理
  def punch_buttons
    JSON.parse(self.punch_buttons_config || '[]')
  end
  
  def punch_buttons=(buttons)
    self.punch_buttons_config = buttons.to_json
  end

  # ラインID設定のJSON処理
  def line_ids
    JSON.parse(self.line_ids_config || '[]')
  end
  
  def line_ids=(ids)
    self.line_ids_config = ids.to_json
  end

  # 表示するライン情報を取得
  def display_lines
    return [] if line_ids.empty?
    
    Line.where(id: line_ids).order(:id)
  end

  # シフト入力機能の設定
  def shift_input_enabled?
    shift_input_enabled
  end

  def set_shift_input_enabled(enabled)
    update!(shift_input_enabled: enabled)
  end

  # デフォルト設定
  def self.default_config(device_type)
    case device_type
    when 'kiosk'
      {
        show_factory_selection: false,
        show_line_selection: true,
        punch_buttons: ['出社', '退社'],
        shift_input_enabled: false
      }
    when 'admin'
      {
        show_factory_selection: true,
        show_line_selection: true,
        punch_buttons: ['出社', '昼休出1', '昼休入1', '昼休出2', '昼休入2', '退社'],
        shift_input_enabled: false
      }
    when 'mobile'
      {
        show_factory_selection: false,
        show_line_selection: false,
        punch_buttons: ['出社', '退社'],
        shift_input_enabled: false
      }
    else
      {
        show_factory_selection: false,
        show_line_selection: false,
        punch_buttons: ['出社', '退社'],
        shift_input_enabled: false
      }
    end
  end
end

