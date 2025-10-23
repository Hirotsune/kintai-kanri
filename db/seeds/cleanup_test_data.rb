# テストデータのクリーンアップスクリプト
puts "=== テストデータのクリーンアップ開始 ==="

# 関連テーブルの順序で削除（外部キー制約のため）
puts "勤怠データを削除中..."
Attendance.destroy_all

puts "スケジュールエントリを削除中..."
ScheduleEntry.destroy_all

puts "従業員データを削除中..."
Employee.destroy_all

puts "ラインデータを削除中..."
Line.destroy_all

puts "工場データを削除中..."
Factory.destroy_all

puts "シフトデータを削除中..."
Shift.destroy_all

puts "有給記録を削除中..."
PaidLeaveRecord.destroy_all

puts "有給計算ログを削除中..."
PaidLeaveCalculationLog.destroy_all

puts "オフライン変更記録を削除中..."
OfflineChange.destroy_all

puts "=== テストデータのクリーンアップ完了 ==="
puts "削除されたレコード数:"
puts "  - Attendances: #{Attendance.count}"
puts "  - ScheduleEntries: #{ScheduleEntry.count}"
puts "  - Employees: #{Employee.count}"
puts "  - Lines: #{Line.count}"
puts "  - Factories: #{Factory.count}"
puts "  - Shifts: #{Shift.count}"
puts "  - PaidLeaveRecords: #{PaidLeaveRecord.count}"
puts "  - PaidLeaveCalculationLogs: #{PaidLeaveCalculationLog.count}"
puts "  - OfflineChanges: #{OfflineChange.count}"
