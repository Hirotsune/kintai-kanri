class AddCompensatoryFieldsToScheduleEntries < ActiveRecord::Migration[8.0]
  def change
    add_column :schedule_entries, :is_compensatory, :boolean, default: false, comment: '振り替え休日フラグ'
    add_column :schedule_entries, :original_date, :date, comment: '元の勤務日（振り替えの場合）'
    add_column :schedule_entries, :compensatory_type, :string, comment: '振り替え種別（substitute, compensatory）'
    add_column :schedule_entries, :allowance_override, :jsonb, default: {}, comment: '手当計算の上書き設定'
    add_column :schedule_entries, :business_rules, :jsonb, default: {}, comment: '柔軟な業務ルール設定'

    add_index :schedule_entries, :is_compensatory
    add_index :schedule_entries, :compensatory_type
    add_index :schedule_entries, :original_date
    add_index :schedule_entries, :allowance_override, using: :gin
    add_index :schedule_entries, :business_rules, using: :gin
  end
end
