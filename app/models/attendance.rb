class Attendance < ApplicationRecord
  # 複合主キーの設定
  self.primary_key = [:employee_id, :work_date]
  
  # 関連付け
  belongs_to :employee, primary_key: :employee_id, foreign_key: :employee_id, optional: true
  belongs_to :factory, primary_key: :factory_id, foreign_key: :factory_id, optional: true
  belongs_to :line, primary_key: :line_id, foreign_key: :line_id, optional: true
  
  # 各打刻タイプごとのライン関連付け
  belongs_to :clock_in_line, class_name: 'Line', primary_key: :line_id, foreign_key: :clock_in_line_id, optional: true
  belongs_to :lunch_in1_line, class_name: 'Line', primary_key: :line_id, foreign_key: :lunch_in1_line_id, optional: true
  belongs_to :lunch_in2_line, class_name: 'Line', primary_key: :line_id, foreign_key: :lunch_in2_line_id, optional: true
  belongs_to :clock_out_line, class_name: 'Line', primary_key: :line_id, foreign_key: :clock_out_line_id, optional: true
  
  # バリデーション（横型データ用）
  validates :employee_id, presence: true
  validates :work_date, presence: true
  validates :factory_id, presence: true
  validates :line_id, presence: true
  # 一時的にshift_typeのバリデーションを無効化（CSVインポート用）
  # validates :shift_type, presence: true, inclusion: { in: %w[morning afternoon] }
  
  # 横型データでは punch_time と punch_type は不要
  # validates :punch_time, presence: true
  # validates :punch_type, presence: true, inclusion: { in: %w[出社 昼休出１ 昼休入１ 昼休出２ 昼休入２ 退社] }
  
  # スコープ
  scope :today, -> { where(work_date: Date.current) }
  scope :by_employee, ->(employee_id) { where(employee_id: employee_id.to_s) }
  scope :by_date, ->(date) { where(work_date: date) }
  scope :with_allowances, -> { where.not(total_allowance: 0) }
  scope :by_rounding_mode, ->(mode) { where("total_work_time_#{mode}min > 0") }
  
  # 重複チェック
  def self.duplicate_punch?(employee_id, punch_type, work_date)
    where(employee_id: employee_id.to_s, punch_type: punch_type, work_date: work_date).exists?
  end
  
  # 現在の状態を取得
  def self.current_status(employee_id, work_date = Date.current)
    today_attendance = where(employee_id: employee_id.to_s, work_date: work_date).order(:punch_time)
    
    return "未出社" if today_attendance.empty?
    
    last_punch = today_attendance.last
    
    # デバッグログ
    Rails.logger.info "=== 状態判定デバッグ ==="
    Rails.logger.info "従業員ID: #{employee_id}"
    Rails.logger.info "勤務日: #{work_date}"
    Rails.logger.info "打刻履歴: #{today_attendance.map(&:punch_type).join(' → ')}"
    Rails.logger.info "最後の打刻: #{last_punch.punch_type}"
    
    case last_punch.punch_type
    when "出社"
      "出社中"
    when "昼休出１"
      "昼休１中"
    when "昼休入１"
      "勤務中"
    when "昼休出２"
      "昼休２中"
    when "昼休入２"
      "勤務中"
    when "退社"
      "退社済"
    else
      "不明"
    end
  end
  
  # 打刻順序の妥当性チェック
  def self.validate_punch_sequence(employee_id, punch_type, work_date = Date.current)
    current_status = current_status(employee_id, work_date)
    
    # 打刻順序のルール
    valid_sequences = {
      "未出社" => ["出社"],
      "出社中" => ["昼休出１", "退社"],
      "昼休１中" => ["昼休入１"],
      "勤務中" => ["昼休出２", "退社"],
      "昼休２中" => ["昼休入２"],
      "退社済" => []
    }
    
    valid_punches = valid_sequences[current_status] || []
    
    if valid_punches.include?(punch_type)
      [true, "OK"]
    else
      if current_status == "退社済"
        [false, "❌ 既に退社済みです。本日の打刻は完了しています。"]
      else
        # 詳細なエラーメッセージを生成
        punch_flow = ["出社", "昼休出１", "昼休入１", "昼休出２", "昼休入２", "退社"]
        error_msg = "❌ 打刻順序エラー\n\n"
        error_msg += "📍 現在の状態: #{current_status}\n"
        error_msg += "🚫 無効な打刻: #{punch_type}\n\n"
        error_msg += "✅ 正しい打刻順序:\n"
        
        punch_flow.each_with_index do |step, i|
          if valid_punches.include?(step)
            error_msg += "   #{i + 1}. #{step} ← 次はこれです！\n"
          else
            error_msg += "   #{i + 1}. #{step}\n"
          end
        end
        
        error_msg += "\n💡 次に打刻可能: #{valid_punches.join(' または ')}"
        [false, error_msg]
      end
    end
  end

  # 時間刻み計算メソッド
  def self.round_time_to_minutes(time, minutes)
    return time if time.nil?
    
    hour = time.hour
    min = time.min
    sec = time.sec
    
    # 指定された分単位で切り上げ
    rounded_min = ((min + minutes - 1) / minutes) * minutes
    
    if rounded_min >= 60
      hour += 1
      rounded_min = 0
    end
    
    Time.new(time.year, time.month, time.day, hour, rounded_min, 0)
  end

  # 退勤時間を各刻みモードで計算
  def calculate_rounded_clock_out_times
    return if clock_out_time.nil?

    self.clock_out_rounded_15min = self.class.round_time_to_minutes(clock_out_time, 15)
    self.clock_out_rounded_10min = self.class.round_time_to_minutes(clock_out_time, 10)
    self.clock_out_rounded_5min = self.class.round_time_to_minutes(clock_out_time, 5)
    self.clock_out_rounded_1min = clock_out_time
  end

  # 残業時間を各刻みモードで計算
  def calculate_overtime_hours
    return if clock_out_time.nil? || clock_in_time.nil?

    # 基本労働時間（8時間）
    basic_work_hours = 8.0

    # 各刻みモードでの総労働時間を計算
    [15, 10, 5, 1].each do |minutes|
      rounded_clock_out = send("clock_out_rounded_#{minutes}min")
      next if rounded_clock_out.nil?

      total_work_time = calculate_total_work_time(clock_in_time, rounded_clock_out)
      overtime = [total_work_time - basic_work_hours, 0].max
      
      send("overtime_#{minutes}min=", overtime.round(2))
      send("total_work_time_#{minutes}min=", total_work_time.round(2))
    end
  end

  # 総労働時間を計算（休憩時間を考慮）
  def calculate_total_work_time(start_time, end_time)
    return 0 if start_time.nil? || end_time.nil?

    # 日をまたぐ場合の処理
    if end_time < start_time
      end_time += 1.day
    end

    total_minutes = (end_time - start_time) / 60.0

    # 休憩時間を差し引く（昼休出１、昼休入１、昼休出２、昼休入２の打刻から計算）
    break_time = calculate_break_time
    total_minutes -= break_time

    # 時間に変換
    total_minutes / 60.0
  end

  # 休憩時間を計算
  def calculate_break_time
    employee_attendances = self.class.where(
      employee_id: employee_id,
      work_date: work_date
    ).order(:punch_time)

    break_time = 0
    break_start = nil

    employee_attendances.each do |attendance|
      case attendance.punch_type
      when '昼休出１', '昼休出２'
        break_start = attendance.punch_time
      when '昼休入１', '昼休入２'
        if break_start
          break_time += (attendance.punch_time - break_start) / 60.0
          break_start = nil
        end
      end
    end

    break_time
  end

  # 手当て計算
  def calculate_allowances
    return unless employee

    # 各手当てタイプを計算
    calculate_overtime_allowance
    calculate_night_work_allowance
    calculate_holiday_work_allowance
    calculate_early_work_allowance
    calculate_night_shift_allowance

    # 合計手当てを計算
    self.total_legal_allowance = overtime_allowance + night_work_allowance + holiday_work_allowance
    self.total_company_allowance = early_work_allowance + night_shift_allowance
    self.total_allowance = total_legal_allowance + total_company_allowance
  end

  private

  def calculate_overtime_allowance
    return unless employee.allowance_eligible?('overtime')

    # 現在の時間刻みモードでの残業時間を取得（デフォルトは15分刻み）
    current_mode = '15' # デフォルト値を設定
    overtime_hours = send("overtime_#{current_mode}min") || 0

    if overtime_hours > 0
      # 法定割増率（25%）を適用
      hourly_rate = 1000 # 仮の時給（実際は従業員の時給を取得）
      self.overtime_allowance = (overtime_hours * hourly_rate * 0.25).round(2)
      self.overtime_hours = overtime_hours
    end
  end

  def calculate_night_work_allowance
    return unless employee.allowance_eligible?('night_work')

    # 深夜時間帯（22:00-05:00）の勤務時間を計算
    night_hours = calculate_night_work_hours
    if night_hours > 0
      hourly_rate = 1000 # 仮の時給
      self.night_work_allowance = (night_hours * hourly_rate * 0.25).round(2)
      self.night_work_hours = night_hours
    end
  end

  def calculate_holiday_work_allowance
    return unless employee.allowance_eligible?('holiday_work')

    # 振り替え休日の場合は割増不要（法的要件：事前通知により休日労働とみなされない）
    if is_compensatory_holiday?
      return
    end

    # 代休未取得の場合は35%割増（法的要件：代休取得後も割増賃金の支払い義務あり）
    if is_substitute_holiday_unused?
      apply_holiday_work_allowance(0.35)
      return
    end

    # 通常の休日労働
    if work_date.sunday? || HolidayJp.holiday?(work_date)
      apply_holiday_work_allowance(0.35)
    end
  end

  private

  def is_compensatory_holiday?
    # 振り替え休日の判定ロジック
    ScheduleEntry.exists?(
      employee_id: employee_id,
      schedule_date: work_date,
      is_compensatory: true,
      compensatory_type: 'compensatory',
      is_active: true
    )
  end

  def is_substitute_holiday_unused?
    # 代休未取得の判定ロジック
    ScheduleEntry.exists?(
      employee_id: employee_id,
      schedule_date: work_date,
      compensatory_type: 'substitute',
      status: 'scheduled',
      is_active: true
    )
  end

  def apply_holiday_work_allowance(rate)
    # デフォルトは15分刻み
    current_mode = '15'
    total_work_time = send("total_work_time_#{current_mode}min") || 0
    if total_work_time > 0
      hourly_rate = 1000 # 仮の時給（実際は従業員の時給を取得）
      self.holiday_work_allowance = (total_work_time * hourly_rate * rate).round(2)
      self.holiday_work_hours = total_work_time
    end
  end

  def calculate_early_work_allowance
    return unless employee.allowance_eligible?('early_work')

    # 早朝勤務手当の設定を取得
    early_work_settings = AllowanceSetting.find_applicable_allowances('early_work', { time: clock_in_time })
    
    early_work_settings.each do |setting|
      if setting.calculation_type == 'fixed'
        self.early_work_allowance += setting.fixed_amount
      end
    end
  end

  def calculate_night_shift_allowance
    return unless employee.allowance_eligible?('night_shift')

    # 夜勤シフトの場合は固定手当
    night_shift_settings = AllowanceSetting.find_applicable_allowances('night_shift')
    
    night_shift_settings.each do |setting|
      if setting.calculation_type == 'fixed'
        self.night_shift_allowance += setting.fixed_amount
      end
    end
  end

  def calculate_night_work_hours
    return 0 if clock_in_time.nil? || clock_out_time.nil?

    night_start = Time.new(clock_in_time.year, clock_in_time.month, clock_in_time.day, 22, 0, 0)
    night_end = Time.new(clock_in_time.year, clock_in_time.month, clock_in_time.day + 1, 5, 0, 0)

    # 深夜時間帯と勤務時間の重複部分を計算
    work_start = [clock_in_time, night_start].max
    work_end = [clock_out_time, night_end].min

    return 0 if work_start >= work_end

    (work_end - work_start) / 3600.0
  end
end