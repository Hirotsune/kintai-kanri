class Api::V1::FactoriesController < ApplicationController
  before_action :set_factory, only: [:show, :update, :destroy]

  # GET /api/v1/factories
  def index
    # 個人カレンダー画面用の最適化クエリ
    @factories = Factory.where(is_active: true).order(:name)
    render json: @factories
  end

  # GET /api/v1/factories/:id
  def show
    render json: @factory
  end

  # POST /api/v1/factories
  def create
    @factory = Factory.new(factory_params)
    
    if @factory.save
      render json: @factory, status: :created
    else
      render json: { errors: @factory.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/factories/:id
  def update
    if @factory.update(factory_params)
      render json: @factory
    else
      render json: { errors: @factory.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/factories/:id
  def destroy
    @factory.destroy
    head :no_content
  end

  private

  def set_factory
    @factory = Factory.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: '工場が見つかりません' }, status: :not_found
  end

  def factory_params
    params.require(:factory).permit(:factory_id, :name, :is_active)
  end
end