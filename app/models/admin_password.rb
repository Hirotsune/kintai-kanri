class AdminPassword < ApplicationRecord
  has_secure_password

  validates :password, presence: { message: 'パスワードを入力してください' }, 
                      length: { minimum: 4, message: 'パスワードは4文字以上で入力してください' }
  validates :description, presence: { message: '説明を入力してください' }

  scope :active, -> { where(is_active: true) }

  def self.authenticate(password)
    active.find { |admin_password| admin_password.authenticate(password) }
  end
end
