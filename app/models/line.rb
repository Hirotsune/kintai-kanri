class Line < ApplicationRecord
  belongs_to :factory, primary_key: :factory_id, foreign_key: :factory_id
  
  # バリデーション
  validates :line_id, presence: true, uniqueness: true
  validates :name, presence: true
  validates :factory_id, presence: true
  validates :is_active, inclusion: { in: [true, false] }
  
  # スコープ
  scope :active, -> { where(is_active: true) }
  
  # 関連
  has_many :employees, primary_key: :line_id, foreign_key: :line_id, dependent: :destroy
end