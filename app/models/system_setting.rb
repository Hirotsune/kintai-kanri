class SystemSetting < ApplicationRecord
  validates :key, presence: true, uniqueness: true
  validates :value, presence: true
  
  # シフト入力機能のON/OFF設定
  def self.shift_input_enabled?
    setting = find_by(key: 'shift_input_enabled')
    return false if setting.nil?  # 設定が存在しない場合はデフォルトでfalse
    setting.value == 'true'
  end
  
  def self.set_shift_input_enabled(enabled)
    setting = find_or_initialize_by(key: 'shift_input_enabled') do |s|
      s.description = 'シフト入力機能のON/OFF設定'
    end
    setting.value = enabled.to_s
    setting.save!
  end

  # 時間刻み設定
  def self.time_rounding_mode
    setting = find_by(key: 'time_rounding_mode')
    return 15 if setting.nil?  # デフォルトは15分刻み
    setting.value.to_i
  end

  def self.set_time_rounding_mode(mode)
    valid_modes = [1, 5, 10, 15]
    raise ArgumentError, "Invalid rounding mode: #{mode}" unless valid_modes.include?(mode)
    
    setting = find_or_initialize_by(key: 'time_rounding_mode') do |s|
      s.description = '勤務時間の計算に使用する刻み時間（15=15分刻み, 10=10分刻み, 5=5分刻み, 1=1分刻み）'
    end
    setting.value = mode.to_s
    setting.save!
  end

  # 時間刻みモードの選択肢
  def self.time_rounding_options
    [
      { value: 1, label: '1分刻み' },
      { value: 5, label: '5分刻み' },
      { value: 10, label: '10分刻み' },
      { value: 15, label: '15分刻み' }
    ]
  end

  # 時間刻みモード名を取得
  def self.time_rounding_mode_name(mode = nil)
    mode ||= time_rounding_mode
    option = time_rounding_options.find { |opt| opt[:value] == mode }
    option ? option[:label] : "#{mode}分刻み"
  end
end