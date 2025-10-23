namespace :data_retention do
  desc "期限切れデータのアーカイブと削除"
  task cleanup: :environment do
    puts "データ保持期間管理を開始..."
    
    total_deleted = 0
    DataRetentionSetting.active.each do |setting|
      begin
        puts "処理中: #{setting.table_name_jp} (#{setting.table_name})"
        puts "  保持期間: #{setting.retention_years}年"
        puts "  期限切れデータ件数: #{setting.expired_count}件"
        
        if setting.expired_count > 0
          deleted_count = setting.delete_expired_data
          total_deleted += deleted_count
          puts "  → #{deleted_count}件削除完了"
        else
          puts "  → 削除対象なし"
        end
        
        puts ""
      rescue => e
        puts "  → エラー: #{setting.table_name}の処理中にエラーが発生: #{e.message}"
        puts ""
      end
    end
    
    puts "データ保持期間管理完了: 合計#{total_deleted}件削除"
  end

  desc "アーカイブファイルの整理（1年以上古いアーカイブを削除）"
  task cleanup_archives: :environment do
    archive_dir = Rails.root.join('storage', 'archives')
    return unless Dir.exist?(archive_dir)

    puts "アーカイブファイルの整理を開始..."
    puts "対象ディレクトリ: #{archive_dir}"

    cutoff_date = 1.year.ago
    deleted_files = 0
    total_size = 0

    Dir.glob(File.join(archive_dir, '*.json')).each do |file_path|
      file_time = File.mtime(file_path)
      file_size = File.size(file_path)
      
      if file_time < cutoff_date
        File.delete(file_path)
        deleted_files += 1
        total_size += file_size
        puts "古いアーカイブを削除: #{File.basename(file_path)} (#{file_size} bytes)"
      end
    end

    puts "アーカイブ整理完了: #{deleted_files}ファイル削除 (#{total_size} bytes)"
  end

  desc "データ保持設定の状況を表示"
  task status: :environment do
    puts "データ保持設定の状況"
    puts "=" * 50
    
    DataRetentionSetting.active.each do |setting|
      puts "#{setting.table_name_jp} (#{setting.table_name})"
      puts "  保持期間: #{setting.retention_years}年"
      puts "  アーカイブ: #{setting.archive_before_delete? ? '有効' : '無効'}"
      puts "  期限切れデータ: #{setting.expired_count}件"
      
      if setting.expired_count > 0
        next_cleanup = setting.next_cleanup_date
        puts "  次回削除予定: #{next_cleanup&.strftime('%Y年%m月%d日') || '不明'}"
      end
      
      puts ""
    end
  end

  desc "特定テーブルの期限切れデータを強制削除（アーカイブなし）"
  task :force_cleanup, [:table_name] => :environment do |t, args|
    table_name = args[:table_name]
    
    unless table_name
      puts "使用方法: rake data_retention:force_cleanup[table_name]"
      puts "例: rake data_retention:force_cleanup[attendances]"
      exit 1
    end

    setting = DataRetentionSetting.find_by(table_name: table_name)
    unless setting
      puts "エラー: #{table_name}の設定が見つかりません"
      exit 1
    end

    puts "#{setting.table_name_jp}の強制削除を実行します"
    puts "保持期間: #{setting.retention_years}年"
    puts "期限切れデータ: #{setting.expired_count}件"
    
    if setting.expired_count == 0
      puts "削除対象のデータがありません"
      exit 0
    end

    print "本当に削除しますか？ (y/N): "
    response = STDIN.gets.chomp
    
    if response.downcase == 'y'
      # アーカイブを無効にして削除
      original_archive_setting = setting.archive_before_delete
      setting.update!(archive_before_delete: false)
      
      begin
        deleted_count = setting.delete_expired_data
        puts "#{deleted_count}件のデータを削除しました"
      ensure
        # 設定を元に戻す
        setting.update!(archive_before_delete: original_archive_setting)
      end
    else
      puts "削除をキャンセルしました"
    end
  end
end
