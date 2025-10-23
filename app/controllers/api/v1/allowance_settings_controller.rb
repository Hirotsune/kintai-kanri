class Api::V1::AllowanceSettingsController < ApplicationController
  before_action :set_allowance_setting, only: [:show, :update, :destroy]

  # GET /api/v1/allowance_settings
  def index
    @allowance_settings = AllowanceSetting.all.order(:allowance_type, :id)
    render json: @allowance_settings
  end

  # GET /api/v1/allowance_settings/:id
  def show
    render json: @allowance_setting
  end

  # POST /api/v1/allowance_settings
  def create
    @allowance_setting = AllowanceSetting.new(allowance_setting_params)

    if @allowance_setting.save
      render json: @allowance_setting, status: :created
    else
      render json: { errors: @allowance_setting.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/allowance_settings/:id
  def update
    if @allowance_setting.update(allowance_setting_params)
      render json: @allowance_setting
    else
      render json: { errors: @allowance_setting.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/allowance_settings/:id
  def destroy
    @allowance_setting.destroy
    head :no_content
  end

  # GET /api/v1/allowance_settings/types
  def types
    render json: {
      allowance_types: AllowanceSetting::ALLOWANCE_TYPES,
      calculation_types: AllowanceSetting::CALCULATION_TYPES,
      condition_types: AllowanceSetting::CONDITION_TYPES
    }
  end

  # GET /api/v1/allowance_settings/active
  def active
    @allowance_settings = AllowanceSetting.active.order(:allowance_type, :id)
    render json: @allowance_settings
  end

  # GET /api/v1/allowance_settings/by_type/:type
  def by_type
    @allowance_settings = AllowanceSetting.active.by_type(params[:type])
    render json: @allowance_settings
  end

  private

  def set_allowance_setting
    @allowance_setting = AllowanceSetting.find(params[:id])
  end

  def allowance_setting_params
    params.require(:allowance_setting).permit(
      :allowance_type,
      :name,
      :rate,
      :fixed_amount,
      :calculation_type,
      :condition_type,
      :condition_value,
      :is_legal_requirement,
      :is_active,
      :description
    )
  end
end
