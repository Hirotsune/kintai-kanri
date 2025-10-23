class Api::V1::DeviceConfigsController < ApplicationController
  before_action :set_device_config, only: [:show, :update, :destroy]

  def index
    @configs = DeviceConfig.all.order(:device_name)
    # JSONデータを正しく処理
    configs_data = @configs.map do |config|
      config.as_json.merge({
        'punch_buttons' => config.punch_buttons,
        'line_ids' => config.line_ids
      })
    end
    render json: configs_data
  end

  def show
    config_data = @device_config.as_json.merge({
      'punch_buttons' => @device_config.punch_buttons,
      'line_ids' => @device_config.line_ids
    })
    render json: config_data
  end

  def create
    @device_config = DeviceConfig.new(device_config_params)
    
    if @device_config.save
      config_data = @device_config.as_json.merge({
        'punch_buttons' => @device_config.punch_buttons,
        'line_ids' => @device_config.line_ids
      })
      render json: config_data, status: :created
    else
      render json: { errors: @device_config.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @device_config.update(device_config_params)
      config_data = @device_config.as_json.merge({
        'punch_buttons' => @device_config.punch_buttons,
        'line_ids' => @device_config.line_ids
      })
      render json: config_data
    else
      render json: { errors: @device_config.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @device_config.destroy
    head :no_content
  end

  # 環境変数から設定を取得するエンドポイント
  def get_by_env
    device_id = params[:device_id]
    @device_config = DeviceConfig.find_by(device_id: device_id)
    
    if @device_config
      # ライン情報も含めて返す
      config_data = @device_config.as_json.merge({
        'punch_buttons' => @device_config.punch_buttons,
        'line_ids' => @device_config.line_ids
      })
      config_data['display_lines'] = @device_config.display_lines.as_json
      render json: config_data
    else
      render json: { error: 'Device config not found' }, status: :not_found
    end
  end

  # シフト入力機能の設定を取得
  def get_shift_input_enabled
    device_id = params[:device_id]
    @device_config = DeviceConfig.find_by(device_id: device_id)
    
    if @device_config
      render json: { shift_input_enabled: @device_config.shift_input_enabled? }
    else
      render json: { error: 'Device config not found' }, status: :not_found
    end
  end

  # シフト入力機能の設定を更新
  def set_shift_input_enabled
    device_id = params[:device_id]
    @device_config = DeviceConfig.find_by(device_id: device_id)
    
    if @device_config
      @device_config.set_shift_input_enabled(params[:enabled])
      render json: { success: true, shift_input_enabled: params[:enabled] }
    else
      render json: { error: 'Device config not found' }, status: :not_found
    end
  end

  private

  def set_device_config
    @device_config = DeviceConfig.find_by(device_id: params[:device_id])
    render json: { error: 'Device config not found' }, status: :not_found unless @device_config
  end

  def device_config_params
    params.require(:device_config).permit(
      :device_id, :device_name, :device_type, :location,
      :show_factory_selection, :show_line_selection, :shift_input_enabled,
      punch_buttons: [], line_ids: []
    )
  end
end

