Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      # 工場管理
      resources :factories
      
      # ライン管理
      resources :lines
      
      # 従業員管理
      resources :employees
      
      # シフト管理
      resources :shifts
      resources :employee_shifts
      
      # スケジュール管理
      resources :schedule_entries do
        collection do
          post :bulk_create
          post :create_compensatory_holiday
          post :create_substitute_holiday
          get :compensatory_holidays
          get :substitute_holidays
        end
        member do
          patch :use_substitute
        end
      end
      
      # 休暇種別管理
      resources :leave_types
      
      # システム設定（削除 - device_configsに統合）
      
      # 端末設定管理
      resources :device_configs, param: :device_id
      get 'device_configs/env/:device_id', to: 'device_configs#get_by_env'
      get 'device_configs/:device_id/shift_input_enabled', to: 'device_configs#get_shift_input_enabled'
      post 'device_configs/:device_id/set_shift_input_enabled', to: 'device_configs#set_shift_input_enabled'
      
      # 管理者パスワード管理
      resources :admin_passwords
      post 'admin_passwords/authenticate', to: 'admin_passwords#authenticate'
      
      # システム設定管理
      resources :system_settings, param: :key
      get 'system_settings/shift_input_enabled', to: 'system_settings#shift_input_enabled'
      post 'system_settings/set_shift_input_enabled', to: 'system_settings#set_shift_input_enabled'
      get 'system_settings/time_rounding_mode', to: 'system_settings#time_rounding_mode'
      post 'system_settings/set_time_rounding_mode', to: 'system_settings#set_time_rounding_mode'
      get 'system_settings/time_rounding_options', to: 'system_settings#time_rounding_options'
      
      # 手当て設定管理
      resources :allowance_settings do
        collection do
          get :types
          get :active
          get 'by_type/:type', to: 'allowance_settings#by_type'
        end
      end
      
      # 役職設定管理
      resources :position_settings do
        collection do
          get :codes
          get :active
          get :hierarchy
          get :fully_eligible
          get :restricted
        end
      end
      
      # 勤怠管理
      resources :attendances do
        collection do
          post :punch  # 打刻用のカスタムアクション
          get 'employee/:employee_id/date/:date', to: 'attendances#get_by_employee_and_date'  # 社員・日付別勤怠取得
        end
      end
      
      # レポート
      namespace :reports do
        get :daily
        get :monthly
        get :line_daily
        get :line_monthly
        get :line_monthly_summary
        get :monthly_attendance
        get :monthly_band_summary
        get :error_list
        get :attendance_summary
        post :attendance_batch_save
        get :attendance_book
        get :attendance_book_csv
      end
    end
  end
end