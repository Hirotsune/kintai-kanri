class LeaveType < ApplicationRecord
  validates :name, presence: true
  validates :code, presence: true, uniqueness: true

  scope :active, -> { where(is_active: true) }

  def self.default_types
    [
      { name: '年次有給休暇', code: 'annual_leave', is_paid: true, requires_approval: true },
      { name: '特別休暇', code: 'special_leave', is_paid: false, requires_approval: true },
      { name: '病気休暇', code: 'sick_leave', is_paid: false, requires_approval: true },
      { name: '育児休暇', code: 'childcare_leave', is_paid: false, requires_approval: true },
      { name: '介護休暇', code: 'care_leave', is_paid: false, requires_approval: true },
      { name: '慶弔休暇', code: 'bereavement_leave', is_paid: false, requires_approval: true },
      { name: 'その他', code: 'other', is_paid: false, requires_approval: true }
    ]
  end
end
