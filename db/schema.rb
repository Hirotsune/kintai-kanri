# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_10_15_033154) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "admin_passwords", force: :cascade do |t|
    t.string "password_digest", null: false
    t.string "description"
    t.boolean "is_active", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["is_active"], name: "index_admin_passwords_on_is_active"
  end

  create_table "allowance_settings", force: :cascade do |t|
    t.string "allowance_type", null: false
    t.string "name", null: false
    t.decimal "rate", precision: 5, scale: 2, default: "0.0"
    t.decimal "fixed_amount", precision: 8, scale: 2, default: "0.0"
    t.string "calculation_type", null: false
    t.string "condition_type", null: false
    t.string "condition_value", null: false
    t.boolean "is_legal_requirement", default: false
    t.boolean "is_active", default: true
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["allowance_type"], name: "index_allowance_settings_on_allowance_type"
    t.index ["is_active"], name: "index_allowance_settings_on_is_active"
  end

  create_table "attendances", id: false, force: :cascade do |t|
    t.date "work_date", null: false
    t.string "factory_id", null: false
    t.string "line_id", null: false
    t.string "employee_id", limit: 10, null: false
    t.string "employee_name"
    t.datetime "punch_time"
    t.string "punch_type"
    t.string "shift_type"
    t.time "scheduled_start_time"
    t.time "scheduled_end_time"
    t.integer "scheduled_break_duration_minutes"
    t.time "clock_in_time"
    t.time "clock_in_rounded_15min"
    t.time "clock_in_rounded_10min"
    t.time "clock_in_rounded_5min"
    t.time "clock_in_rounded_1min"
    t.time "lunch_out1_time"
    t.time "lunch_out1_15min"
    t.time "lunch_out1_10min"
    t.time "lunch_out1_5min"
    t.time "lunch_out1_1min"
    t.time "lunch_in1_time"
    t.time "lunch_in1_15min"
    t.time "lunch_in1_10min"
    t.time "lunch_in1_5min"
    t.time "lunch_in1_1min"
    t.time "lunch_out2_time"
    t.time "lunch_out2_15min"
    t.time "lunch_out2_10min"
    t.time "lunch_out2_5min"
    t.time "lunch_out2_1min"
    t.time "lunch_in2_time"
    t.time "lunch_in2_15min"
    t.time "lunch_in2_10min"
    t.time "lunch_in2_5min"
    t.time "lunch_in2_1min"
    t.time "clock_out_time"
    t.time "clock_out_rounded_15min"
    t.time "clock_out_rounded_10min"
    t.time "clock_out_rounded_5min"
    t.time "clock_out_rounded_1min"
    t.decimal "overtime_hours", precision: 4, scale: 2, default: "0.0"
    t.integer "overtime_15min", default: 0, comment: "15分刻み残業時間（分）"
    t.integer "overtime_10min", default: 0, comment: "10分刻み残業時間（分）"
    t.integer "overtime_5min", default: 0, comment: "5分刻み残業時間（分）"
    t.integer "overtime_1min", default: 0, comment: "1分刻み残業時間（分）"
    t.integer "total_work_time_15min", default: 0, comment: "15分刻み実労働時間（分）"
    t.integer "total_work_time_10min", default: 0, comment: "10分刻み実労働時間（分）"
    t.integer "total_work_time_5min", default: 0, comment: "5分刻み実労働時間（分）"
    t.integer "total_work_time_1min", default: 0, comment: "1分刻み実労働時間（分）"
    t.decimal "overtime_allowance", precision: 8, scale: 2, default: "0.0"
    t.decimal "night_work_allowance", precision: 8, scale: 2, default: "0.0"
    t.decimal "holiday_work_allowance", precision: 8, scale: 2, default: "0.0"
    t.decimal "early_work_allowance", precision: 8, scale: 2, default: "0.0"
    t.decimal "night_shift_allowance", precision: 8, scale: 2, default: "0.0"
    t.decimal "night_work_hours", precision: 4, scale: 2, default: "0.0"
    t.decimal "holiday_work_hours", precision: 4, scale: 2, default: "0.0"
    t.decimal "total_legal_allowance", precision: 8, scale: 2, default: "0.0"
    t.decimal "total_company_allowance", precision: 8, scale: 2, default: "0.0"
    t.decimal "total_allowance", precision: 8, scale: 2, default: "0.0"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "note", limit: 500
    t.string "clock_in_line_id", comment: "出社時のラインID"
    t.string "lunch_in1_line_id", comment: "昼休入1時のラインID"
    t.string "lunch_in2_line_id", comment: "昼休入2時のラインID"
    t.string "clock_out_line_id", comment: "退社時のラインID"
    t.index ["clock_in_line_id"], name: "index_attendances_on_clock_in_line_id"
    t.index ["clock_in_time"], name: "index_attendances_on_clock_in_time"
    t.index ["clock_out_line_id"], name: "index_attendances_on_clock_out_line_id"
    t.index ["clock_out_time"], name: "index_attendances_on_clock_out_time"
    t.index ["employee_id", "work_date", "factory_id"], name: "index_attendances_on_employee_work_date_factory"
    t.index ["employee_id", "work_date"], name: "index_attendances_on_employee_id_and_work_date"
    t.index ["employee_id"], name: "index_attendances_on_employee_id"
    t.index ["employee_name"], name: "index_attendances_on_employee_name"
    t.index ["factory_id"], name: "index_attendances_on_factory_id"
    t.index ["line_id", "work_date"], name: "index_attendances_on_line_id_work_date"
    t.index ["line_id"], name: "index_attendances_on_line_id"
    t.index ["lunch_in1_line_id"], name: "index_attendances_on_lunch_in1_line_id"
    t.index ["lunch_in2_line_id"], name: "index_attendances_on_lunch_in2_line_id"
    t.index ["scheduled_end_time"], name: "index_attendances_on_scheduled_end_time"
    t.index ["scheduled_start_time"], name: "index_attendances_on_scheduled_start_time"
    t.index ["shift_type"], name: "index_attendances_on_shift_type"
    t.index ["work_date", "employee_id", "clock_in_time"], name: "index_attendances_on_work_date_employee_clock_in", where: "(clock_in_time IS NOT NULL)"
    t.index ["work_date", "employee_id", "punch_time"], name: "index_attendances_on_work_date_employee_punch_time"
    t.index ["work_date", "employee_id"], name: "index_attendances_on_work_date_and_employee_id"
    t.index ["work_date", "factory_id"], name: "index_attendances_on_work_date_and_factory_id"
    t.index ["work_date", "line_id", "employee_id"], name: "index_attendances_on_work_date_line_employee"
    t.index ["work_date", "line_id"], name: "index_attendances_on_work_date_and_line_id"
    t.index ["work_date"], name: "index_attendances_on_work_date"
  end

  create_table "data_retention_settings", force: :cascade do |t|
    t.string "table_name", null: false
    t.integer "retention_years", default: 3, null: false
    t.boolean "archive_before_delete", default: true
    t.string "archive_location"
    t.boolean "is_active", default: true
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["is_active"], name: "index_data_retention_settings_on_is_active"
    t.index ["table_name"], name: "index_data_retention_settings_on_table_name", unique: true
  end

  create_table "device_configs", force: :cascade do |t|
    t.string "device_id", null: false
    t.string "device_name", null: false
    t.string "device_type", default: "kiosk"
    t.string "location"
    t.boolean "show_factory_selection", default: false
    t.boolean "show_line_selection", default: false
    t.text "punch_buttons_config"
    t.text "line_ids_config"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "shift_input_enabled", default: false, null: false
    t.index ["device_id"], name: "index_device_configs_on_device_id", unique: true
  end

  create_table "employee_shifts", force: :cascade do |t|
    t.bigint "employee_id", null: false
    t.bigint "shift_id", null: false
    t.boolean "is_default", default: false
    t.date "effective_from"
    t.date "effective_to"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["employee_id", "effective_from", "effective_to"], name: "idx_emp_shifts_effective"
    t.index ["employee_id", "is_default"], name: "index_employee_shifts_on_employee_id_and_is_default"
    t.index ["employee_id"], name: "index_employee_shifts_on_employee_id"
    t.index ["shift_id"], name: "index_employee_shifts_on_shift_id"
  end

  create_table "employees", force: :cascade do |t|
    t.string "employee_id"
    t.string "name"
    t.string "department"
    t.string "line_id", null: false
    t.string "factory_id", null: false
    t.string "status"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "is_active", default: true, null: false
    t.string "position", default: "employee"
    t.string "position_name", default: "一般社員"
    t.boolean "overtime_allowance_eligible", default: true
    t.boolean "night_work_allowance_eligible", default: true
    t.boolean "holiday_work_allowance_eligible", default: true
    t.boolean "early_work_allowance_eligible", default: true
    t.boolean "night_shift_allowance_eligible", default: true
    t.datetime "position_changed_at"
    t.string "previous_position"
    t.date "hire_date", null: false, comment: "入社日"
    t.integer "paid_leave_days", default: 0, comment: "有給日数"
    t.integer "used_paid_leave_days", default: 0, comment: "使用済み有給日数"
    t.integer "remaining_paid_leave_days", default: 0, comment: "有給残日数"
    t.date "last_paid_leave_calculation_date", comment: "最終有給計算日"
    t.string "name_kana", comment: "社員名（ひらがな）"
    t.index ["factory_id", "line_id", "is_active"], name: "index_employees_on_factory_line_active"
    t.index ["factory_id"], name: "index_employees_on_factory_id"
    t.index ["hire_date"], name: "index_employees_on_hire_date"
    t.index ["is_active", "employee_id"], name: "index_employees_on_active_and_employee_id"
    t.index ["is_active", "name"], name: "index_employees_on_active_and_name"
    t.index ["last_paid_leave_calculation_date"], name: "index_employees_on_last_paid_leave_calculation_date"
    t.index ["line_id", "is_active", "employee_id"], name: "index_employees_on_line_active_employee_id"
    t.index ["line_id", "is_active"], name: "index_employees_on_line_id_and_is_active"
    t.index ["line_id"], name: "index_employees_on_line_id"
    t.index ["name_kana"], name: "index_employees_on_name_kana"
    t.index ["night_work_allowance_eligible"], name: "index_employees_on_night_work_allowance_eligible"
    t.index ["overtime_allowance_eligible"], name: "index_employees_on_overtime_allowance_eligible"
    t.index ["position"], name: "index_employees_on_position"
  end

  create_table "factories", force: :cascade do |t|
    t.string "factory_id"
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "is_active", default: true
    t.index ["factory_id"], name: "index_factories_on_factory_id", unique: true
    t.index ["is_active"], name: "index_factories_on_is_active"
  end

  create_table "leave_types", force: :cascade do |t|
    t.string "name", null: false
    t.string "code", null: false
    t.text "description"
    t.boolean "requires_approval", default: true
    t.boolean "is_paid", default: false
    t.boolean "is_active", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_leave_types_on_code", unique: true
    t.index ["is_active"], name: "index_leave_types_on_is_active"
  end

  create_table "lines", force: :cascade do |t|
    t.string "line_id"
    t.string "name"
    t.string "factory_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "is_active", default: true, null: false
    t.index ["factory_id", "is_active"], name: "index_lines_on_factory_id_and_is_active"
    t.index ["factory_id"], name: "index_lines_on_factory_id"
    t.index ["is_active"], name: "index_lines_on_is_active"
    t.index ["line_id"], name: "index_lines_on_line_id", unique: true
  end

  create_table "offline_changes", force: :cascade do |t|
    t.string "table_name", null: false
    t.string "operation", null: false
    t.string "record_id"
    t.jsonb "data", null: false
    t.jsonb "original_data"
    t.string "status", default: "pending"
    t.datetime "synced_at"
    t.text "error_message"
    t.integer "retry_count", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["data"], name: "index_offline_changes_on_data", using: :gin
    t.index ["status", "created_at"], name: "index_offline_changes_on_status_and_created_at"
    t.index ["table_name", "operation"], name: "index_offline_changes_on_table_name_and_operation"
  end

  create_table "paid_leave_calculation_logs", force: :cascade do |t|
    t.string "employee_id", null: false, comment: "従業員ID"
    t.date "calculation_date", null: false, comment: "計算日"
    t.integer "previous_days", default: 0, comment: "前回の有給日数"
    t.integer "new_days", null: false, comment: "新しい有給日数"
    t.integer "added_days", null: false, comment: "追加された日数"
    t.string "calculation_reason", null: false, comment: "計算理由"
    t.text "notes", comment: "備考"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["calculation_date"], name: "index_paid_leave_calculation_logs_on_calculation_date"
    t.index ["calculation_reason"], name: "index_paid_leave_calculation_logs_on_calculation_reason"
    t.index ["employee_id"], name: "index_paid_leave_calculation_logs_on_employee_id"
  end

  create_table "paid_leave_records", force: :cascade do |t|
    t.string "employee_id", null: false, comment: "従業員ID"
    t.date "leave_date", null: false, comment: "有給取得日"
    t.integer "days", default: 1, null: false, comment: "取得日数"
    t.string "reason", comment: "取得理由"
    t.string "status", default: "approved", comment: "承認状態"
    t.text "notes", comment: "備考"
    t.string "approved_by", comment: "承認者"
    t.datetime "approved_at", comment: "承認日時"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["employee_id", "leave_date"], name: "index_paid_leave_records_on_employee_id_and_leave_date", unique: true
    t.index ["employee_id"], name: "index_paid_leave_records_on_employee_id"
    t.index ["leave_date"], name: "index_paid_leave_records_on_leave_date"
    t.index ["status"], name: "index_paid_leave_records_on_status"
  end

  create_table "position_settings", force: :cascade do |t|
    t.string "position_code", null: false
    t.string "position_name", null: false
    t.integer "hierarchy_level", null: false
    t.boolean "overtime_allowance_eligible", default: true
    t.boolean "night_work_allowance_eligible", default: true
    t.boolean "holiday_work_allowance_eligible", default: true
    t.boolean "early_work_allowance_eligible", default: true
    t.boolean "night_shift_allowance_eligible", default: true
    t.decimal "position_allowance", precision: 8, scale: 2, default: "0.0"
    t.decimal "management_allowance", precision: 8, scale: 2, default: "0.0"
    t.boolean "is_active", default: true
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["hierarchy_level"], name: "index_position_settings_on_hierarchy_level"
    t.index ["position_code"], name: "index_position_settings_on_position_code"
  end

  create_table "schedule_entries", force: :cascade do |t|
    t.string "employee_id", null: false
    t.date "schedule_date", null: false
    t.string "schedule_type", null: false
    t.integer "shift_id"
    t.string "leave_type"
    t.time "start_time"
    t.time "end_time"
    t.string "reason"
    t.string "status", default: "scheduled"
    t.string "created_by"
    t.string "approved_by"
    t.datetime "approved_at"
    t.text "notes"
    t.boolean "is_active", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "is_compensatory", default: false, comment: "振り替え休日フラグ"
    t.date "original_date", comment: "元の勤務日（振り替えの場合）"
    t.string "compensatory_type", comment: "振り替え種別（substitute, compensatory）"
    t.jsonb "allowance_override", default: {}, comment: "手当計算の上書き設定"
    t.jsonb "business_rules", default: {}, comment: "柔軟な業務ルール設定"
    t.index ["allowance_override"], name: "index_schedule_entries_on_allowance_override", using: :gin
    t.index ["business_rules"], name: "index_schedule_entries_on_business_rules", using: :gin
    t.index ["compensatory_type"], name: "index_schedule_entries_on_compensatory_type"
    t.index ["employee_id", "schedule_date", "is_active"], name: "index_schedule_entries_on_employee_date_active"
    t.index ["employee_id", "schedule_date"], name: "index_schedule_entries_on_employee_id_and_schedule_date"
    t.index ["is_compensatory"], name: "index_schedule_entries_on_is_compensatory"
    t.index ["original_date"], name: "index_schedule_entries_on_original_date"
    t.index ["schedule_date", "employee_id", "schedule_type"], name: "index_schedule_entries_on_date_employee_type"
    t.index ["schedule_date", "is_active"], name: "index_schedule_entries_on_date_active"
    t.index ["schedule_type"], name: "index_schedule_entries_on_schedule_type"
    t.index ["status"], name: "index_schedule_entries_on_status"
  end

  create_table "shifts", force: :cascade do |t|
    t.string "name", null: false
    t.time "start_time", null: false
    t.decimal "duration_hours", precision: 3, scale: 1, null: false
    t.integer "date_boundary_hour", null: false
    t.string "factory_id"
    t.boolean "is_active", default: true
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["factory_id", "is_active"], name: "index_shifts_on_factory_id_and_is_active"
    t.index ["name"], name: "index_shifts_on_name"
  end

  create_table "system_settings", force: :cascade do |t|
    t.string "key", null: false
    t.string "value", null: false
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "time_rounding_mode", default: 15
    t.index ["key"], name: "index_system_settings_on_key", unique: true
  end

  add_foreign_key "employee_shifts", "employees"
  add_foreign_key "employee_shifts", "shifts"
  add_foreign_key "employees", "factories", primary_key: "factory_id"
  add_foreign_key "employees", "lines", primary_key: "line_id"
  add_foreign_key "schedule_entries", "shifts"
end
