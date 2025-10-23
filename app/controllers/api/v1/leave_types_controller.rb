class Api::V1::LeaveTypesController < ApplicationController
  before_action :set_leave_type, only: [:show, :update, :destroy]

  # GET /api/v1/leave_types
  def index
    @leave_types = LeaveType.active
    render json: @leave_types
  end

  # GET /api/v1/leave_types/:id
  def show
    render json: @leave_type
  end

  # POST /api/v1/leave_types
  def create
    @leave_type = LeaveType.new(leave_type_params)

    if @leave_type.save
      render json: @leave_type, status: :created
    else
      render json: { errors: @leave_type.errors }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/leave_types/:id
  def update
    if @leave_type.update(leave_type_params)
      render json: @leave_type
    else
      render json: { errors: @leave_type.errors }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/leave_types/:id
  def destroy
    @leave_type.update(is_active: false)
    head :no_content
  end

  private

  def set_leave_type
    @leave_type = LeaveType.find(params[:id])
  end

  def leave_type_params
    params.require(:leave_type).permit(
      :name, :code, :description, :requires_approval, :is_paid
    )
  end
end
