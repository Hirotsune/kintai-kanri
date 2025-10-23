class OfflineChange < ApplicationRecord
  validates :table_name, presence: true
  validates :operation, presence: true, inclusion: { in: %w[create update delete] }
  validates :data, presence: true
  validates :status, inclusion: { in: %w[pending synced failed] }

  scope :pending, -> { where(status: 'pending') }
  scope :failed, -> { where(status: 'failed') }
  scope :synced, -> { where(status: 'synced') }
  scope :by_table, ->(table_name) { where(table_name: table_name) }
  scope :retryable, -> { where('retry_count < ?', 3) }

  # オフライン変更の記録
  def self.record_change(table_name, operation, record_id, data, original_data = nil)
    create!(
      table_name: table_name,
      operation: operation,
      record_id: record_id,
      data: data,
      original_data: original_data,
      status: 'pending'
    )
  end

  # 同期処理
  def sync!
    return if status == 'synced'

    begin
      case operation
      when 'create'
        sync_create
      when 'update'
        sync_update
      when 'delete'
        sync_delete
      end

      update!(status: 'synced', synced_at: Time.current)
      Rails.logger.info "オフライン変更を同期: #{table_name} #{operation} #{record_id}"
    rescue => e
      update!(
        status: 'failed',
        error_message: e.message,
        retry_count: retry_count + 1
      )
      Rails.logger.error "オフライン変更の同期に失敗: #{e.message}"
      raise e
    end
  end

  # 操作名の日本語表示
  def operation_name_jp
    case operation
    when 'create'
      '作成'
    when 'update'
      '更新'
    when 'delete'
      '削除'
    else
      operation
    end
  end

  # ステータス名の日本語表示
  def status_name_jp
    case status
    when 'pending'
      '待機中'
    when 'synced'
      '同期済み'
    when 'failed'
      '失敗'
    else
      status
    end
  end

  # 再試行可能かチェック
  def retryable?
    status == 'failed' && retry_count < 3
  end

  # 同期可能かチェック
  def syncable?
    status == 'pending' || retryable?
  end

  private

  def sync_create
    model_class = table_name.classify.constantize
    record = model_class.new(data)
    record.save!
    update!(record_id: record.id.to_s) if record_id.blank?
  end

  def sync_update
    model_class = table_name.classify.constantize
    record = model_class.find(record_id)
    record.update!(data)
  end

  def sync_delete
    model_class = table_name.classify.constantize
    record = model_class.find(record_id)
    record.destroy!
  end
end
