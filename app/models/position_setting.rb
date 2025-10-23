class PositionSetting < ApplicationRecord
  validates :position_code, presence: true, uniqueness: true
  validates :position_name, presence: true
  validates :hierarchy_level, presence: true, numericality: { greater_than: 0 }
  validates :position_allowance, numericality: { greater_than_or_equal_to: 0 }
  validates :management_allowance, numericality: { greater_than_or_equal_to: 0 }

  scope :active, -> { where(is_active: true) }
  scope :by_hierarchy, ->(level) { where(hierarchy_level: level) }
  scope :ordered_by_hierarchy, -> { order(:hierarchy_level) }

  # 役職コードの定義
  POSITION_CODES = {
    'employee' => '一般社員',
    'manager' => '主任',
    'director' => '課長',
    'executive' => '部長'
  }.freeze

  def position_code_name
    POSITION_CODES[position_code] || position_code
  end

  # 指定された手当てタイプが適用可能かチェック
  def allowance_eligible?(allowance_type)
    case allowance_type
    when 'overtime'
      overtime_allowance_eligible?
    when 'night_work'
      night_work_allowance_eligible?
    when 'holiday_work'
      holiday_work_allowance_eligible?
    when 'early_work'
      early_work_allowance_eligible?
    when 'night_shift'
      night_shift_allowance_eligible?
    else
      false
    end
  end

  # 適用可能な手当てタイプのリストを取得
  def eligible_allowance_types
    eligible_types = []
    eligible_types << 'overtime' if overtime_allowance_eligible?
    eligible_types << 'night_work' if night_work_allowance_eligible?
    eligible_types << 'holiday_work' if holiday_work_allowance_eligible?
    eligible_types << 'early_work' if early_work_allowance_eligible?
    eligible_types << 'night_shift' if night_shift_allowance_eligible?
    eligible_types
  end

  # 総手当て金額を計算
  def total_allowance_amount
    position_allowance + management_allowance
  end

  # 階層レベルに基づく役職名を取得
  def self.find_by_hierarchy_level(level)
    find_by(hierarchy_level: level, is_active: true)
  end

  # 役職コードに基づく設定を取得
  def self.find_by_position_code(code)
    find_by(position_code: code, is_active: true)
  end

  # 全手当て適用可能な役職を取得
  def self.fully_eligible_positions
    where(
      overtime_allowance_eligible: true,
      night_work_allowance_eligible: true,
      holiday_work_allowance_eligible: true,
      early_work_allowance_eligible: true,
      night_shift_allowance_eligible: true,
      is_active: true
    )
  end

  # 手当て適用制限がある役職を取得
  def self.restricted_positions
    where(is_active: true).select do |position|
      !position.eligible_allowance_types.include?('overtime') ||
      !position.eligible_allowance_types.include?('night_work') ||
      !position.eligible_allowance_types.include?('holiday_work') ||
      !position.eligible_allowance_types.include?('early_work') ||
      !position.eligible_allowance_types.include?('night_shift')
    end
  end
end
