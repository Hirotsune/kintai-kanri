class AddPersonalCalendarOptimizationIndexes < ActiveRecord::Migration[8.0]
  def change
    # 個人カレンダー画面用の追加最適化インデックス
    
    # factories: is_activeフィルタ用
    add_index :factories, :is_active, 
              name: 'index_factories_on_is_active' unless index_exists?(:factories, :is_active, name: 'index_factories_on_is_active')
    
    # lines: is_activeフィルタ用
    add_index :lines, :is_active, 
              name: 'index_lines_on_is_active' unless index_exists?(:lines, :is_active, name: 'index_lines_on_is_active')
    
    # leave_types: is_activeフィルタ用
    add_index :leave_types, :is_active, 
              name: 'index_leave_types_on_is_active' unless index_exists?(:leave_types, :is_active, name: 'index_leave_types_on_is_active')
    
    # lines: 工場別・アクティブ状態の複合検索用
    add_index :lines, [:factory_id, :is_active], 
              name: 'index_lines_on_factory_id_and_is_active' unless index_exists?(:lines, [:factory_id, :is_active], name: 'index_lines_on_factory_id_and_is_active')
  end
end
