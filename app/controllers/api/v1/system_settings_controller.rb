class Api::V1::SystemSettingsController < ApplicationController
  def index
    @settings = SystemSetting.all
    render json: @settings
  end

  def show
    @setting = SystemSetting.find_by(key: params[:id])
    if @setting
      render json: @setting
    else
      render json: { error: 'Setting not found' }, status: :not_found
    end
  end

  def update
    @setting = SystemSetting.find_or_initialize_by(key: params[:id])
    @setting.value = params[:value]
    @setting.description = params[:description] if params[:description].present?
    
    if @setting.save
      render json: @setting
    else
      render json: { errors: @setting.errors }, status: :unprocessable_entity
    end
  end

  def shift_input_enabled
    enabled = SystemSetting.shift_input_enabled?
    render json: { shift_input_enabled: enabled }
  end

  def set_shift_input_enabled
    SystemSetting.set_shift_input_enabled(params[:enabled])
    render json: { success: true, shift_input_enabled: params[:enabled] }
  end

  # 時間刻み設定関連
  def time_rounding_mode
    mode = SystemSetting.time_rounding_mode
    render json: { 
      time_rounding_mode: mode,
      mode_name: SystemSetting.time_rounding_mode_name(mode)
    }
  end

  def set_time_rounding_mode
    begin
      SystemSetting.set_time_rounding_mode(params[:mode])
      render json: { 
        success: true, 
        time_rounding_mode: params[:mode],
        mode_name: SystemSetting.time_rounding_mode_name(params[:mode])
      }
    rescue ArgumentError => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def time_rounding_options
    render json: { options: SystemSetting.time_rounding_options }
  end
end