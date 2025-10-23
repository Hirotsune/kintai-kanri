class Api::V1::LinesController < ApplicationController
  before_action :set_line, only: [:show, :update, :destroy]

  # GET /api/v1/lines
  def index
    # 個人カレンダー画面用の最適化クエリ
    @lines = Line.where(is_active: true).order(:name)
    
    # 工場フィルタリング
    @lines = @lines.where(factory_id: params[:factory_id]) if params[:factory_id].present?
    
    render json: @lines
  end

  # GET /api/v1/lines/:id
  def show
    render json: @line
  end

  # POST /api/v1/lines
  def create
    @line = Line.new(line_params)
    
    if @line.save
      render json: @line, status: :created
    else
      render json: { errors: @line.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/lines/:id
  def update
    if @line.update(line_params)
      render json: @line
    else
      render json: { errors: @line.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/lines/:id
  def destroy
    @line.destroy
    head :no_content
  end

  private

  def set_line
    @line = Line.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'ラインが見つかりません' }, status: :not_found
  end

  def line_params
    params.require(:line).permit(:line_id, :name, :factory_id, :is_active)
  end
end