class Api::V1::AdminPasswordsController < ApplicationController
  before_action :authenticate_admin_password, except: [:authenticate]

  def index
    @admin_passwords = AdminPassword.all.order(:created_at)
    render json: @admin_passwords
  end

  def show
    @admin_password = AdminPassword.find(params[:id])
    render json: @admin_password
  end

  def create
    @admin_password = AdminPassword.new(admin_password_params)
    
    if @admin_password.save
      render json: @admin_password, status: :created
    else
      render json: { errors: @admin_password.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    @admin_password = AdminPassword.find(params[:id])
    
    if @admin_password.update(admin_password_params)
      render json: @admin_password
    else
      render json: { errors: @admin_password.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @admin_password = AdminPassword.find(params[:id])
    @admin_password.destroy
    head :no_content
  end

  def authenticate
    password = params[:password]
    
    if password.blank?
      render json: { error: 'パスワードが入力されていません' }, status: :unauthorized
      return
    end

    admin_password = AdminPassword.authenticate(password)
    
    if admin_password
      render json: { 
        success: true, 
        message: '認証に成功しました',
        admin_password: {
          id: admin_password.id,
          description: admin_password.description
        }
      }
    else
      render json: { error: 'パスワードが正しくありません' }, status: :unauthorized
    end
  end

  private

  def admin_password_params
    params.require(:admin_password).permit(:password, :password_confirmation, :description, :is_active)
  end

  def authenticate_admin_password
    # 簡易的な認証（実際の実装ではセッションやJWTを使用）
    # ここでは認証済みと仮定
    true
  end
end
