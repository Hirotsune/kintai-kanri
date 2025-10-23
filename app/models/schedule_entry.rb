class ScheduleEntry < ApplicationRecord
  belongs_to :employee, foreign_key: 'employee_id', primary_key: 'employee_id'
  belongs_to :shift, optional: true

  validates :employee_id, presence: true
  validates :schedule_date, presence: true
        validates :schedule_type, presence: true, inclusion: { 
          in: %w[shift holiday paid_leave absence compensatory substitute condolence_leave holiday_work] 
        }
  validates :status, inclusion: { 
    in: %w[scheduled confirmed cancelled] 
  }
  validates :compensatory_type, inclusion: { 
    in: %w[substitute compensatory], allow_blank: true 
  }
  
  # カスタムバリデーション
  validate :prevent_double_compensatory
  validate :validate_compensatory_dates
  validate :validate_original_holiday

  scope :active, -> { where(is_active: true) }
  scope :for_employee, ->(employee_id) { where(employee_id: employee_id) }
  scope :for_date_range, ->(start_date, end_date) { 
    where(schedule_date: start_date..end_date) 
  }
  scope :by_type, ->(type) { where(schedule_type: type) }
  scope :compensatory, -> { where(is_compensatory: true) }
  scope :substitute, -> { where(compensatory_type: 'substitute') }
  scope :compensatory_holiday, -> { where(compensatory_type: 'compensatory') }

        def self.schedule_types
          {
            'shift' => 'シフト',
            'holiday' => '公休',
            'paid_leave' => '有給',
            'absence' => '欠勤',
            'compensatory' => '振休',
            'substitute' => '代休',
            'condolence_leave' => '慶弔',
            'holiday_work' => '休出'
          }
        end

  def schedule_type_name
    self.class.schedule_types[schedule_type] || schedule_type
  end

  def status_name
    {
      'scheduled' => '予定',
      'confirmed' => '確定',
      'cancelled' => 'キャンセル'
    }[status] || status
  end

  def time_range
    return nil unless start_time && end_time
    "#{start_time.strftime('%H:%M')} - #{end_time.strftime('%H:%M')}"
  end

  # 振り替え休日の作成（法的要件：事前通知が必要、割増賃金不要）
  def self.create_compensatory_holiday(employee_id, original_date, compensatory_date, options = {})
    # 二重振り替えチェック
    if self.compensatory_date_already_compensatory?(employee_id, compensatory_date)
      raise ArgumentError, "指定された日付（#{compensatory_date}）は既に振り替え休日として使用されています。振り替え休日の振り替えはできません。"
    end
    
    # 元の日付が振り替え休日でないことを確認
    if self.original_date_compensatory?(employee_id, original_date)
      raise ArgumentError, "元の日付（#{original_date}）は既に振り替え休日です。振り替え休日の振り替えはできません。"
    end
    
    # 元の日付が休日であることを確認
    unless self.valid_holiday_date?(original_date)
      raise ArgumentError, "元の日付（#{original_date}）は休日ではありません。振り替え休日は休日に対してのみ設定できます。"
    end
    
    create!(
      employee_id: employee_id,
      schedule_date: compensatory_date,
      schedule_type: 'compensatory',
      is_compensatory: true,
      original_date: original_date,
      compensatory_type: 'compensatory',
      status: 'scheduled',
      created_by: options[:created_by] || 'admin',
      business_rules: {
        exemption_type: options[:exemption_type] || 'full',  # 'full', 'partial', 'none'
        approval_required: options[:approval_required] || false,
        custom_allowance_rate: options[:custom_allowance_rate],
        valid_until: options[:valid_until],
        notes: options[:notes]
      }
    )
  end

  # 代休の作成（法的要件：事前指定不要、割増賃金必要）
  def self.create_substitute_holiday(employee_id, work_date, options = {})
    # 練習運用のため、元の日付の休日チェックを一時的に緩和
    # unless self.valid_holiday_date?(work_date)
    #   raise ArgumentError, "指定された日付（#{work_date}）は休日ではありません。代休は休日に出勤した場合にのみ設定できます。"
    # end
    
    # 代休を取得する日付を決定（substitute_dateが指定されている場合はそれを使用、そうでなければwork_dateを使用）
    substitute_date = options[:substitute_date] || work_date
    
    # 既に代休が設定されていないことを確認（代休を取得する日付でチェック）
    if self.substitute_already_exists?(employee_id, substitute_date)
      raise ArgumentError, "指定された日付（#{substitute_date}）には既に代休が設定されています。"
    end
    
    create!(
      employee_id: employee_id,
      schedule_date: substitute_date, # 代休を取得する日付
      schedule_type: 'substitute',
      compensatory_type: 'substitute',
      status: 'scheduled',
      created_by: options[:created_by] || 'admin',
      business_rules: {
        substitute_date: substitute_date,
        work_date: work_date, # 出勤した休日
        allowance_rate: options[:allowance_rate] || 0.35,
        expiry_days: options[:expiry_days] || 60, # 法的要件：1-2か月以内が一般的
        auto_approve: options[:auto_approve] || false,
        original_holiday_type: self.get_holiday_type(work_date),
        notes: options[:notes]
      }
    )
  end

  # 振り替え休日かどうか
  def compensatory_holiday?
    is_compensatory? && compensatory_type == 'compensatory'
  end

  # 代休かどうか
  def substitute_holiday?
    compensatory_type == 'substitute'
  end

  # 代休未取得かどうか
  def substitute_unused?
    substitute_holiday? && status == 'scheduled'
  end

  # 手当計算の上書き設定を取得
  def allowance_override_rate
    allowance_override['rate'] || 0.35
  end

  # 業務ルールの取得
  def business_rule(key)
    business_rules[key.to_s]
  end

  # 振り替え理由の取得
  def compensatory_reason
    business_rule('notes') || reason
  end

  # 有効期限の取得
  def valid_until
    business_rule('valid_until')&.to_date
  end

  # 有効期限切れかどうか
  def expired?
    return false unless valid_until
    Date.current > valid_until
  end

  private

  # 二重振り替え防止バリデーション
  def prevent_double_compensatory
    return unless schedule_type == 'compensatory' && is_compensatory?
    
    # 振り替え先の日付が既に振り替え休日でないかチェック
    if schedule_date && compensatory_date_already_compensatory?(employee_id, schedule_date)
      errors.add(:schedule_date, "指定された日付は既に振り替え休日として使用されています。振り替え休日の振り替えはできません。")
    end
    
    # 元の日付が振り替え休日でないかチェック
    if original_date && original_date_compensatory?(employee_id, original_date)
      errors.add(:original_date, "元の日付は既に振り替え休日です。振り替え休日の振り替えはできません。")
    end
  end

  # 振り替え日付の妥当性チェック
  def validate_compensatory_dates
    return unless schedule_type == 'compensatory' && is_compensatory?
    
    if original_date && schedule_date
      # 元の日付と振り替え日付が同じでないことを確認
      if original_date == schedule_date
        errors.add(:schedule_date, "振り替え先の日付は元の日付と異なる必要があります。")
      end
      
      # 振り替え日付が過去でないことを確認（法的要件：事前通知が必要）
      # 練習運用では過去の日付も許容するためコメントアウト
      # if schedule_date < Date.current
      #   errors.add(:schedule_date, "振り替え休日は事前に設定する必要があります。振り替え先の日付は今日以降である必要があります。")
      # end
    end
  end

  # 元の休日の妥当性チェック
  def validate_original_holiday
    return unless schedule_type.in?(['compensatory', 'substitute'])
    
    if schedule_type == 'compensatory' && original_date
      unless self.class.valid_holiday_date?(original_date)
        errors.add(:original_date, "元の日付は休日である必要があります。")
      end
    elsif schedule_type == 'substitute'
      # 代休の場合：振休と同じロジックでwork_date（出勤した休日）をチェック
      work_date = business_rule('work_date')
      if work_date
        unless self.class.valid_holiday_date?(Date.parse(work_date))
          errors.add(:business_rules, "出勤した日付は休日である必要があります。")
        end
      end
      
      # 代休の取得期限チェック（法的要件：適切な期間内での取得を推奨）
      validate_substitute_expiry
    end
  end
  
  # 代休の取得期限チェック
  def validate_substitute_expiry
    return unless schedule_type == 'substitute' && schedule_date
    
    # 練習運用では取得期限チェックを緩和するためコメントアウト
    # expiry_days = business_rule('expiry_days')&.to_i || 60 # デフォルト60日
    # expiry_date = schedule_date + expiry_days.days
    # 
    # if Date.current > expiry_date
    #   errors.add(:schedule_date, "代休の取得期限（#{expiry_days}日）を過ぎています。")
    # end
  end

  # 指定された日付が既に振り替え休日として使用されているかチェック
  def self.compensatory_date_already_compensatory?(employee_id, date)
    where(
      employee_id: employee_id,
      schedule_date: date,
      is_compensatory: true,
      compensatory_type: 'compensatory',
      is_active: true
    ).exists?
  end

  # 指定された日付が振り替え休日かどうかチェック
  def self.original_date_compensatory?(employee_id, date)
    where(
      employee_id: employee_id,
      schedule_date: date,
      is_compensatory: true,
      compensatory_type: 'compensatory',
      is_active: true
    ).exists?
  end

  # インスタンスメソッド版（バリデーション用）
  def compensatory_date_already_compensatory?(employee_id, date)
    self.class.compensatory_date_already_compensatory?(employee_id, date)
  end

  def original_date_compensatory?(employee_id, date)
    self.class.original_date_compensatory?(employee_id, date)
  end

  # 指定された日付が有効な休日かどうかチェック
  # 日配品会社では公休のみが休日
  def self.valid_holiday_date?(date)
    return false unless date.is_a?(Date)
    
    # 公休が設定されている日付のみを休日として扱う
    date_string = date.strftime('%Y-%m-%d')
    return true if where(schedule_date: date_string, schedule_type: 'holiday', is_active: true).exists?
    
    false
  end
  
  # 手動で祝日をチェック（HolidayJp gemが利用できない場合）
  def self.manual_holiday_check(date)
    year = date.year
    month = date.month
    day = date.day
    
    # 2025年の祝日
    holidays_2025 = [
      [1, 1],   # 元日
      [1, 13],  # 成人の日
      [2, 11],  # 建国記念の日
      [2, 23],  # 天皇誕生日
      [3, 20],  # 春分の日
      [4, 29],  # 昭和の日
      [5, 3],   # 憲法記念日
      [5, 4],   # みどりの日
      [5, 5],   # こどもの日
      [7, 21],  # 海の日
      [8, 11],  # 山の日
      [9, 15],  # 敬老の日
      [9, 23],  # 秋分の日
      [10, 13], # スポーツの日
      [11, 3],  # 文化の日
      [11, 23], # 勤労感謝の日
      [11, 24]  # 勤労感謝の日（振替休日）
    ]
    
    holidays_2025.include?([month, day])
  end

  # 休日の種類を取得
  def self.get_holiday_type(date)
    return 'sunday' if date.sunday?
    if defined?(HolidayJp)
      return 'national_holiday' if HolidayJp.holiday?(date)
    else
      return 'national_holiday' if manual_holiday_check(date)
    end
    'company_holiday'
  end

  # 代休が既に存在するかチェック
  def self.substitute_already_exists?(employee_id, substitute_date)
    where(
      employee_id: employee_id,
      schedule_date: substitute_date,
      schedule_type: 'substitute',
      compensatory_type: 'substitute',
      is_active: true
    ).exists?
  end

  # 元の休日の種類を取得（インスタンスメソッド）
  def original_holiday_type
    if schedule_type == 'compensatory' && original_date
      self.class.get_holiday_type(original_date)
    elsif schedule_type == 'substitute'
      business_rule('original_holiday_type')
    end
  end

  # 元の休日の説明を取得
  def original_holiday_description
    case original_holiday_type
    when 'sunday'
      '日曜日'
    when 'national_holiday'
      '祝日'
    when 'company_holiday'
      '会社休日'
    else
      '不明'
    end
  end
end
