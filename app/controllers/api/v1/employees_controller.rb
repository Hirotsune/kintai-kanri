class Api::V1::EmployeesController < ApplicationController
  before_action :set_employee, only: [:show, :update, :destroy]

  # GET /api/v1/employees
  def index
    # 勤怠シフト入力画面用の最適化クエリ
    @employees = Employee.includes(:factory, :line)
                        .where(is_active: true)
                        .order(:employee_id)
    
    # フィルタリング
    @employees = @employees.where(factory_id: params[:factory_id]) if params[:factory_id].present?
    @employees = @employees.where(line_id: params[:line_id]) if params[:line_id].present?
    
    render json: @employees
  end

  # GET /api/v1/employees/:id
  def show
    render json: @employee
  end

  # POST /api/v1/employees
  def create
    @employee = Employee.new(employee_params)
    
    if @employee.save
      render json: @employee, status: :created
    else
      render json: { errors: @employee.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/employees/:id
  def update
    if @employee.update(employee_params)
      render json: @employee
    else
      render json: { errors: @employee.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/employees/:id
  def destroy
    @employee.destroy
    head :no_content
  end

  private

  def set_employee
    @employee = Employee.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: '従業員が見つかりません' }, status: :not_found
  end

  def employee_params
    params.require(:employee).permit(:employee_id, :name, :name_kana, :department, :line_id, :factory_id, :hire_date, :status, :is_active)
  end
end