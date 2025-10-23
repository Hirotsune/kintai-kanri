class OfflineSyncService
  def self.sync_all_pending_changes
    return { synced: 0, failed: 0, total: 0 } unless NetworkStatus.online?

    pending_changes = OfflineChange.pending.order(:created_at)
    synced_count = 0
    failed_count = 0

    pending_changes.each do |change|
      begin
        change.sync!
        synced_count += 1
      rescue => e
        failed_count += 1
        Rails.logger.error "同期失敗: #{change.id} - #{e.message}"
      end
    end

    {
      synced: synced_count,
      failed: failed_count,
      total: pending_changes.count
    }
  end

  def self.retry_failed_changes
    failed_changes = OfflineChange.failed.retryable
    retry_count = 0

    failed_changes.each do |change|
      begin
        change.sync!
        retry_count += 1
      rescue => e
        Rails.logger.error "再試行失敗: #{change.id} - #{e.message}"
      end
    end

    retry_count
  end

  def self.cleanup_old_synced_changes(days = 30)
    cutoff_date = days.days.ago
    deleted_count = OfflineChange.synced.where('synced_at < ?', cutoff_date).delete_all
    
    Rails.logger.info "古い同期済み変更を削除: #{deleted_count}件"
    deleted_count
  end

  def self.get_sync_status
    {
      pending: OfflineChange.pending.count,
      failed: OfflineChange.failed.count,
      synced_today: OfflineChange.synced.where('synced_at >= ?', Date.current.beginning_of_day).count,
      total_today: OfflineChange.where('created_at >= ?', Date.current.beginning_of_day).count
    }
  end
end
