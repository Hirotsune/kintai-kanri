class AddNoteToAttendances < ActiveRecord::Migration[8.0]
  def change
    add_column :attendances, :note, :string, limit: 500
    # ユニークインデックスを削除（勤怠データは1日1従業員につき複数の打刻レコードが存在するため）
    # add_index :attendances, [:employee_id, :work_date], unique: true, name: 'index_attendances_on_employee_and_date'
  end
end
