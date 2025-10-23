class PaidLeaveRecord < ApplicationRecord
  belongs_to :employee, primary_key: :employee_id, foreign_key: :employee_id
  
  # バリデーション
  validates :employee_id, presence: true
  validates :leave_date, presence: true
  validates :days, presence: true, numericality: { greater_than: 0 }
  validates :status, presence: true, inclusion: { in: %w[pending approved rejected] }
  validates :employee_id, uniqueness: { scope: :leave_date, message: "同じ日付の有給記録が既に存在します" }
  
  # スコープ
  scope :approved, -> { where(status: 'approved') }
  scope :pending, -> { where(status: 'pending') }
  scope :rejected, -> { where(status: 'rejected') }
  scope :by_employee, ->(employee_id) { where(employee_id: employee_id) }
  scope :by_date_range, ->(start_date, end_date) { where(leave_date: start_date..end_date) }
  scope :current_year, -> { where(leave_date: Date.current.beginning_of_year..Date.current.end_of_year) }
  
  # 承認処理
  def approve!(approved_by)
    update!(
      status: 'approved',
      approved_by: approved_by,
      approved_at: Time.current
    )
  end
  
  def reject!(approved_by, reason = nil)
    update!(
      status: 'rejected',
      approved_by: approved_by,
      approved_at: Time.current,
      notes: reason
    )
  end
  
  # 状態チェック
  def approved?
    status == 'approved'
  end
  
  def pending?
    status == 'pending'
  end
  
  def rejected?
    status == 'rejected'
  end
end

