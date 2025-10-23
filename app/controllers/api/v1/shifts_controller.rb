class Api::V1::ShiftsController < ApplicationController
  before_action :set_shift, only: [:show, :update, :destroy]

  def index
    # 個人カレンダー画面用の最適化クエリ
    @shifts = Shift.active.order(:name)
    @shifts = @shifts.by_factory(params[:factory_id]) if params[:factory_id].present?
    
    render json: @shifts
  end

  def show
    render json: @shift
  end

  def create
    @shift = Shift.new(shift_params)
    
    if @shift.save
      render json: @shift, status: :created
    else
      render json: { errors: @shift.errors }, status: :unprocessable_entity
    end
  end

  def update
    if @shift.update(shift_params)
      render json: @shift
    else
      render json: { errors: @shift.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @shift.destroy
    head :no_content
  end

  private

  def set_shift
    @shift = Shift.find(params[:id])
  end

  def shift_params
    params.require(:shift).permit(:name, :start_time, :duration_hours, :date_boundary_hour, :factory_id, :is_active, :description)
  end
end
