namespace :offline do
  desc "オフライン変更の同期"
  task sync: :environment do
    puts "オフライン変更の同期を開始..."
    
    # ネットワーク接続確認
    if NetworkStatus.offline?
      puts "ネットワーク接続がありません。同期をスキップします。"
      exit 0
    end

    result = OfflineSyncService.sync_all_pending_changes
    puts "同期完了: 成功#{result[:synced]}件, 失敗#{result[:failed]}件, 合計#{result[:total]}件"
  end

  desc "失敗した変更の再試行"
  task retry: :environment do
    puts "失敗した変更の再試行を開始..."
    
    if NetworkStatus.offline?
      puts "ネットワーク接続がありません。再試行をスキップします。"
      exit 0
    end

    retry_count = OfflineSyncService.retry_failed_changes
    puts "再試行完了: #{retry_count}件"
  end

  desc "古い同期済み変更の削除"
  task cleanup: :environment do
    days = ENV['DAYS']&.to_i || 30
    puts "#{days}日以上古い同期済み変更を削除します..."
    
    deleted_count = OfflineSyncService.cleanup_old_synced_changes(days)
    puts "削除完了: #{deleted_count}件"
  end

  desc "オフライン変更の状況を表示"
  task status: :environment do
    puts "オフライン変更の状況"
    puts "=" * 40
    
    status = OfflineSyncService.get_sync_status
    puts "待機中: #{status[:pending]}件"
    puts "失敗: #{status[:failed]}件"
    puts "今日同期済み: #{status[:synced_today]}件"
    puts "今日作成: #{status[:total_today]}件"
    
    puts ""
    puts "ネットワーク接続: #{NetworkStatus.online? ? 'オンライン' : 'オフライン'}"
    
    # テーブル別の状況
    puts ""
    puts "テーブル別の状況:"
    OfflineChange.group(:table_name, :status).count.each do |(table, status), count|
      puts "  #{table} (#{status}): #{count}件"
    end
  end

  desc "特定テーブルのオフライン変更を表示"
  task :show, [:table_name] => :environment do |t, args|
    table_name = args[:table_name]
    
    unless table_name
      puts "使用方法: rake offline:show[table_name]"
      puts "例: rake offline:show[attendances]"
      exit 1
    end

    changes = OfflineChange.by_table(table_name).order(:created_at)
    
    if changes.empty?
      puts "#{table_name}のオフライン変更はありません"
      exit 0
    end

    puts "#{table_name}のオフライン変更 (#{changes.count}件)"
    puts "=" * 50
    
    changes.each do |change|
      puts "ID: #{change.id}"
      puts "操作: #{change.operation_name_jp} (#{change.operation})"
      puts "ステータス: #{change.status_name_jp} (#{change.status})"
      puts "作成日時: #{change.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
      puts "同期日時: #{change.synced_at&.strftime('%Y-%m-%d %H:%M:%S') || '未同期'}"
      puts "再試行回数: #{change.retry_count}"
      if change.error_message.present?
        puts "エラー: #{change.error_message}"
      end
      puts "-" * 30
    end
  end

  desc "オフライン変更の強制削除"
  task :force_delete, [:table_name, :status] => :environment do |t, args|
    table_name = args[:table_name]
    status = args[:status] || 'failed'
    
    unless table_name
      puts "使用方法: rake offline:force_delete[table_name,status]"
      puts "例: rake offline:force_delete[attendances,failed]"
      exit 1
    end

    changes = OfflineChange.by_table(table_name).where(status: status)
    
    if changes.empty?
      puts "#{table_name}の#{status}ステータスの変更はありません"
      exit 0
    end

    puts "#{table_name}の#{status}ステータスの変更を削除します (#{changes.count}件)"
    print "本当に削除しますか？ (y/N): "
    response = STDIN.gets.chomp
    
    if response.downcase == 'y'
      deleted_count = changes.delete_all
      puts "#{deleted_count}件の変更を削除しました"
    else
      puts "削除をキャンセルしました"
    end
  end
end
