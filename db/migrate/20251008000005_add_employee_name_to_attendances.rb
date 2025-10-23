class AddEmployeeNameToAttendances < ActiveRecord::Migration[8.0]
  def change
    add_column :attendances, :employee_name, :string, comment: "社員名"
    
    add_index :attendances, :employee_name
  end
end
