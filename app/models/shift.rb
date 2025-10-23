class Shift < ApplicationRecord
  # バリデーション
  validates :name, presence: true
  validates :start_time, presence: true
  validates :duration_hours, presence: true, numericality: { greater_than: 0 }
  validates :date_boundary_hour, presence: true, numericality: { in: 0..23 }
  
  # 関連
  has_many :attendances
  has_many :employee_shifts, dependent: :destroy
  has_many :employees, through: :employee_shifts
  has_many :schedule_entries, dependent: :destroy
  
  # スコープ
  scope :active, -> { where(is_active: true) }
  scope :by_factory, ->(factory_id) { where(factory_id: factory_id) }
  
  def end_time
    start_time + duration_hours.hours
  end
  
  def shift_type
    "#{start_time.strftime('%H:%M')}-#{end_time.strftime('%H:%M')}"
  end
  
  def formatted_duration
    "#{duration_hours.to_i}H"
  end
  
  def display_name
    "#{name} (#{start_time.strftime('%H:%M')}-#{end_time.strftime('%H:%M')})"
  end
end
