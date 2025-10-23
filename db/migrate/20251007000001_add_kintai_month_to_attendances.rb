class AddKintaiMonthToAttendances < ActiveRecord::Migration[8.0]
  def change
    # 勤怠月列を追加（形式: '2025-06'）
    add_column :attendances, :kintai_month, :string, limit: 7, comment: '勤怠月（YYYY-MM形式）'
    
    # インデックスを追加（検索速度向上）
    add_index :attendances, :kintai_month
    
    # 既存データの勤怠月を設定
    reversible do |dir|
      dir.up do
        # 既存のattendancesデータの勤怠月を設定
        execute <<-SQL
          UPDATE attendances 
          SET kintai_month = TO_CHAR(work_date, 'YYYY-MM')
          WHERE kintai_month IS NULL
        SQL
      end
    end
  end
end
