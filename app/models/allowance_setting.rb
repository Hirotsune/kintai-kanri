class AllowanceSetting < ApplicationRecord
  validates :allowance_type, presence: true
  validates :name, presence: true
  validates :calculation_type, presence: true, inclusion: { in: %w[fixed rate] }
  validates :condition_type, presence: true
  validates :condition_value, presence: true
  validates :rate, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :fixed_amount, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  scope :active, -> { where(is_active: true) }
  scope :by_type, ->(type) { where(allowance_type: type) }
  scope :legal_requirements, -> { where(is_legal_requirement: true) }
  scope :company_allowances, -> { where(is_legal_requirement: false) }

  # 手当てタイプの定義
  ALLOWANCE_TYPES = {
    'overtime' => '時間外労働手当',
    'night_work' => '深夜労働手当',
    'holiday_work' => '休日労働手当',
    'early_work' => '早朝勤務手当',
    'night_shift' => '夜勤手当'
  }.freeze

  # 計算タイプの定義
  CALCULATION_TYPES = {
    'fixed' => '固定金額',
    'rate' => '割増率'
  }.freeze

  # 条件タイプの定義
  CONDITION_TYPES = {
    'time_range' => '時間帯',
    'hours' => '勤務時間',
    'shift' => 'シフト',
    'holiday' => '休日'
  }.freeze

  def allowance_type_name
    ALLOWANCE_TYPES[allowance_type] || allowance_type
  end

  def calculation_type_name
    CALCULATION_TYPES[calculation_type] || calculation_type
  end

  def condition_type_name
    CONDITION_TYPES[condition_type] || condition_type
  end

  # 指定された条件に合致する手当て設定を取得
  def self.find_applicable_allowances(allowance_type, conditions = {})
    active.by_type(allowance_type).select do |setting|
      setting.matches_conditions?(conditions)
    end
  end

  # 条件に合致するかチェック
  def matches_conditions?(conditions)
    case condition_type
    when 'time_range'
      time_in_range?(conditions[:time])
    when 'hours'
      hours_condition_met?(conditions[:hours])
    when 'shift'
      shift_condition_met?(conditions[:shift])
    when 'holiday'
      holiday_condition_met?(conditions[:is_holiday])
    else
      false
    end
  end

  private

  def time_in_range?(time)
    return false unless time && condition_value

    start_time, end_time = condition_value.split('-')
    return false unless start_time && end_time

    time_str = time.strftime('%H:%M')
    
    # 日をまたぐ場合の処理（例：22:00-05:00）
    if start_time > end_time
      time_str >= start_time || time_str <= end_time
    else
      time_str >= start_time && time_str <= end_time
    end
  end

  def hours_condition_met?(hours)
    return false unless hours && condition_value

    case condition_value
    when 'over_8_hours'
      hours > 8.0
    else
      false
    end
  end

  def shift_condition_met?(shift)
    return false unless shift && condition_value

    shift == condition_value
  end

  def holiday_condition_met?(is_holiday)
    return false unless is_holiday && condition_value

    case condition_value
    when 'statutory_holiday'
      is_holiday
    else
      false
    end
  end
end
