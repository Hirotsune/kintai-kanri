class Factory < ApplicationRecord
  # バリデーション
  validates :factory_id, presence: true, uniqueness: true
  validates :name, presence: true
  validates :is_active, inclusion: { in: [true, false] }
  
  # スコープ
  scope :active, -> { where(is_active: true) }
  
  # 関連
  has_many :lines, primary_key: :factory_id, foreign_key: :factory_id, dependent: :destroy
  has_many :employees, primary_key: :factory_id, foreign_key: :factory_id, dependent: :destroy
end