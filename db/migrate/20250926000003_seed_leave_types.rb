class SeedLeaveTypes < ActiveRecord::Migration[8.0]
  def up
    LeaveType.default_types.each do |type_data|
      LeaveType.find_or_create_by(code: type_data[:code]) do |leave_type|
        leave_type.name = type_data[:name]
        leave_type.description = type_data[:description] if type_data[:description]
        leave_type.requires_approval = type_data[:requires_approval]
        leave_type.is_paid = type_data[:is_paid]
        leave_type.is_active = true
      end
    end
  end

  def down
    LeaveType.where(code: LeaveType.default_types.map { |t| t[:code] }).destroy_all
  end
end
