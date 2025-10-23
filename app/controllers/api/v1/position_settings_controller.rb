class Api::V1::PositionSettingsController < ApplicationController
  before_action :set_position_setting, only: [:show, :update, :destroy]

  # GET /api/v1/position_settings
  def index
    @position_settings = PositionSetting.all.order(:hierarchy_level)
    render json: @position_settings
  end

  # GET /api/v1/position_settings/:id
  def show
    render json: @position_setting
  end

  # POST /api/v1/position_settings
  def create
    @position_setting = PositionSetting.new(position_setting_params)

    if @position_setting.save
      render json: @position_setting, status: :created
    else
      render json: { errors: @position_setting.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/position_settings/:id
  def update
    if @position_setting.update(position_setting_params)
      # 役職設定が変更された場合、関連する従業員の手当て適用可否を更新
      update_related_employees
      render json: @position_setting
    else
      render json: { errors: @position_setting.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/position_settings/:id
  def destroy
    # 削除前に、この役職を使用している従業員がいないかチェック
    if Employee.where(position: @position_setting.position_code).exists?
      render json: { error: 'この役職を使用している従業員が存在するため削除できません' }, status: :unprocessable_entity
      return
    end

    @position_setting.destroy
    head :no_content
  end

  # GET /api/v1/position_settings/active
  def active
    @position_settings = PositionSetting.active.order(:hierarchy_level)
    render json: @position_settings
  end

  # GET /api/v1/position_settings/codes
  def codes
    render json: {
      position_codes: PositionSetting::POSITION_CODES
    }
  end

  # GET /api/v1/position_settings/hierarchy
  def hierarchy
    @position_settings = PositionSetting.active.ordered_by_hierarchy
    render json: @position_settings
  end

  # GET /api/v1/position_settings/fully_eligible
  def fully_eligible
    @position_settings = PositionSetting.fully_eligible_positions
    render json: @position_settings
  end

  # GET /api/v1/position_settings/restricted
  def restricted
    @position_settings = PositionSetting.restricted_positions
    render json: @position_settings
  end

  private

  def set_position_setting
    @position_setting = PositionSetting.find(params[:id])
  end

  def position_setting_params
    params.require(:position_setting).permit(
      :position_code,
      :position_name,
      :hierarchy_level,
      :overtime_allowance_eligible,
      :night_work_allowance_eligible,
      :holiday_work_allowance_eligible,
      :early_work_allowance_eligible,
      :night_shift_allowance_eligible,
      :position_allowance,
      :management_allowance,
      :is_active,
      :description
    )
  end

  def update_related_employees
    # この役職を使用している従業員の手当て適用可否を更新
    Employee.where(position: @position_setting.position_code).find_each do |employee|
      employee.update_allowance_eligibility!
    end
  end
end
