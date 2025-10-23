class EmployeeShift < ApplicationRecord
  belongs_to :employee
  belongs_to :shift
  
  validates :employee_id, uniqueness: { scope: :shift_id }
  validates :is_default, inclusion: { in: [true, false] }
  
  scope :default_shift, -> { where(is_default: true) }
  scope :effective_on, ->(date) { 
    where('effective_from <= ? AND (effective_to IS NULL OR effective_to >= ?)', date, date) 
  }
end
