class Api::V1::EmployeeShiftsController < ApplicationController
  before_action :set_employee_shift, only: [:show, :update, :destroy]

  def index
    @employee_shifts = EmployeeShift.includes(:employee, :shift)
    @employee_shifts = @employee_shifts.where(employee_id: params[:employee_id]) if params[:employee_id].present?
    
    render json: @employee_shifts
  end

  def show
    render json: @employee_shift
  end

  def create
    @employee_shift = EmployeeShift.new(employee_shift_params)
    
    if @employee_shift.save
      render json: @employee_shift, status: :created
    else
      render json: { errors: @employee_shift.errors }, status: :unprocessable_entity
    end
  end

  def update
    if @employee_shift.update(employee_shift_params)
      render json: @employee_shift
    else
      render json: { errors: @employee_shift.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @employee_shift.destroy
    head :no_content
  end

  private

  def set_employee_shift
    @employee_shift = EmployeeShift.find(params[:id])
  end

  def employee_shift_params
    params.require(:employee_shift).permit(:employee_id, :shift_id, :is_default, :effective_from, :effective_to)
  end
end
