class Api::V1::ReportsController < ApplicationController
  # GET /api/v1/reports/daily
  def daily
    date = params[:date] || Date.current
    @attendances = Attendance.includes(:employee, :factory, :line)
                           .joins(:employee)
                           .where(work_date: date, employees: { is_active: true })
                           .order(:punch_time)
    
    render json: {
      date: date,
      total_employees: @attendances.select(:employee_id).distinct.count,
      total_attendances: @attendances.count,
      attendances: @attendances
    }
  end

  # GET /api/v1/reports/monthly
  def monthly
    year = params[:year]&.to_i || Date.current.year
    month = params[:month]&.to_i || Date.current.month
    
    begin
      # 月の値を1-12の範囲に制限
      month = [1, [month, 12].min].max
      
      start_date = Date.new(year, month, 1)
      end_date = start_date.end_of_month
      
      @attendances = Attendance.includes(:employee, :factory, :line)
                             .joins(:employee)
                             .where(work_date: start_date..end_date, employees: { is_active: true })
                             .order(:work_date, :punch_time)
      
      render json: {
        year: year,
        month: month,
        total_attendances: @attendances.count,
        total_employees: @attendances.select(:employee_id).distinct.count,
        attendances: @attendances
      }
    rescue => e
      Rails.logger.error "Monthly report error: #{e.message}"
      render json: { error: '月次レポートの生成に失敗しました' }, status: :internal_server_error
    end
  end

  # GET /api/v1/reports/attendance_book
  def attendance_book
    year = params[:year]&.to_i || Date.current.year
    month = params[:month]&.to_i || Date.current.month
    scope = params[:scope] || 'employee'
    factory_id = params[:factory_id]
    line_id = params[:line_id]
    employee_id = params[:employee_id]

    begin
      start_date = Date.new(year, month, 1)
      end_date = start_date.end_of_month

      # 対象従業員を取得
      employees = get_target_employees(scope, factory_id, line_id, employee_id)
      
      # N+1クエリ問題を解決: 全従業員の月間勤怠データを一括取得
      employee_ids = employees.pluck(:employee_id)
      all_attendances = Attendance.where(
        employee_id: employee_ids,
        work_date: start_date..end_date
      ).order(:employee_id, :work_date)
      
      # 勤怠データを従業員IDと日付でインデックス化
      attendance_by_employee_and_date = all_attendances.group_by(&:employee_id)
                                                      .transform_values { |attendances| attendances.index_by(&:work_date) }
      
      results = []
      employees.each do |employee|
        # 事前に取得したデータから該当従業員の勤怠データを取得
        employee_attendances = attendance_by_employee_and_date[employee.employee_id] || {}
        details = get_employee_monthly_detail_optimized(employee, year, month, employee_attendances)
        results << {
          employee: {
            employee_id: employee.employee_id,
            name: employee.name,
            factory_id: employee.factory_id,
            factory_name: employee.factory&.name || '',
            line_id: employee.line_id,
            line_name: employee.line&.name || ''
          },
          details: details
        }
      end

      render json: {
        success: true,
        data: results
      }
    rescue => e
      Rails.logger.error "Attendance book error: #{e.message}"
      render json: { 
        success: false, 
        error: '出勤簿の生成に失敗しました',
        message: e.message
      }, status: :internal_server_error
    end
  end

  # GET /api/v1/reports/attendance_book_csv
  def attendance_book_csv
    year = params[:year]&.to_i || Date.current.year
    month = params[:month]&.to_i || Date.current.month
    scope = params[:scope] || 'employee'
    factory_id = params[:factory_id]
    line_id = params[:line_id]
    employee_id = params[:employee_id]

    begin
      start_date = Date.new(year, month, 1)
      end_date = start_date.end_of_month

      # 対象従業員を取得
      employees = get_target_employees(scope, factory_id, line_id, employee_id)
      
      # N+1クエリ問題を解決: 全従業員の月間勤怠データを一括取得
      employee_ids = employees.pluck(:employee_id)
      all_attendances = Attendance.where(
        employee_id: employee_ids,
        work_date: start_date..end_date
      ).order(:employee_id, :work_date)
      
      # 勤怠データを従業員IDと日付でインデックス化
      attendance_by_employee_and_date = all_attendances.group_by(&:employee_id)
                                                      .transform_values { |attendances| attendances.index_by(&:work_date) }
      
      # CSV生成（最適化版）
      csv_data = generate_attendance_book_csv_optimized(employees, year, month, attendance_by_employee_and_date)
      
      send_data csv_data, 
                filename: "出勤簿_#{year}年#{month}月.csv",
                type: 'text/csv; charset=utf-8',
                disposition: 'attachment'
    rescue => e
      Rails.logger.error "Attendance book CSV error: #{e.message}"
      render json: { 
        success: false, 
        error: 'CSV出力に失敗しました',
        message: e.message
      }, status: :internal_server_error
    end
  end

  # GET /api/v1/reports/line_daily
  def line_daily
    date = Date.parse(params[:date])
    line_id = params[:line_id]
    
    # 最適化されたクエリ：必要なカラムのみを選択し、インデックスを活用
    @attendances = Attendance.joins(:employee)
                            .includes(:factory, :line)
                            .select('attendances.*, employees.employee_id, employees.name, employees.department')
                            .where(work_date: date, line_id: line_id, employees: { is_active: true })
                            .order(:employee_id, :punch_time)
    
    # もしフィルタリング結果が0件の場合、型変換を試す
    if @attendances.size == 0 && line_id.present?
      # 数値として検索
      if line_id.match?(/^\d+$/)
        numeric_line_id = line_id.to_i
        @attendances = Attendance.joins(:employee)
                                .includes(:factory, :line)
                                .where(work_date: date, line_id: numeric_line_id, employees: { is_active: true })
                                .order(:employee_id, :punch_time)
      end
      
      # 文字列として検索
      @attendances = Attendance.joins(:employee)
                              .includes(:factory, :line)
                              .where(work_date: date, line_id: line_id.to_s, employees: { is_active: true })
                              .order(:employee_id, :punch_time)
    end
    
    # 横型データを縦型データ形式に変換
    vertical_attendances = []
    @attendances.each do |attendance|
      # 出社打刻
      if attendance.clock_in_time.present?
        vertical_attendances << {
          employee_id: attendance.employee_id,
          punch_type: '出社',
          punch_time: "#{attendance.work_date.strftime('%Y-%m-%d')} #{attendance.clock_in_time.strftime('%H:%M:%S')}",
          work_date: attendance.work_date.strftime('%Y-%m-%d'),
          employee: attendance.employee,
          factory: attendance.factory,
          line: attendance.line,
          total_work_time_15min: attendance.total_work_time_15min,
          total_work_time_10min: attendance.total_work_time_10min,
          total_work_time_5min: attendance.total_work_time_5min,
          total_work_time_1min: attendance.total_work_time_1min,
          clock_in_rounded_15min: attendance.clock_in_rounded_15min,
          clock_in_rounded_10min: attendance.clock_in_rounded_10min,
          clock_in_rounded_5min: attendance.clock_in_rounded_5min,
          clock_in_rounded_1min: attendance.clock_in_rounded_1min
        }
      end
      
      # 昼休出1
      if attendance.lunch_out1_time.present?
        vertical_attendances << {
          employee_id: attendance.employee_id,
          punch_type: '昼休出１',
          punch_time: "#{attendance.work_date.strftime('%Y-%m-%d')} #{attendance.lunch_out1_time.strftime('%H:%M:%S')}",
          work_date: attendance.work_date.strftime('%Y-%m-%d'),
          employee: attendance.employee,
          factory: attendance.factory,
          line: attendance.line,
          total_work_time_15min: attendance.total_work_time_15min,
          total_work_time_10min: attendance.total_work_time_10min,
          total_work_time_5min: attendance.total_work_time_5min,
          total_work_time_1min: attendance.total_work_time_1min,
          lunch_out1_15min: attendance.lunch_out1_15min,
          lunch_out1_10min: attendance.lunch_out1_10min,
          lunch_out1_5min: attendance.lunch_out1_5min,
          lunch_out1_1min: attendance.lunch_out1_1min
        }
      end
      
      # 昼休入1
      if attendance.lunch_in1_time.present?
        vertical_attendances << {
          employee_id: attendance.employee_id,
          punch_type: '昼休入１',
          punch_time: "#{attendance.work_date.strftime('%Y-%m-%d')} #{attendance.lunch_in1_time.strftime('%H:%M:%S')}",
          work_date: attendance.work_date.strftime('%Y-%m-%d'),
          employee: attendance.employee,
          factory: attendance.factory,
          line: attendance.line,
          total_work_time_15min: attendance.total_work_time_15min,
          total_work_time_10min: attendance.total_work_time_10min,
          total_work_time_5min: attendance.total_work_time_5min,
          total_work_time_1min: attendance.total_work_time_1min,
          lunch_in1_15min: attendance.lunch_in1_15min,
          lunch_in1_10min: attendance.lunch_in1_10min,
          lunch_in1_5min: attendance.lunch_in1_5min,
          lunch_in1_1min: attendance.lunch_in1_1min
        }
      end
      
      # 昼休出2
      if attendance.lunch_out2_time.present?
        vertical_attendances << {
          employee_id: attendance.employee_id,
          punch_type: '昼休出２',
          punch_time: "#{attendance.work_date.strftime('%Y-%m-%d')} #{attendance.lunch_out2_time.strftime('%H:%M:%S')}",
          work_date: attendance.work_date.strftime('%Y-%m-%d'),
          employee: attendance.employee,
          factory: attendance.factory,
          line: attendance.line,
          total_work_time_15min: attendance.total_work_time_15min,
          total_work_time_10min: attendance.total_work_time_10min,
          total_work_time_5min: attendance.total_work_time_5min,
          total_work_time_1min: attendance.total_work_time_1min,
          lunch_out2_15min: attendance.lunch_out2_15min,
          lunch_out2_10min: attendance.lunch_out2_10min,
          lunch_out2_5min: attendance.lunch_out2_5min,
          lunch_out2_1min: attendance.lunch_out2_1min
        }
      end
      
      # 昼休入2
      if attendance.lunch_in2_time.present?
        vertical_attendances << {
          employee_id: attendance.employee_id,
          punch_type: '昼休入２',
          punch_time: "#{attendance.work_date.strftime('%Y-%m-%d')} #{attendance.lunch_in2_time.strftime('%H:%M:%S')}",
          work_date: attendance.work_date.strftime('%Y-%m-%d'),
          employee: attendance.employee,
          factory: attendance.factory,
          line: attendance.line,
          total_work_time_15min: attendance.total_work_time_15min,
          total_work_time_10min: attendance.total_work_time_10min,
          total_work_time_5min: attendance.total_work_time_5min,
          total_work_time_1min: attendance.total_work_time_1min,
          lunch_in2_15min: attendance.lunch_in2_15min,
          lunch_in2_10min: attendance.lunch_in2_10min,
          lunch_in2_5min: attendance.lunch_in2_5min,
          lunch_in2_1min: attendance.lunch_in2_1min
        }
      end
      
      # 退社打刻
      if attendance.clock_out_time.present?
        vertical_attendances << {
          employee_id: attendance.employee_id,
          punch_type: '退社',
          punch_time: "#{attendance.work_date.strftime('%Y-%m-%d')} #{attendance.clock_out_time.strftime('%H:%M:%S')}",
          work_date: attendance.work_date.strftime('%Y-%m-%d'),
          employee: attendance.employee,
          factory: attendance.factory,
          line: attendance.line,
          total_work_time_15min: attendance.total_work_time_15min,
          total_work_time_10min: attendance.total_work_time_10min,
          total_work_time_5min: attendance.total_work_time_5min,
          total_work_time_1min: attendance.total_work_time_1min,
          clock_out_rounded_15min: attendance.clock_out_rounded_15min,
          clock_out_rounded_10min: attendance.clock_out_rounded_10min,
          clock_out_rounded_5min: attendance.clock_out_rounded_5min,
          clock_out_rounded_1min: attendance.clock_out_rounded_1min
        }
      end
    end
    
    render json: {
      date: date,
      line_id: line_id,
      total_attendances: vertical_attendances.count,
      total_employees: @attendances.distinct.count(:employee_id),
      attendances: vertical_attendances
    }
  end

  # GET /api/v1/reports/line_monthly
  def line_monthly
    year = params[:year]&.to_i || Date.current.year
    month = params[:month]&.to_i || Date.current.month
    line_id = params[:line_id]
    
    begin
      # 月の値を1-12の範囲に制限
      month = [1, [month, 12].min].max
      
      start_date = Date.new(year, month, 1)
      end_date = start_date.end_of_month
      
      @attendances = Attendance.includes(:employee, :factory, :line)
                             .joins(:employee)
                             .where(work_date: start_date..end_date, employees: { is_active: true })
      
      if line_id.present?
        @attendances = @attendances.where(line_id: line_id)
      end
      
      @attendances = @attendances.order(:work_date, :employee_id)
      
      render json: {
        year: year,
        month: month,
        line_id: line_id,
        total_attendances: @attendances.count,
        total_employees: @attendances.select(:employee_id).distinct.count,
        attendances: @attendances
      }
    rescue => e
      Rails.logger.error "Line monthly report error: #{e.message}"
      render json: { error: 'ライン別月次レポートの生成に失敗しました' }, status: :internal_server_error
    end
  end

  # GET /api/v1/reports/monthly_attendance
  def monthly_attendance
    year = params[:year]&.to_i || Date.current.year
    month = params[:month]&.to_i || Date.current.month
    factory_id = params[:factory_id]
    employee_id = params[:employee_id]
    
    begin
      # 月の値を1-12の範囲に制限
      month = [1, [month, 12].min].max
      
      start_date = Date.new(year, month, 1)
      end_date = start_date.end_of_month
      
      # 基本クエリ（アクティブな従業員のみ、横型テーブル用）
      # 必要なカラムのみを選択してメモリ使用量を削減
      @attendances = Attendance.joins(:employee, :factory, :line)
                             .select('attendances.*, employees.employee_id, employees.name, employees.department, 
                                     factories.name as factory_name, lines.name as line_name')
                             .where(work_date: start_date..end_date, employees: { is_active: true })
      
      # 工場フィルタリング
      if factory_id.present?
        @attendances = @attendances.where(factory_id: factory_id)
      end
      
      # 社員フィルタリング
      if employee_id.present?
        @attendances = @attendances.where(employee_id: employee_id)
      end
      
      @attendances = @attendances.order(:employee_id, :work_date)
      
      # 横型テーブル用のデータ整理
      monthly_data = {}
      
      @attendances.each do |attendance|
        emp_id = attendance.employee_id
        day = attendance.work_date.day
        
        # 関連オブジェクトの情報を直接使用（N+1クエリを回避）
        monthly_data[emp_id] ||= {
          employee_id: attendance.employee_id,
          employee_name: attendance.name,
          department: attendance.department,
          factory_name: attendance.factory_name,
          line_name: attendance.line_name,
          daily_data: {}
        }
        
        # 各日の勤怠データを格納（横型テーブルでは1行に1日分のデータ）
        work_hours = format_work_hours(attendance)
        
        monthly_data[emp_id][:daily_data][day] = work_hours
      end
      
      # 月間データを従業員別に整理
      processed_data = monthly_data.map do |emp_id, data|
        daily_data = data[:daily_data]
        
        # 各日の勤務時間を取得
        hours = {}
        (1..end_date.day).each do |day|
          hours[day] = daily_data[day] || ''
        end
        
        {
          id: emp_id, # employee_idをidとして使用
          employee_id: data[:employee_id],
          name: data[:employee_name],
          department: data[:department],
          factory_name: data[:factory_name] || '',
          line_name: data[:line_name] || '',
          hours: hours
        }
      end
      
      render json: {
        year: year,
        month: month,
        factory_id: factory_id,
        employee_id: employee_id,
        total_employees: processed_data.count,
        total_attendances: @attendances.size,
        data: processed_data
      }
    rescue => e
      Rails.logger.error "Monthly attendance report error: #{e.message}"
      render json: { error: '月間勤怠実績表の生成に失敗しました' }, status: :internal_server_error
    end
  end

  # GET /api/v1/reports/monthly_band_summary
  def monthly_band_summary
    year = params[:year]&.to_i || Date.current.year
    month = params[:month]&.to_i || Date.current.month
    factory_id = params[:factory_id]
    employee_query = params[:employee_query]
    
    begin
      # 月の値を1-12の範囲に制限
      month = [1, [month, 12].min].max
      
      start_date = Date.new(year, month, 1)
      end_date = start_date.end_of_month
      
      # 従業員検索の最適化（先に従業員IDを取得）
      employee_ids = nil
      if employee_query.present?
        begin
          # インデックスを活用するため、前方一致検索を優先
          employee_ids = Employee.where(is_active: true)
                                .where("employee_id LIKE ? OR name LIKE ?", 
                                       "#{employee_query}%", "#{employee_query}%")
                                .pluck(:employee_id)
          
          # 前方一致で見つからない場合は部分一致を試行
          if employee_ids.empty?
            employee_ids = Employee.where(is_active: true)
                                  .where("employee_id ILIKE ? OR name ILIKE ?", 
                                         "%#{employee_query}%", "%#{employee_query}%")
                                  .pluck(:employee_id)
          end
          
          return render json: {
            year: year,
            month: month,
            factory_id: factory_id,
            employee_query: employee_query,
            total_employees: 0,
            total_attendances: 0,
            summaries: []
          } if employee_ids.empty?
        rescue => e
          Rails.logger.warn "Employee search error: #{e.message}"
          return render json: { error: '従業員検索でエラーが発生しました' }, status: :internal_server_error
          end
        end
        
      # アクティブな社員を取得（勤怠データの有無に関係なく）
      employees_query = Employee.includes(:factory).where(is_active: true)
      
      # 工場でフィルタリング
      if factory_id.present?
        employees_query = employees_query.where(factory_id: factory_id)
      end
      
      # 従業員でフィルタリング
      if employee_ids.present?
        employees_query = employees_query.where(employee_id: employee_ids)
      end
      
      @employees = employees_query.order(:employee_id)
      
      # 勤怠データを取得
      attendances_query = Attendance.joins(:employee, :factory, :line)
                                   .where(work_date: start_date..end_date)
                                   .where(employees: { is_active: true })
      
      # 工場でフィルタリング
      if factory_id.present?
        attendances_query = attendances_query.where(factory_id: factory_id)
      end
      
      # 従業員でフィルタリング
      if employee_ids.present?
            attendances_query = attendances_query.where(employee_id: employee_ids)
      end
      
      @attendances = attendances_query.order(:employee_id, :work_date)
      
      # 効率化された集計処理（N+1問題を解決）
      employee_summaries = {}
      
      # まず全アクティブ社員の初期データを作成
      @employees.each do |employee|
        employee_summaries[employee.employee_id] = {
          employee: employee,
          factory_name: employee.factory&.name || employee.factory_id,
          work_days: Set.new,
          standard_hours: 160.0,
          period1: { night: 0, early: 0, day: 0, evening: 0, total: 0 },
          period2: { night: 0, early: 0, day: 0, evening: 0, total: 0 },
          monthly: { night: 0, early: 0, day: 0, evening: 0, total: 0 },
          actual_working_hours: 0,
          overtime_hours: 0,
          daily_minutes: {} # 日別勤務時間をキャッシュ
        }
      end
      
      # 勤怠データを処理
      @attendances.each do |attendance|
        employee_id = attendance.employee_id
        work_date = attendance.work_date
        
        # 出勤日数をカウント
        employee_summaries[employee_id][:work_days].add(work_date)
        
        # 日別勤務時間を累積（同じ日の複数レコードに対応）
        daily_minutes = attendance.total_work_time_15min || 0
        employee_summaries[employee_id][:daily_minutes][work_date] ||= 0
        employee_summaries[employee_id][:daily_minutes][work_date] += daily_minutes
      end
      
      # 各従業員の集計を計算（効率化）
      employee_summaries.each do |employee_id, summary|
        # 出勤日数を整数に変換
        summary[:work_days] = summary[:work_days].size
        
        # 管理設定のカラムから勤務時間を取得（15分毎、10分毎の設定に従う）
        total_work_minutes = 0
        period1_minutes = { night: 0, early: 0, day: 0, evening: 0 }
        period2_minutes = { night: 0, early: 0, day: 0, evening: 0 }
        
        # 日別勤務時間を処理（キャッシュされたデータを使用）
        summary[:daily_minutes].each do |work_date, daily_minutes|
          total_work_minutes += daily_minutes
          
          # 時間帯別集計（Pythonの実装に合わせた時間帯分布）
          if daily_minutes > 0
            bucket = work_date.day <= 16 ? period1_minutes : period2_minutes
            distribute_work_time_by_band(bucket, daily_minutes, work_date)
          end
        end
        
        # 分を時間に変換（小数1位に丸め）
        total_work_hours = (total_work_minutes / 60.0).round(1)
        
        summary[:period1] = {
          night: (period1_minutes[:night] / 60.0).round(1),
          early: (period1_minutes[:early] / 60.0).round(1),
          day: (period1_minutes[:day] / 60.0).round(1),
          evening: (period1_minutes[:evening] / 60.0).round(1)
        }
        summary[:period1][:total] = summary[:period1].values.sum.round(1)
        
        summary[:period2] = {
          night: (period2_minutes[:night] / 60.0).round(1),
          early: (period2_minutes[:early] / 60.0).round(1),
          day: (period2_minutes[:day] / 60.0).round(1),
          evening: (period2_minutes[:evening] / 60.0).round(1)
        }
        summary[:period2][:total] = summary[:period2].values.sum.round(1)
        
        # 月間合計
        summary[:monthly] = {
          night: (summary[:period1][:night] + summary[:period2][:night]).round(1),
          early: (summary[:period1][:early] + summary[:period2][:early]).round(1),
          day: (summary[:period1][:day] + summary[:period2][:day]).round(1),
          evening: (summary[:period1][:evening] + summary[:period2][:evening]).round(1)
        }
        summary[:monthly][:total] = summary[:monthly].values.sum.round(1)
        
        # 実労働時間と残業時間
        summary[:actual_working_hours] = total_work_hours
        summary[:overtime_hours] = [total_work_hours - summary[:standard_hours], 0].max
        
        # キャッシュデータを削除（レスポンスに含めない）
        summary.delete(:daily_minutes)
      end
      
      # ソート処理
      sorted_summaries = employee_summaries.values.sort do |a, b|
        if factory_id.present?
          # 工場が指定されている場合は社員コード順のみ（数値として比較）
          a_employee_id = a[:employee].employee_id.to_i
          b_employee_id = b[:employee].employee_id.to_i
          a_employee_id <=> b_employee_id
        else
          # 工場が未選択の場合は工場順、次に社員コード順
          factory_comparison = a[:factory_name] <=> b[:factory_name]
          if factory_comparison == 0
            # 工場が同じ場合は社員コード順（数値として比較）
            a_employee_id = a[:employee].employee_id.to_i
            b_employee_id = b[:employee].employee_id.to_i
            a_employee_id <=> b_employee_id
          else
            factory_comparison
          end
        end
      end
      
      render json: {
        year: year,
        month: month,
        factory_id: factory_id,
        employee_query: employee_query,
        total_employees: employee_summaries.count,
        total_attendances: @attendances.size,
        summaries: sorted_summaries
      }
        rescue => e
          Rails.logger.error "Monthly band summary error: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          
          # 運用時のエラーを詳細にログ出力
          Rails.logger.error "Error context: year=#{year}, month=#{month}, factory_id=#{factory_id}, employee_query=#{employee_query}"
          
          render json: { 
            error: '月次時間帯別集計の生成に失敗しました',
            details: Rails.env.development? ? e.message : nil,
            year: year,
            month: month,
            factory_id: factory_id,
            employee_query: employee_query
          }, status: :internal_server_error
        end
      end

  # GET /api/v1/reports/line_monthly_summary
  def line_monthly_summary
    line_id = params[:line_id]
    year = params[:year]&.to_i || Date.current.year
    month = params[:month]&.to_i || Date.current.month
    
    begin
      # ライン情報を取得
      line = Line.find_by(line_id: line_id)
      return render json: { error: 'ラインが見つかりません' }, status: :not_found unless line
      
      # 月の範囲を設定
      start_date = Date.new(year, month, 1)
      end_date = start_date.end_of_month
      
      # 月の日数分のカレンダーを生成
      calendar_days = []
      (start_date..end_date).each do |date|
        calendar_days << {
          day: date.day,
          date: date,
          is_weekend: date.sunday? || date.saturday?
        }
      end
      
      # 日別サマリーを生成
      daily_summaries = []
      (start_date..end_date).each do |date|
        # その日の勤怠データを取得（アクティブな従業員のみ）
        day_attendances = Attendance.joins(:employee)
                                  .where(line_id: line.line_id, work_date: date, employees: { is_active: true })
        
        
        # 従業員別の勤怠時間を計算
        employee_hours = {}
        employee_punches = {}
        
        # 従業員別の勤務時間を計算（横型データ構造対応）
        day_attendances.each do |attendance|
          employee_id = attendance.employee_id
          
          # 出社時間と退社時間が両方ある場合のみ勤務時間を計算
          if attendance.clock_in_time.present? && attendance.clock_out_time.present?
            # 15分刻みの勤務時間を使用（デフォルト）
            work_minutes = attendance.total_work_time_15min || 0
            work_hours = work_minutes / 60.0
            
            employee_hours[employee_id] = work_hours
          else
            # 出社または退社のどちらかが欠けている場合は0時間
            employee_hours[employee_id] = 0.0
          end
        end
        
        total_employees = employee_hours.keys.count
        total_hours = employee_hours.values.sum
        attendance_rate = total_employees > 0 ? 1.0 : 0.0 # 簡易版
        
        daily_summaries << {
          date: date.strftime('%Y-%m-%d'),
          total_employees: total_employees,
          total_hours: total_hours,
          attendance_rate: attendance_rate
        }
      end
      
      # 月間サマリーを計算
      monthly_summary = {
        total_work_days: calendar_days.count { |day| !day[:is_weekend] },
        total_employees: daily_summaries.map { |d| d[:total_employees] }.max || 0,
        total_hours: daily_summaries.sum { |d| d[:total_hours] },
        average_attendance_rate: daily_summaries.sum { |d| d[:attendance_rate] } / daily_summaries.count.to_f
      }
      
      render json: {
        line: {
          id: line.id,
          line_id: line.line_id,
          name: line.name,
          factory_id: line.factory_id,
          is_active: line.is_active,
          created_at: line.created_at,
          updated_at: line.updated_at
        },
        daily_summaries: daily_summaries,
        monthly_summary: monthly_summary
      }
    rescue => e
      Rails.logger.error "Line monthly summary error: #{e.message}"
      render json: { error: 'ライン別月次サマリーの生成に失敗しました' }, status: :internal_server_error
    end
  end

  # GET /api/v1/reports/error_list
  def error_list
    date = params[:date] || Date.current
    factory_id = params[:factory_id]
    line_id = params[:line_id]
    mode = params[:mode] || 'checklist' # 'checklist' or 'errorlist'
    
    begin
      work_date = Date.parse(date.to_s)
      
      # 基本クエリ（横型テーブル用：1行に1日分の全打刻データ）
      attendances_query = Attendance.joins(:employee, :factory, :line)
                                   .select('attendances.*, employees.employee_id, employees.name, employees.department,
                                           factories.name as factory_name, lines.name as line_name')
                                   .where(work_date: work_date, employees: { is_active: true })
      
      # 工場でフィルタリング
      if factory_id.present?
        attendances_query = attendances_query.where(factory_id: factory_id)
      end
      
      # ラインでフィルタリング
      if line_id.present?
        attendances_query = attendances_query.where(line_id: line_id)
      end
      
      @attendances = attendances_query.order(:employee_id)
      
      # チェックリスト用のデータを生成（横型テーブル対応）
      check_rows = []
      @attendances.each do |attendance|
        # 打刻漏れをチェック
        has_error = false
        missing_punches = []
        
        # 必須の打刻をチェック（出社と退社は必須）
        if attendance.clock_in_time.blank?
          has_error = true
          missing_punches << '出社'
        end
        if attendance.clock_out_time.blank?
          has_error = true
          missing_punches << '退社'
        end
        
        # 勤務時間を計算（10分刻みの実労働時間を使用）
        work_time = ''
        if attendance.clock_in_time.present? && attendance.clock_out_time.present?
          # 10分刻みの実労働時間を使用
          total_minutes = attendance.total_work_time_10min || 0
          if total_minutes > 0
            hours = (total_minutes / 60).floor
            minutes = (total_minutes % 60).round
            work_time = "#{hours}:#{minutes.to_s.rjust(2, '0')}"
          else
            work_time = '0:00'
          end
        end
        
        # エラーリストモードの場合は、エラーがある従業員のみ表示
        if mode == 'errorlist' && !has_error
          next
        end
        
        check_rows << {
          employee_id: attendance.employee_id,
          employee_name: attendance.name,
          punch1: attendance.clock_in_time&.strftime('%H:%M') || '',
          punch2: attendance.lunch_out1_time&.strftime('%H:%M') || '',
          punch3: attendance.lunch_in1_time&.strftime('%H:%M') || '',
          punch4: attendance.lunch_out2_time&.strftime('%H:%M') || '',
          punch5: attendance.lunch_in2_time&.strftime('%H:%M') || '',
          punch6: attendance.clock_out_time&.strftime('%H:%M') || '',
          work_time: work_time,
          has_error: has_error,
          missing_punches: missing_punches
        }
      end
      
      render json: {
        date: work_date.strftime('%Y-%m-%d'),
        factory_id: factory_id,
        line_id: line_id,
        mode: mode,
        total_employees: check_rows.count,
        check_rows: check_rows
      }
    rescue => e
      Rails.logger.error "Error list report error: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { error: '勤怠チェックリストの生成に失敗しました' }, status: :internal_server_error
    end
  end

  # GET /api/v1/reports/attendance_summary
  def attendance_summary
    date = Date.parse(params[:date])
    line_id = params[:line_id]
    
    begin
      # 指定されたラインの従業員を取得（必要なカラムのみ選択）
      employees = Employee.joins(:line)
                         .select('employees.employee_id, employees.name, employees.line_id, employees.factory_id')
                         .where(line_id: line_id, is_active: true)
      
      # 従業員IDのリストを取得
      employee_ids = employees.map(&:employee_id)
      
      # 一括で勤怠データを取得（N+1問題を解決）
      attendances = Attendance.where(employee_id: employee_ids, work_date: date)
                             .select('employee_id, clock_in_time, lunch_out1_time, lunch_in1_time, 
                                     lunch_out2_time, lunch_in2_time, clock_out_time, 
                                     total_work_time_10min, note')
      
      # 勤怠データを従業員IDでインデックス化
      attendance_map = attendances.index_by(&:employee_id)
      
      # 各従業員の勤怠データを処理
      summaries = employees.map do |employee|
        attendance = attendance_map[employee.employee_id]
        
        # 勤務時間計算（10分刻みの実労働時間を使用）
        work_time = ''
        if attendance&.clock_in_time.present? && attendance&.clock_out_time.present?
          total_minutes = attendance.total_work_time_10min || 0
          if total_minutes > 0
            hours = (total_minutes / 60).floor
            minutes = (total_minutes % 60).round
            work_time = "#{hours}:#{minutes.to_s.rjust(2, '0')}"
          else
            work_time = '0:00'
          end
        end
        
        {
          employee_id: employee.employee_id,
          employee_name: employee.name,
          punch1: attendance&.clock_in_time&.strftime('%H:%M') || '',
          punch2: attendance&.lunch_out1_time&.strftime('%H:%M') || '',
          punch3: attendance&.lunch_in1_time&.strftime('%H:%M') || '',
          punch4: attendance&.lunch_out2_time&.strftime('%H:%M') || '',
          punch5: attendance&.lunch_in2_time&.strftime('%H:%M') || '',
          punch6: attendance&.clock_out_time&.strftime('%H:%M') || '',
          work_time: work_time,
          note: attendance&.note || ''
        }
      end
      
      render json: {
        date: date.strftime('%Y-%m-%d'),
        line_id: line_id,
        rows: summaries
      }
    rescue => e
      Rails.logger.error "Attendance summary error: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { error: '勤怠サマリーの取得に失敗しました' }, status: :internal_server_error
    end
  end

  # POST /api/v1/reports/attendance_batch_save
  def attendance_batch_save
    work_date = Date.parse(params[:date])
    line_id = params[:line_id]
    entries = params[:entries] || []
    
    begin
      saved_count = 0
      
      # 各従業員の勤怠データを保存（横型テーブル対応）
      entries.each do |entry|
        employee_id = entry[:employee_id]
        next if employee_id.blank?
          
          # 従業員情報を取得
          employee = Employee.find_by(employee_id: employee_id)
          next unless employee
          
        # 既存の勤怠データを削除（同じ日付・従業員）
        Attendance.where(employee_id: employee_id, work_date: work_date).destroy_all
        
        # 横型テーブル用の勤怠レコードを作成（1行に1日分の全打刻データ）
        attendance_data = {
            employee_id: employee_id,
            work_date: work_date,
            factory_id: employee.factory_id,
            line_id: employee.line_id,
            shift_type: 'morning', # デフォルト値
          note: entry[:note].present? ? entry[:note].to_s : ''
        }
        
        # 各打刻時間を設定（空文字列や不正な値をチェック）
        if entry[:start].present? && entry[:start].to_s.strip != ''
          begin
            attendance_data[:clock_in_time] = Time.parse("#{work_date} #{entry[:start]}").strftime('%H:%M:%S')
          rescue => e
            Rails.logger.error "Invalid start time: #{entry[:start]} - #{e.message}"
          end
        end
        
        if entry[:lunchOut1].present? && entry[:lunchOut1].to_s.strip != ''
          begin
            attendance_data[:lunch_out1_time] = Time.parse("#{work_date} #{entry[:lunchOut1]}").strftime('%H:%M:%S')
          rescue => e
            Rails.logger.error "Invalid lunchOut1 time: #{entry[:lunchOut1]} - #{e.message}"
          end
        end
        
        if entry[:lunchIn1].present? && entry[:lunchIn1].to_s.strip != ''
          begin
            attendance_data[:lunch_in1_time] = Time.parse("#{work_date} #{entry[:lunchIn1]}").strftime('%H:%M:%S')
          rescue => e
            Rails.logger.error "Invalid lunchIn1 time: #{entry[:lunchIn1]} - #{e.message}"
          end
        end
        
        if entry[:lunchOut2].present? && entry[:lunchOut2].to_s.strip != ''
          begin
            attendance_data[:lunch_out2_time] = Time.parse("#{work_date} #{entry[:lunchOut2]}").strftime('%H:%M:%S')
          rescue => e
            Rails.logger.error "Invalid lunchOut2 time: #{entry[:lunchOut2]} - #{e.message}"
          end
        end
        
        if entry[:lunchIn2].present? && entry[:lunchIn2].to_s.strip != ''
          begin
            attendance_data[:lunch_in2_time] = Time.parse("#{work_date} #{entry[:lunchIn2]}").strftime('%H:%M:%S')
          rescue => e
            Rails.logger.error "Invalid lunchIn2 time: #{entry[:lunchIn2]} - #{e.message}"
          end
        end
        
        if entry[:end].present? && entry[:end].to_s.strip != ''
          begin
            attendance_data[:clock_out_time] = Time.parse("#{work_date} #{entry[:end]}").strftime('%H:%M:%S')
          rescue => e
            Rails.logger.error "Invalid end time: #{entry[:end]} - #{e.message}"
          end
        end
        
        # 勤務時間を計算（15分刻み）
        if attendance_data[:clock_in_time].present? && attendance_data[:clock_out_time].present?
          start_time = Time.parse("#{work_date} #{attendance_data[:clock_in_time]}")
          end_time = Time.parse("#{work_date} #{attendance_data[:clock_out_time]}")
          
          # 退社時刻が出社時刻より早い場合は翌日として扱う（夜勤対応）
          if end_time <= start_time
            end_time = end_time + 1.day
          end
          
          # 昼休み時間を差し引く（簡易版：1時間）
          lunch_break = 1.hour
          total_seconds = (end_time - start_time) - lunch_break
          total_minutes = (total_seconds / 60).round
          
          # 15分刻みに丸める
          total_minutes = (total_minutes / 15) * 15
          attendance_data[:total_work_time_15min] = total_minutes
        end
        
        # 空の文字列をnilに変換
        attendance_data.each do |key, value|
          if value.is_a?(String) && value.strip.empty?
            attendance_data[key] = nil
          end
        end
        
        # 勤怠レコードを作成
        Attendance.create!(attendance_data)
        saved_count += 1
      end
      
      render json: {
        success: true,
        saved_records: saved_count,
        message: "#{saved_count}件の勤怠データを保存しました"
      }
    rescue => e
      Rails.logger.error "Attendance batch save error: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { 
        success: false, 
        message: "勤怠データの保存に失敗しました: #{e.message}" 
      }, status: :internal_server_error
    end
  end

  private

  # 勤務時間を時間帯別に分布させる（Pythonの実装に合わせる）
  def distribute_work_time_by_band(bucket, daily_minutes, work_date)
    # 時間帯定義（Pythonの実装に合わせる）
    # night: 22:00-24:00 と 00:00-05:00
    # early: 05:00-09:00
    # day: 09:00-18:00
    # evening: 18:00-22:00

    # 簡易的な分布（実際の打刻時刻が分からないため、一般的な勤務パターンを仮定）
    # 日勤中心の仮定で分布
    bucket[:day] += (daily_minutes * 0.7).round  # 70%を日勤時間帯に
    bucket[:early] += (daily_minutes * 0.2).round  # 20%を早朝時間帯に
    bucket[:evening] += (daily_minutes * 0.1).round  # 10%を夕方時間帯に
    # nightは通常の日勤では0とする
  end

  # 勤務時間をフォーマット（横型テーブル用）
  def format_work_hours(attendance)
    return '' if attendance.nil?
    
    # 時間刻みモードを取得（デフォルトは10分刻み）
    rounding_mode = '10' # デフォルト値を設定
    
    # 各刻みモードでの総労働時間を取得
    begin
      total_work_time = attendance.send("total_work_time_#{rounding_mode}min")
    rescue => e
      Rails.logger.error "Error accessing total_work_time_#{rounding_mode}min: #{e.message}"
      return ''
    end
    
    return '' if total_work_time.nil? || total_work_time == 0
    
    # 分を時間:分形式に変換
    hours = (total_work_time / 60).floor
    minutes = (total_work_time % 60).round
    
    result = "#{hours}:#{minutes.to_s.rjust(2, '0')}"
    result
  end

  private

  def calculate_work_time_for_summary(punch_data, work_date)
    return '' unless punch_data['出社'] && punch_data['退社']
    
    begin
      start_time = punch_data['出社'].punch_time
      end_time = punch_data['退社'].punch_time
      
      # 出社時間が深夜3時未満の場合は前日出勤扱い
      if start_time.hour < 3
        start_time += 1.day
        end_time += 1.day
      elsif end_time < start_time
        end_time += 1.day
      end
      
      # 昼休み時間を計算
      lunch_break_minutes = 0
      if punch_data['昼休出１'] && punch_data['昼休入１']
        lunch_out1 = punch_data['昼休出１'].punch_time
        lunch_in1 = punch_data['昼休入１'].punch_time
        lunch_break_minutes += (lunch_in1 - lunch_out1) / 60
      end
      if punch_data['昼休出２'] && punch_data['昼休入２']
        lunch_out2 = punch_data['昼休出２'].punch_time
        lunch_in2 = punch_data['昼休入２'].punch_time
        lunch_break_minutes += (lunch_in2 - lunch_out2) / 60
      end
      
      # 勤務時間を計算
      total_minutes = (end_time - start_time) / 60 - lunch_break_minutes
      hours = (total_minutes / 60).floor
      minutes = (total_minutes % 60).floor
      
      "#{hours}:#{minutes.to_s.rjust(2, '0')}"
    rescue
      '計算エラー'
    end
  end

  private

  def get_target_employees(scope, factory_id, line_id, employee_id)
    case scope
    when 'all'
      Employee.where(is_active: true).includes(:factory, :line)
    when 'factory'
      Employee.where(is_active: true, factory_id: factory_id).includes(:factory, :line)
    when 'line'
      Employee.where(is_active: true, line_id: line_id).includes(:factory, :line)
    when 'employee'
      if employee_id.present?
        Employee.where(is_active: true, employee_id: employee_id).includes(:factory, :line)
      else
        Employee.where(is_active: true).limit(1).includes(:factory, :line)
      end
    else
      Employee.where(is_active: true).limit(1).includes(:factory, :line)
    end
  end

  # 最適化された月間詳細取得メソッド（N+1クエリ問題解決版）
  def get_employee_monthly_detail_optimized(employee, year, month, attendance_by_date)
    start_date = Date.new(year, month, 1)
    end_date = start_date.end_of_month
    
    details = []
    
    # 月の全日付を処理
    (start_date..end_date).each do |date|
      attendance = attendance_by_date[date]
      
      # 勤務区分を判定
      work_type = ''
      if attendance&.clock_in_time.present?
        work_type = '出勤'
      elsif date.wday < 5 # 平日
        work_type = '' # 平日で出社なしは欠勤
      end
      
      # 勤務時間を計算（横型テーブル対応）
      work_time = calculate_work_time_for_attendance_book_horizontal(attendance)
      
      # エラー判定
      error_count = 0
      error_content = ''
      
      # 未来の日付の場合は何も表示しない
      if date > Date.current
        error_content = ''
      # 土日の場合は何も表示しない
      elsif date.wday >= 6
        error_content = ''
      # 平日で出社がない場合はデータ無し
      elsif date.wday < 5 && attendance&.clock_in_time.blank?
        error_count = 1
        error_content = 'データ無し'
      # 出社があるが退社がない場合は退社打刻なし
      elsif attendance&.clock_in_time.present? && attendance&.clock_out_time.blank?
        error_count = 1
        error_content = '退社打刻なし'
      end
      
      details << {
        date: date.strftime('%Y-%m-%d'),
        dayOfWeek: %w[日 月 火 水 木 金 土][date.wday],
        workType: work_type,
        start1: attendance&.clock_in_time&.strftime('%H:%M') || '',
        lunchOut1: attendance&.lunch_out1_time&.strftime('%H:%M') || '',
        lunchIn1: attendance&.lunch_in1_time&.strftime('%H:%M') || '',
        lunchOut2: attendance&.lunch_out2_time&.strftime('%H:%M') || '',
        lunchIn2: attendance&.lunch_in2_time&.strftime('%H:%M') || '',
        end2: attendance&.clock_out_time&.strftime('%H:%M') || '',
        workTime: work_time,
        errorCount: error_count,
        errorContent: error_content
      }
    end
    
    details
  end

  # 元のメソッド（後方互換性のため保持）
  def get_employee_monthly_detail(employee, year, month)
    start_date = Date.new(year, month, 1)
    end_date = start_date.end_of_month
    
    # 月間の勤怠データを取得（横型テーブル対応）
    # インデックス最適化: employee_id + work_date の複合インデックスを使用
    attendances = Attendance.where(
      employee_id: employee.employee_id,
      work_date: start_date..end_date
    ).order(:work_date)
    
    # 勤怠データを日付でインデックス化（メモリ効率化）
    attendance_by_date = attendances.index_by(&:work_date)
    
    details = []
    
    # 月の全日付を処理
    (start_date..end_date).each do |date|
      attendance = attendance_by_date[date]
      
      # 勤務区分を判定
      work_type = ''
      if attendance&.clock_in_time.present?
        work_type = '出勤'
      elsif date.wday < 5 # 平日
        work_type = '' # 平日で出社なしは欠勤
      end
      
      # 勤務時間を計算（横型テーブル対応）
      work_time = calculate_work_time_for_attendance_book_horizontal(attendance)
      
      # エラー判定
      error_count = 0
      error_content = ''
      
      # 未来の日付の場合は何も表示しない
      if date > Date.current
        error_content = ''
      # 土日の場合は何も表示しない
      elsif date.wday >= 6
        error_content = ''
      # 平日で出社がない場合はデータ無し
      elsif date.wday < 5 && attendance&.clock_in_time.blank?
        error_count = 1
        error_content = 'データ無し'
      # 出社があるが退社がない場合は退社打刻なし
      elsif attendance&.clock_in_time.present? && attendance&.clock_out_time.blank?
        error_count = 1
        error_content = '退社打刻なし'
      end
      
      details << {
        date: date.strftime('%Y-%m-%d'),
        dayOfWeek: %w[日 月 火 水 木 金 土][date.wday],
        workType: work_type,
        start1: attendance&.clock_in_time&.strftime('%H:%M') || '',
        lunchOut1: attendance&.lunch_out1_time&.strftime('%H:%M') || '',
        lunchIn1: attendance&.lunch_in1_time&.strftime('%H:%M') || '',
        lunchOut2: attendance&.lunch_out2_time&.strftime('%H:%M') || '',
        lunchIn2: attendance&.lunch_in2_time&.strftime('%H:%M') || '',
        end2: attendance&.clock_out_time&.strftime('%H:%M') || '',
        workTime: work_time,
        errorCount: error_count,
        errorContent: error_content
      }
    end
    
    details
  end

  def calculate_work_time_for_attendance_book(punch_data)
    return '' unless punch_data['出社'] && punch_data['退社']
    
    begin
      start_time = punch_data['出社'].punch_time
      end_time = punch_data['退社'].punch_time
      
      # 夜勤対応（翌日早朝退社）
      if end_time.hour < 3 && end_time < start_time
        end_time += 1.day
      elsif end_time < start_time
        end_time += 1.day
      end
      
      # 昼休み時間を計算
      lunch_break_minutes = 0
      if punch_data['昼休出１'] && punch_data['昼休入１']
        lunch_out1 = punch_data['昼休出１'].punch_time
        lunch_in1 = punch_data['昼休入１'].punch_time
        lunch_break_minutes += (lunch_in1 - lunch_out1) / 60
      end
      if punch_data['昼休出２'] && punch_data['昼休入２']
        lunch_out2 = punch_data['昼休出２'].punch_time
        lunch_in2 = punch_data['昼休入２'].punch_time
        lunch_break_minutes += (lunch_in2 - lunch_out2) / 60
      end
      
      # 勤務時間を計算
      total_minutes = (end_time - start_time) / 60 - lunch_break_minutes
      hours = (total_minutes / 60).floor
      minutes = (total_minutes % 60).floor
      
      "#{hours}:#{minutes.to_s.rjust(2, '0')}"
    rescue
      ''
    end
  end

  def calculate_work_time_for_attendance_book_horizontal(attendance)
    return '' unless attendance&.clock_in_time && attendance&.clock_out_time
    
    begin
      start_time = attendance.clock_in_time
      end_time = attendance.clock_out_time
      
      # 夜勤対応（翌日早朝退社）
      if end_time.hour < 3 && end_time < start_time
        end_time += 1.day
      elsif end_time < start_time
        end_time += 1.day
      end
      
      # 昼休み時間を計算（横型テーブル対応）
      lunch_break_minutes = 0
      if attendance.lunch_out1_time && attendance.lunch_in1_time
        lunch_out1 = attendance.lunch_out1_time
        lunch_in1 = attendance.lunch_in1_time
        lunch_break_minutes += (lunch_in1 - lunch_out1) / 60
      end
      if attendance.lunch_out2_time && attendance.lunch_in2_time
        lunch_out2 = attendance.lunch_out2_time
        lunch_in2 = attendance.lunch_in2_time
        lunch_break_minutes += (lunch_in2 - lunch_out2) / 60
      end
      
      # 勤務時間を計算
      total_minutes = (end_time - start_time) / 60 - lunch_break_minutes
      hours = (total_minutes / 60).floor
      minutes = (total_minutes % 60).floor
      
      "#{hours}:#{minutes.to_s.rjust(2, '0')}"
    rescue
      ''
    end
  end

  # 最適化されたCSV生成メソッド（N+1クエリ問題解決版）
  def generate_attendance_book_csv_optimized(employees, year, month, attendance_by_employee_and_date)
    require 'csv'
    
    CSV.generate(encoding: 'UTF-8') do |csv|
      # ヘッダー行
      csv << [
        '勤怠年月', '工場', 'ライン', '社員ID', '社員名',
        '出勤日', '曜日', '勤務区分', '出社', '昼休出１', '昼休入１', 
        '昼休出２', '昼休入２', '退社', '勤務時間', 'エラー内容'
      ]
      
      employees.each do |employee|
        # 事前に取得したデータから該当従業員の勤怠データを取得
        employee_attendances = attendance_by_employee_and_date[employee.employee_id] || {}
        details = get_employee_monthly_detail_optimized(employee, year, month, employee_attendances)
        
        details.each do |detail|
          csv << [
            "#{year}年#{month}月",
            employee.factory_id,
            employee.line_id,
            employee.employee_id,
            employee.name,
            detail[:date],
            detail[:dayOfWeek],
            detail[:workType],
            detail[:start1],
            detail[:lunchOut1],
            detail[:lunchIn1],
            detail[:lunchOut2],
            detail[:lunchIn2],
            detail[:end2],
            detail[:workTime],
            detail[:errorContent]
          ]
        end
      end
    end
  end

  # 元のCSV生成メソッド（後方互換性のため保持）
  def generate_attendance_book_csv(employees, year, month)
    require 'csv'
    
    CSV.generate(encoding: 'UTF-8') do |csv|
      # ヘッダー行
      csv << [
        '勤怠年月', '工場', 'ライン', '社員ID', '社員名',
        '出勤日', '曜日', '勤務区分', '出社', '昼休出１', '昼休入１', 
        '昼休出２', '昼休入２', '退社', '勤務時間', 'エラー内容'
      ]
      
      employees.each do |employee|
        details = get_employee_monthly_detail(employee, year, month)
        
        details.each do |detail|
          csv << [
            "#{year}年#{month}月",
            employee.factory_id,
            employee.line_id,
            employee.employee_id,
            employee.name,
            detail[:date],
            detail[:dayOfWeek],
            detail[:workType],
            detail[:start1],
            detail[:lunchOut1],
            detail[:lunchIn1],
            detail[:lunchOut2],
            detail[:lunchIn2],
            detail[:end2],
            detail[:workTime],
            detail[:errorContent]
          ]
        end
      end
    end
  end

  private
end