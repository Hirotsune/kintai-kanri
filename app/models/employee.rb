class Employee < ApplicationRecord
  belongs_to :line, primary_key: :line_id, foreign_key: :line_id
  belongs_to :factory, primary_key: :factory_id, foreign_key: :factory_id
  
  # バリデーション
  validates :employee_id, presence: true, uniqueness: true
  validates :name, presence: true
  validates :name_kana, format: { 
    with: /\A[あ-ん・\s　]+\z/, 
    message: "ひらがなで入力してください" 
  }, allow_blank: true
  validates :department, presence: true
  validates :line_id, presence: true
  validates :factory_id, presence: true
  validates :status, presence: true, inclusion: { in: %w[active inactive] }
  validates :is_active, inclusion: { in: [true, false] }
  validates :position, presence: true
  validates :position_name, presence: true
  validates :hire_date, presence: true
  validates :paid_leave_days, numericality: { greater_than_or_equal_to: 0 }
  validates :used_paid_leave_days, numericality: { greater_than_or_equal_to: 0 }
  validates :remaining_paid_leave_days, numericality: { greater_than_or_equal_to: 0 }
  
  # 関連
  has_many :attendances, dependent: :destroy
  has_many :paid_leave_records, dependent: :destroy
  has_many :paid_leave_calculation_logs, dependent: :destroy
  has_many :schedule_entries, primary_key: :employee_id, foreign_key: :employee_id, dependent: :destroy
  
  # スコープ
  scope :active, -> { where(status: 'active') }
  scope :inactive, -> { where(status: 'inactive') }
  scope :active_records, -> { where(is_active: true) }
  scope :by_position, ->(position) { where(position: position) }
  scope :with_allowance_eligible, ->(allowance_type) { where("#{allowance_type}_allowance_eligible" => true) }
  
  # 役職関連のメソッド
  def position_setting
    @position_setting ||= PositionSetting.find_by_position_code(position)
  end

  def update_position!(new_position, new_position_name)
    return if position == new_position

    # 役職変更履歴を記録
    update!(
      previous_position: position,
      position: new_position,
      position_name: new_position_name,
      position_changed_at: Time.current
    )

    # 新しい役職設定に基づいて手当て適用可否を更新
    update_allowance_eligibility!
  end

  def update_allowance_eligibility!
    return unless position_setting

    update!(
      overtime_allowance_eligible: position_setting.overtime_allowance_eligible,
      night_work_allowance_eligible: position_setting.night_work_allowance_eligible,
      holiday_work_allowance_eligible: position_setting.holiday_work_allowance_eligible,
      early_work_allowance_eligible: position_setting.early_work_allowance_eligible,
      night_shift_allowance_eligible: position_setting.night_shift_allowance_eligible
    )
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

  # 役職変更履歴があるかチェック
  def position_changed?
    position_changed_at.present?
  end

  # 現在の役職の階層レベルを取得
  def hierarchy_level
    position_setting&.hierarchy_level || 1
  end

  def is_active?
    status == 'active'
  end

  # 有給関連のメソッド
  def calculate_paid_leave_days
    return 0 if hire_date.nil?
    
    years_of_service = (Date.current - hire_date) / 365.25
    
    case years_of_service
    when 0...0.5
      0
    when 0.5...1.5
      10
    when 1.5...2.5
      11
    when 2.5...3.5
      12
    when 3.5...4.5
      14
    when 4.5...5.5
      16
    when 5.5...6.5
      18
    else
      20
    end
  end

  def update_paid_leave_days!
    new_days = calculate_paid_leave_days
    previous_days = paid_leave_days
    
    if new_days != previous_days
      added_days = new_days - previous_days
      
      # 有給日数を更新
      update!(
        paid_leave_days: new_days,
        remaining_paid_leave_days: [remaining_paid_leave_days + added_days, 0].max,
        last_paid_leave_calculation_date: Date.current
      )
      
      # 計算ログを記録
      paid_leave_calculation_logs.create!(
        calculation_date: Date.current,
        previous_days: previous_days,
        new_days: new_days,
        added_days: added_days,
        calculation_reason: "勤続年数による自動計算"
      )
    end
  end

  def add_paid_leave_record!(leave_date, days = 1, reason = nil, notes = nil)
    # 有給取得記録を作成
    paid_leave_records.create!(
      leave_date: leave_date,
      days: days,
      reason: reason,
      status: 'approved',
      notes: notes,
      approved_by: 'system',
      approved_at: Time.current
    )
    
    # 使用済み日数と残日数を更新
    update!(
      used_paid_leave_days: used_paid_leave_days + days,
      remaining_paid_leave_days: [remaining_paid_leave_days - days, 0].max
    )
  end

  def years_of_service
    return 0 if hire_date.nil?
    (Date.current - hire_date) / 365.25
  end

  def next_paid_leave_increase_date
    return nil if hire_date.nil?
    
    years_of_service = (Date.current - hire_date) / 365.25
    
    case years_of_service
    when 0...0.5
      hire_date + 6.months
    when 0.5...1.5
      hire_date + 1.year + 6.months
    when 1.5...2.5
      hire_date + 2.years + 6.months
    when 2.5...3.5
      hire_date + 3.years + 6.months
    when 3.5...4.5
      hire_date + 4.years + 6.months
    when 4.5...5.5
      hire_date + 5.years + 6.months
    when 5.5...6.5
      hire_date + 6.years + 6.months
    else
      nil # 最大日数に達している
    end
  end
end