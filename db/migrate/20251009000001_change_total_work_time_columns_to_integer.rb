class ChangeTotalWorkTimeColumnsToInteger < ActiveRecord::Migration[8.0]
  def change
    # total_work_time列をnumeric(4,2)からintegerに変更
    change_column :attendances, :total_work_time_15min, :integer, comment: "15分刻み実労働時間（分）"
    change_column :attendances, :total_work_time_10min, :integer, comment: "10分刻み実労働時間（分）"
    change_column :attendances, :total_work_time_5min, :integer, comment: "5分刻み実労働時間（分）"
    change_column :attendances, :total_work_time_1min, :integer, comment: "1分刻み実労働時間（分）"
  end
end
