class PaidLeaveCalculationLog < ApplicationRecord
  belongs_to :employee, primary_key: :employee_id, foreign_key: :employee_id
  
  # バリデーション
  validates :employee_id, presence: true
  validates :calculation_date, presence: true
  validates :new_days, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :added_days, presence: true
  validates :calculation_reason, presence: true
  
  # スコープ
  scope :by_employee, ->(employee_id) { where(employee_id: employee_id) }
  scope :by_date_range, ->(start_date, end_date) { where(calculation_date: start_date..end_date) }
  scope :current_year, -> { where(calculation_date: Date.current.beginning_of_year..Date.current.end_of_year) }
  scope :automatic_calculations, -> { where(calculation_reason: '勤続年数による自動計算') }
  scope :manual_adjustments, -> { where.not(calculation_reason: '勤続年数による自動計算') }
end

