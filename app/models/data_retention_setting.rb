class DataRetentionSetting < ApplicationRecord
  validates :table_name, presence: true, uniqueness: true
  validates :retention_years, presence: true, numericality: { greater_than: 0 }

  scope :active, -> { where(is_active: true) }

  # データ保持期間を過ぎたレコードを取得
  def expired_records
    cutoff_date = retention_years.years.ago
    case table_name
    when 'attendances'
      Attendance.where('work_date < ?', cutoff_date)
    when 'schedule_entries'
      ScheduleEntry.where('schedule_date < ?', cutoff_date)
    when 'paid_leave_records'
      PaidLeaveRecord.where('leave_date < ?', cutoff_date)
    when 'paid_leave_calculation_logs'
      PaidLeaveCalculationLog.where('calculation_date < ?', cutoff_date)
    else
      []
    end
  end

  # アーカイブ処理
  def archive_expired_data
    return unless archive_before_delete

    expired_data = expired_records
    return if expired_data.empty?

    # アーカイブファイル名
    archive_filename = "#{table_name}_#{Date.current.strftime('%Y%m%d')}.json"
    archive_path = Rails.root.join('storage', 'archives', archive_filename)

    # ディレクトリ作成
    FileUtils.mkdir_p(File.dirname(archive_path))

    # データをJSON形式でアーカイブ
    archive_data = expired_data.map(&:attributes)
    File.write(archive_path, JSON.pretty_generate(archive_data))

    Rails.logger.info "アーカイブ完了: #{expired_data.count}件の#{table_name}データを#{archive_path}に保存"
    
    archive_path
  end

  # 期限切れデータの削除
  def delete_expired_data
    expired_data = expired_records
    count = expired_data.count
    
    if archive_before_delete
      archive_expired_data
    end

    expired_data.delete_all
    Rails.logger.info "削除完了: #{count}件の#{table_name}データを削除"
    
    count
  end

  # テーブル名の日本語表示
  def table_name_jp
    case table_name
    when 'attendances'
      '勤怠データ'
    when 'schedule_entries'
      'スケジュールデータ'
    when 'paid_leave_records'
      '有給記録'
    when 'paid_leave_calculation_logs'
      '有給計算ログ'
    else
      table_name
    end
  end

  # 期限切れデータの件数を取得
  def expired_count
    expired_records.count
  end

  # 次回削除予定日を取得
  def next_cleanup_date
    return nil unless expired_count > 0
    
    # 最も古い期限切れデータの日付を基準に計算
    case table_name
    when 'attendances'
      oldest_date = Attendance.where('work_date < ?', retention_years.years.ago).minimum(:work_date)
    when 'schedule_entries'
      oldest_date = ScheduleEntry.where('schedule_date < ?', retention_years.years.ago).minimum(:schedule_date)
    when 'paid_leave_records'
      oldest_date = PaidLeaveRecord.where('leave_date < ?', retention_years.years.ago).minimum(:leave_date)
    when 'paid_leave_calculation_logs'
      oldest_date = PaidLeaveCalculationLog.where('calculation_date < ?', retention_years.years.ago).minimum(:calculation_date)
    end

    oldest_date&.+ retention_years.years
  end
end
