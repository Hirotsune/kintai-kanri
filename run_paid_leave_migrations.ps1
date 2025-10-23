# 有給管理機能のマイグレーション実行スクリプト
Write-Host "有給管理機能のマイグレーションを実行中..." -ForegroundColor Green

# 既存のマイグレーション状態を確認
Write-Host "`n📋 現在のマイグレーション状態を確認中..." -ForegroundColor Yellow
rails db:migrate:status

# マイグレーション実行
Write-Host "`n1. 従業員テーブルに有給関連列を追加中..." -ForegroundColor Yellow
Write-Host "   - 既存データにデフォルト入社日（2024-01-01）を設定" -ForegroundColor Gray
Write-Host "   - 有給日数を自動計算（6ヶ月経過で10日付与）" -ForegroundColor Gray
rails db:migrate:up VERSION=20250925000010

Write-Host "`n2. 有給取得記録テーブルを作成中..." -ForegroundColor Yellow
rails db:migrate:up VERSION=20250925000011

Write-Host "`n3. 有給計算ログテーブルを作成中..." -ForegroundColor Yellow
rails db:migrate:up VERSION=20250925000012

Write-Host "`n✅ 有給管理機能のマイグレーションが完了しました！" -ForegroundColor Green

Write-Host "`n📋 追加された機能:" -ForegroundColor Cyan
Write-Host "  - 従業員テーブルに入社日、有給日数、使用済み日数、残日数列を追加" -ForegroundColor White
Write-Host "  - 有給取得記録テーブル（paid_leave_records）を作成" -ForegroundColor White
Write-Host "  - 有給計算ログテーブル（paid_leave_calculation_logs）を作成" -ForegroundColor White
Write-Host "  - 従業員管理画面に入社日入力フィールドを追加" -ForegroundColor White

Write-Host "`n🔧 次のステップ:" -ForegroundColor Cyan
Write-Host "  1. ブラウザで管理画面を開く" -ForegroundColor White
Write-Host "  2. 従業員管理タブで従業員を追加/編集" -ForegroundColor White
Write-Host "  3. 入社日を入力して有給日数が自動計算されることを確認" -ForegroundColor White
