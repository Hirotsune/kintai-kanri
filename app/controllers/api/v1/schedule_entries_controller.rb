class Api::V1::ScheduleEntriesController < ApplicationController
  before_action :set_schedule_entry, only: [:show, :update, :destroy]

  # GET /api/v1/schedule_entries
  def index
    # 勤怠シフト入力画面用の最適化クエリ
    @schedule_entries = ScheduleEntry.includes(:employee, :shift)
                                    .active
                                    .order(:employee_id, :schedule_date)
    
    # フィルタリング（インデックスを活用）
    @schedule_entries = @schedule_entries.for_employee(params[:employee_id]) if params[:employee_id].present?
    @schedule_entries = @schedule_entries.by_type(params[:schedule_type]) if params[:schedule_type].present?
    
    if params[:start_date].present? && params[:end_date].present?
      @schedule_entries = @schedule_entries.for_date_range(
        Date.parse(params[:start_date]), 
        Date.parse(params[:end_date])
      )
    end

    render json: @schedule_entries
  end

  # GET /api/v1/schedule_entries/:id
  def show
    render json: @schedule_entry
  end

  # POST /api/v1/schedule_entries
  def create
    # 勤怠シフト入力画面用の最適化処理
    employee_id = schedule_entry_params[:employee_id]
    schedule_date = Date.parse(schedule_entry_params[:schedule_date])
    
    # 既存のスケジュールを一括削除（論理削除）
    ScheduleEntry.where(
      employee_id: employee_id,
      schedule_date: schedule_date,
      is_active: true
    ).update_all(is_active: false)
    
    # 新しいスケジュールを作成
    @schedule_entry = ScheduleEntry.new(schedule_entry_params)
    @schedule_entry.created_by = 'admin' # TODO: 実際のユーザーIDに変更

    if @schedule_entry.save
      render json: @schedule_entry, status: :created
    else
      render json: { errors: @schedule_entry.errors }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/schedule_entries/:id
  def update
    if @schedule_entry.update(schedule_entry_params)
      render json: @schedule_entry
    else
      render json: { errors: @schedule_entry.errors }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/schedule_entries/:id
  def destroy
    @schedule_entry.update_column(:is_active, false)
    head :no_content
  end

  # POST /api/v1/schedule_entries/bulk_create
  def bulk_create
    @schedule_entries = []
    errors = []

    bulk_params[:entries].each do |entry_params|
      schedule_entry = ScheduleEntry.new(entry_params)
      schedule_entry.created_by = 'admin' # TODO: 実際のユーザーIDに変更
      
      if schedule_entry.save
        @schedule_entries << schedule_entry
      else
        errors << { entry: entry_params, errors: schedule_entry.errors }
      end
    end

    if errors.empty?
      render json: @schedule_entries, status: :created
    else
      render json: { 
        created: @schedule_entries, 
        errors: errors 
      }, status: :partial_content
    end
  end

  # POST /api/v1/schedule_entries/create_compensatory_holiday
  def create_compensatory_holiday
    begin
      @schedule_entry = ScheduleEntry.create_compensatory_holiday(
        compensatory_params[:employee_id],
        Date.parse(compensatory_params[:original_date]),
        Date.parse(compensatory_params[:compensatory_date]),
        compensatory_options
      )
      
      render json: @schedule_entry, status: :created
    rescue ArgumentError => e
      render json: { error: e.message }, status: :unprocessable_entity
    rescue ActiveRecord::RecordInvalid => e
      render json: { error: "振り替え休日の作成に失敗しました: #{e.record.errors.full_messages.join(', ')}" }, status: :unprocessable_entity
    rescue => e
      render json: { error: "振り替え休日の作成に失敗しました: #{e.message}" }, status: :internal_server_error
    end
  end

  # POST /api/v1/schedule_entries/create_substitute_holiday
  def create_substitute_holiday
    begin
      @schedule_entry = ScheduleEntry.create_substitute_holiday(
        substitute_params[:employee_id],
        Date.parse(substitute_params[:work_date]),
        substitute_options
      )
      
      render json: @schedule_entry, status: :created
    rescue ArgumentError => e
      render json: { error: e.message }, status: :unprocessable_entity
    rescue ActiveRecord::RecordInvalid => e
      render json: { error: "代休の作成に失敗しました: #{e.record.errors.full_messages.join(', ')}" }, status: :unprocessable_entity
    rescue => e
      render json: { error: "代休の作成に失敗しました: #{e.message}" }, status: :internal_server_error
    end
  end

  # GET /api/v1/schedule_entries/compensatory_holidays
  def compensatory_holidays
    @schedule_entries = ScheduleEntry.compensatory_holiday.active
    
    # フィルタリング
    @schedule_entries = @schedule_entries.for_employee(params[:employee_id]) if params[:employee_id].present?
    
    if params[:start_date].present? && params[:end_date].present?
      @schedule_entries = @schedule_entries.for_date_range(
        Date.parse(params[:start_date]), 
        Date.parse(params[:end_date])
      )
    end

    render json: @schedule_entries
  end

  # GET /api/v1/schedule_entries/substitute_holidays
  def substitute_holidays
    @schedule_entries = ScheduleEntry.substitute.active
    
    # フィルタリング
    @schedule_entries = @schedule_entries.for_employee(params[:employee_id]) if params[:employee_id].present?
    
    if params[:start_date].present? && params[:end_date].present?
      @schedule_entries = @schedule_entries.for_date_range(
        Date.parse(params[:start_date]), 
        Date.parse(params[:end_date])
      )
    end

    render json: @schedule_entries
  end

  # PATCH /api/v1/schedule_entries/:id/use_substitute
  def use_substitute
    @schedule_entry = ScheduleEntry.find(params[:id])
    
    unless @schedule_entry.substitute_holiday?
      render json: { error: "代休レコードではありません" }, status: :unprocessable_entity
      return
    end

    if @schedule_entry.update(status: 'confirmed', approved_by: 'admin', approved_at: Time.current)
      render json: @schedule_entry
    else
      render json: { errors: @schedule_entry.errors }, status: :unprocessable_entity
    end
  end

  private

  def set_schedule_entry
    @schedule_entry = ScheduleEntry.find(params[:id])
  end

  def schedule_entry_params
    params.require(:schedule_entry).permit(
      :employee_id, :schedule_date, :schedule_type, :shift_id, 
      :leave_type, :start_time, :end_time, :reason, :status, 
      :approved_by, :approved_at, :notes, :is_compensatory,
      :original_date, :compensatory_type, :allowance_override, :business_rules
    )
  end

  def bulk_params
    params.permit(entries: [
      :employee_id, :schedule_date, :schedule_type, :shift_id, 
      :leave_type, :start_time, :end_time, :reason, :status, 
      :approved_by, :approved_at, :notes, :is_compensatory,
      :original_date, :compensatory_type, :allowance_override, :business_rules
    ])
  end

  def compensatory_params
    params.require(:compensatory_holiday).permit(:employee_id, :original_date, :compensatory_date)
  end

  def compensatory_options
    params.require(:compensatory_holiday).permit(
      :exemption_type, :approval_required, :custom_allowance_rate, 
      :valid_until, :notes, :created_by
    ).to_h.symbolize_keys
  end

  def substitute_params
    params.require(:substitute_holiday).permit(:employee_id, :work_date)
  end

  def substitute_options
    params.require(:substitute_holiday).permit(
      :substitute_date, :allowance_rate, :expiry_days, 
      :auto_approve, :created_by, :notes
    ).to_h.symbolize_keys
  end
end
