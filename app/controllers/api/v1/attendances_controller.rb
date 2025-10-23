class Api::V1::AttendancesController < ApplicationController
  before_action :set_attendance, only: [:show, :update, :destroy]

  # GET /api/v1/attendances
  def index
    @attendances = Attendance.all
    render json: @attendances
  end

  # GET /api/v1/attendances/:id
  def show
    render json: @attendance
  end

  # POST /api/v1/attendances
  def create
    @attendance = Attendance.new(attendance_params)
    
    if @attendance.save
      render json: @attendance, status: :created
    else
      render json: { errors: @attendance.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/attendances/:id
  def update
    if @attendance.update(attendance_params)
      render json: @attendance
    else
      render json: { errors: @attendance.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/attendances/:id
  def destroy
    @attendance.destroy
    head :no_content
  end

  # GET /api/v1/attendances/employee/:employee_id/date/:date (横型テーブル対応)
  def get_by_employee_and_date
    employee_id = params[:employee_id]
    date = params[:date]
    
    # 従業員の存在確認
    employee = Employee.find_by(employee_id: employee_id)
    unless employee
      return render json: { error: '従業員IDが見つかりません' }, status: :not_found
    end
    
    # 指定日の勤怠データを取得（横型テーブルでは1行に1日分のデータ）
    attendances = Attendance.where(
      employee_id: employee_id,
      work_date: date
    )
    
    render json: attendances
  end

  # POST /api/v1/attendances/punch (横型テーブル対応)
  def punch
    employee_id = params[:employee_id]
    punch_type = params[:punch_type]
    factory_id_str = params[:factory_id]
    line_id_str = params[:line_id]
    
    # 従業員の存在確認
    employee = Employee.find_by(employee_id: employee_id)
    unless employee
      return render json: { error: '従業員IDが見つかりません' }, status: :not_found
    end
    
    # 従業員のステータス確認
    unless employee.is_active?
      return render json: { error: 'この従業員IDは現在無効です' }, status: :unprocessable_entity
    end
    
    # 工場の存在確認
    factory = Factory.find_by(factory_id: factory_id_str)
    unless factory
      return render json: { error: '工場IDが見つかりません' }, status: :not_found
    end
    
    # ラインの存在確認
    line = Line.find_by(line_id: line_id_str)
    unless line
      return render json: { error: 'ラインIDが見つかりません' }, status: :not_found
    end
    
    today = Date.current
    current_time = Time.zone.now.strftime('%H:%M:%S')
    
    # 時間の丸め処理を行う関数（過去データ流し込み時のルールに基づく）
    def round_punch_time(punch_time, punch_type, minutes)
      return nil if punch_time.nil?
      
      time = punch_time.to_time
      hour = time.hour
      min = time.min
      
      case punch_type
      when '出社'
        # 出社：切り上げ
        rounded_min = ((min.to_f / minutes).ceil * minutes) % 60
        if rounded_min == 0 && min > 0
          hour += 1
        end
      when '昼休出１', '昼休出２'
        # 昼休出：切り下げ
        rounded_min = (min / minutes) * minutes
      when '昼休入１'
        # 昼休入1：1時間以内は1時間扱い、超過時は切り上げ
        if punch_time.hour == 13 && punch_time.min <= 59
          hour = 14
          rounded_min = 0
        else
          rounded_min = ((min.to_f / minutes).ceil * minutes) % 60
          if rounded_min == 0 && min > 0
            hour += 1
          end
        end
      when '昼休入２'
        # 昼休入2：切り上げ
        rounded_min = ((min.to_f / minutes).ceil * minutes) % 60
        if rounded_min == 0 && min > 0
          hour += 1
        end
      when '退社'
        # 退社：切り下げ
        rounded_min = (min / minutes) * minutes
      else
        rounded_min = (min / minutes) * minutes
      end
      
      if rounded_min >= 60
        hour += 1
        rounded_min = 0
      end
      
      if minutes == 1
        rounded_min = min
      end
      
      Time.new(time.year, time.month, time.day, hour, rounded_min, 0)
    end
    
    # 横型テーブル用の打刻処理
    # 既存の勤怠レコードを取得または作成
    attendance = Attendance.find_or_initialize_by(
      employee_id: employee_id,
      work_date: today
    )
    
    # 既存レコードがない場合は基本情報を設定
    if attendance.new_record?
      attendance.factory_id = factory_id_str
      attendance.line_id = line_id_str
      attendance.employee_name = employee.name
      attendance.shift_type = 'morning'
    else
      # 既存レコードの場合も、ライン選択が必要な打刻タイプの場合はline_idを更新
      if ['退社', '昼休入１', '昼休入２'].include?(punch_type)
        attendance.line_id = line_id_str
      end
    end
    
    # 打刻タイプに応じて対応する時間フィールドを更新（刻み時間も同時に登録）
    case punch_type
    when '出社'
      if attendance.clock_in_time.present?
        return render json: { 
          success: false, 
          error: "❌ 重複打刻エラー\n\n本日は既に「#{punch_type}」の打刻が完了しています。\n\n💡 次に打刻可能な項目を確認してください。"
        }, status: :unprocessable_entity
      end
      attendance.clock_in_time = current_time
      attendance.clock_in_line_id = line_id_str  # 出社時のラインIDを保存
      # 刻み時間も同時に登録
      attendance.clock_in_rounded_15min = round_punch_time(Time.parse(current_time), punch_type, 15).strftime('%H:%M:%S')
      attendance.clock_in_rounded_10min = round_punch_time(Time.parse(current_time), punch_type, 10).strftime('%H:%M:%S')
      attendance.clock_in_rounded_5min = round_punch_time(Time.parse(current_time), punch_type, 5).strftime('%H:%M:%S')
      attendance.clock_in_rounded_1min = round_punch_time(Time.parse(current_time), punch_type, 1).strftime('%H:%M:%S')
    when '昼休出１'
      if attendance.lunch_out1_time.present?
        return render json: { 
          success: false, 
          error: "❌ 重複打刻エラー\n\n本日は既に「#{punch_type}」の打刻が完了しています。\n\n💡 次に打刻可能な項目を確認してください。"
        }, status: :unprocessable_entity
      end
      attendance.lunch_out1_time = current_time
      # 刻み時間も同時に登録
      attendance.lunch_out1_15min = round_punch_time(Time.parse(current_time), punch_type, 15).strftime('%H:%M:%S')
      attendance.lunch_out1_10min = round_punch_time(Time.parse(current_time), punch_type, 10).strftime('%H:%M:%S')
      attendance.lunch_out1_5min = round_punch_time(Time.parse(current_time), punch_type, 5).strftime('%H:%M:%S')
      attendance.lunch_out1_1min = round_punch_time(Time.parse(current_time), punch_type, 1).strftime('%H:%M:%S')
    when '昼休入１'
      if attendance.lunch_in1_time.present?
        return render json: { 
          success: false, 
          error: "❌ 重複打刻エラー\n\n本日は既に「#{punch_type}」の打刻が完了しています。\n\n💡 次に打刻可能な項目を確認してください。"
        }, status: :unprocessable_entity
      end
      attendance.lunch_in1_time = current_time
      attendance.lunch_in1_line_id = line_id_str  # 昼休入1時のラインIDを保存
      # 刻み時間も同時に登録
      attendance.lunch_in1_15min = round_punch_time(Time.parse(current_time), punch_type, 15).strftime('%H:%M:%S')
      attendance.lunch_in1_10min = round_punch_time(Time.parse(current_time), punch_type, 10).strftime('%H:%M:%S')
      attendance.lunch_in1_5min = round_punch_time(Time.parse(current_time), punch_type, 5).strftime('%H:%M:%S')
      attendance.lunch_in1_1min = round_punch_time(Time.parse(current_time), punch_type, 1).strftime('%H:%M:%S')
    when '昼休出２'
      if attendance.lunch_out2_time.present?
        return render json: { 
          success: false, 
          error: "❌ 重複打刻エラー\n\n本日は既に「#{punch_type}」の打刻が完了しています。\n\n💡 次に打刻可能な項目を確認してください。"
        }, status: :unprocessable_entity
      end
      attendance.lunch_out2_time = current_time
      # 刻み時間も同時に登録
      attendance.lunch_out2_15min = round_punch_time(Time.parse(current_time), punch_type, 15).strftime('%H:%M:%S')
      attendance.lunch_out2_10min = round_punch_time(Time.parse(current_time), punch_type, 10).strftime('%H:%M:%S')
      attendance.lunch_out2_5min = round_punch_time(Time.parse(current_time), punch_type, 5).strftime('%H:%M:%S')
      attendance.lunch_out2_1min = round_punch_time(Time.parse(current_time), punch_type, 1).strftime('%H:%M:%S')
    when '昼休入２'
      if attendance.lunch_in2_time.present?
        return render json: { 
          success: false, 
          error: "❌ 重複打刻エラー\n\n本日は既に「#{punch_type}」の打刻が完了しています。\n\n💡 次に打刻可能な項目を確認してください。"
        }, status: :unprocessable_entity
      end
      attendance.lunch_in2_time = current_time
      attendance.lunch_in2_line_id = line_id_str  # 昼休入2時のラインIDを保存
      # 刻み時間も同時に登録
      attendance.lunch_in2_15min = round_punch_time(Time.parse(current_time), punch_type, 15).strftime('%H:%M:%S')
      attendance.lunch_in2_10min = round_punch_time(Time.parse(current_time), punch_type, 10).strftime('%H:%M:%S')
      attendance.lunch_in2_5min = round_punch_time(Time.parse(current_time), punch_type, 5).strftime('%H:%M:%S')
      attendance.lunch_in2_1min = round_punch_time(Time.parse(current_time), punch_type, 1).strftime('%H:%M:%S')
    when '退社'
      if attendance.clock_out_time.present?
      return render json: { 
        success: false, 
        error: "❌ 重複打刻エラー\n\n本日は既に「#{punch_type}」の打刻が完了しています。\n\n💡 次に打刻可能な項目を確認してください。"
      }, status: :unprocessable_entity
    end
      attendance.clock_out_time = current_time
      attendance.clock_out_line_id = line_id_str  # 退社時のラインIDを保存
      # 刻み時間も同時に登録
      attendance.clock_out_rounded_15min = round_punch_time(Time.parse(current_time), punch_type, 15).strftime('%H:%M:%S')
      attendance.clock_out_rounded_10min = round_punch_time(Time.parse(current_time), punch_type, 10).strftime('%H:%M:%S')
      attendance.clock_out_rounded_5min = round_punch_time(Time.parse(current_time), punch_type, 5).strftime('%H:%M:%S')
      attendance.clock_out_rounded_1min = round_punch_time(Time.parse(current_time), punch_type, 1).strftime('%H:%M:%S')
      
      # 勤務時間計算と残業時間算出
      calculate_work_time_and_overtime(attendance)
    else
      return render json: { 
        success: false, 
        error: "無効な打刻タイプです: #{punch_type}"
      }, status: :unprocessable_entity
    end
    
    if attendance.save
      render json: { 
        success: true, 
        message: "#{punch_type}打刻が完了しました",
        attendance: attendance
      }
    else
      render json: { 
        success: false, 
        errors: attendance.errors.full_messages 
      }, status: :unprocessable_entity
    end
  end

  private

  def set_attendance
    # 複合主キー対応: employee_id と work_date で検索
    if params[:id].present?
      # 単一のIDが渡された場合は、employee_idとして扱う
      @attendance = Attendance.where(employee_id: params[:id]).first
    else
      # employee_id と work_date が別々に渡された場合
      @attendance = Attendance.where(
        employee_id: params[:employee_id], 
        work_date: params[:work_date]
      ).first
    end
    
    unless @attendance
    render json: { error: '勤怠データが見つかりません' }, status: :not_found
    end
  end

  def attendance_params
    params.require(:attendance).permit(:employee_id, :punch_time, :punch_type, :work_date, :factory_id, :line_id, :shift_type)
  end

  # 勤務時間計算と残業時間算出メソッド
  def calculate_work_time_and_overtime(attendance)
    return unless attendance.clock_in_time.present? && attendance.clock_out_time.present?
    
    # 各刻みでの勤務時間を計算
    [15, 10, 5, 1].each do |minutes|
      # 出社時間（丸め済み）
      clock_in_rounded = case minutes
      when 15 then attendance.clock_in_rounded_15min
      when 10 then attendance.clock_in_rounded_10min
      when 5 then attendance.clock_in_rounded_5min
      when 1 then attendance.clock_in_rounded_1min
      end
      
      # 退社時間（丸め済み）
      clock_out_rounded = case minutes
      when 15 then attendance.clock_out_rounded_15min
      when 10 then attendance.clock_out_rounded_10min
      when 5 then attendance.clock_out_rounded_5min
      when 1 then attendance.clock_out_rounded_1min
      end
      
      next unless clock_in_rounded.present? && clock_out_rounded.present?
      
      # 時間計算
      start_time = Time.parse("#{attendance.work_date} #{clock_in_rounded}")
      end_time = Time.parse("#{attendance.work_date} #{clock_out_rounded}")
      
      # 昼休時間を考慮した実労働時間を計算（刻み毎の丸め済み時間を使用）
      total_work_minutes = calculate_actual_work_time_with_rounding(start_time, end_time, attendance, minutes)
      
      # 各刻みの勤務時間を保存（分単位）
      case minutes
      when 15
        attendance.total_work_time_15min = total_work_minutes
      when 10
        attendance.total_work_time_10min = total_work_minutes
      when 5
        attendance.total_work_time_5min = total_work_minutes
      when 1
        attendance.total_work_time_1min = total_work_minutes
      end
      
      # 8時間（480分）を超える場合は残業時間を計算（分単位）
      if total_work_minutes > 480
        overtime_minutes = total_work_minutes - 480
        
        case minutes
        when 15
          attendance.overtime_15min = overtime_minutes
        when 10
          attendance.overtime_10min = overtime_minutes
        when 5
          attendance.overtime_5min = overtime_minutes
        when 1
          attendance.overtime_1min = overtime_minutes
        end
      else
        # 8時間以下の場合は残業時間を0に設定
        case minutes
        when 15
          attendance.overtime_15min = 0
        when 10
          attendance.overtime_10min = 0
        when 5
          attendance.overtime_5min = 0
        when 1
          attendance.overtime_1min = 0
        end
      end
    end
  end

  # 実労働時間計算メソッド（刻み毎の丸め済み時間を使用）
  def calculate_actual_work_time_with_rounding(start_time, end_time, attendance, minutes)
    total_minutes = ((end_time - start_time) / 60).to_i
    
    # 昼休時間を差し引く（刻み毎の丸め済み時間を使用）
    lunch_break_minutes = 0
    
    # 昼休出1と昼休入1がある場合
    if attendance.lunch_out1_time.present? && attendance.lunch_in1_time.present?
      # 刻み毎の丸め済み時間を取得
      lunch_out1_rounded = case minutes
      when 15 then attendance.lunch_out1_15min
      when 10 then attendance.lunch_out1_10min
      when 5 then attendance.lunch_out1_5min
      when 1 then attendance.lunch_out1_1min
      end
      
      lunch_in1_rounded = case minutes
      when 15 then attendance.lunch_in1_15min
      when 10 then attendance.lunch_in1_10min
      when 5 then attendance.lunch_in1_5min
      when 1 then attendance.lunch_in1_1min
      end
      
      if lunch_out1_rounded.present? && lunch_in1_rounded.present?
        lunch_out1 = Time.parse("#{attendance.work_date} #{lunch_out1_rounded}")
        lunch_in1 = Time.parse("#{attendance.work_date} #{lunch_in1_rounded}")
        lunch_break_minutes += ((lunch_in1 - lunch_out1) / 60).to_i
      end
    end
    
    # 昼休出2と昼休入2がある場合
    if attendance.lunch_out2_time.present? && attendance.lunch_in2_time.present?
      # 刻み毎の丸め済み時間を取得
      lunch_out2_rounded = case minutes
      when 15 then attendance.lunch_out2_15min
      when 10 then attendance.lunch_out2_10min
      when 5 then attendance.lunch_out2_5min
      when 1 then attendance.lunch_out2_1min
      end
      
      lunch_in2_rounded = case minutes
      when 15 then attendance.lunch_in2_15min
      when 10 then attendance.lunch_in2_10min
      when 5 then attendance.lunch_in2_5min
      when 1 then attendance.lunch_in2_1min
      end
      
      if lunch_out2_rounded.present? && lunch_in2_rounded.present?
        lunch_out2 = Time.parse("#{attendance.work_date} #{lunch_out2_rounded}")
        lunch_in2 = Time.parse("#{attendance.work_date} #{lunch_in2_rounded}")
        lunch_break_minutes += ((lunch_in2 - lunch_out2) / 60).to_i
      end
    end
    
    # 実労働時間 = 総時間 - 昼休時間
    actual_work_minutes = total_minutes - lunch_break_minutes
    
    # 負の値にならないようにする
    [actual_work_minutes, 0].max
  end
end