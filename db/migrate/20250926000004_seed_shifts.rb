class SeedShifts < ActiveRecord::Migration[8.0]
  def up
    # 既存のシフトデータを削除
    Shift.destroy_all

    # 固定の8種類のシフトデータを作成
    default_shifts = [
      {
        name: '2H',
        start_time: '09:00',
        duration_hours: 2.0,
        date_boundary_hour: 6,
        factory_id: nil,
        description: '2H'
      },
      {
        name: '3H',
        start_time: '09:00',
        duration_hours: 3.0,
        date_boundary_hour: 6,
        factory_id: nil,
        description: '3H'
      },
      {
        name: '4H',
        start_time: '09:00',
        duration_hours: 4.0,
        date_boundary_hour: 6,
        factory_id: nil,
        description: '4H'
      },
      {
        name: '5H',
        start_time: '09:00',
        duration_hours: 5.0,
        date_boundary_hour: 6,
        factory_id: nil,
        description: '5H'
      },
      {
        name: '6H',
        start_time: '09:00',
        duration_hours: 6.0,
        date_boundary_hour: 6,
        factory_id: nil,
        description: '6H'
      },
      {
        name: '6H休憩あり',
        start_time: '09:00',
        duration_hours: 6.0,
        date_boundary_hour: 6,
        factory_id: nil,
        description: '6H休憩あり'
      },
      {
        name: '7H休憩あり',
        start_time: '09:00',
        duration_hours: 7.0,
        date_boundary_hour: 6,
        factory_id: nil,
        description: '7H休憩あり'
      },
      {
        name: '8H休憩あり',
        start_time: '09:00',
        duration_hours: 8.0,
        date_boundary_hour: 6,
        factory_id: nil,
        description: '8H休憩あり'
      }
    ]

    default_shifts.each do |shift_data|
      Shift.find_or_create_by!(name: shift_data[:name]) do |shift|
        shift.start_time = shift_data[:start_time]
        shift.duration_hours = shift_data[:duration_hours]
        shift.date_boundary_hour = shift_data[:date_boundary_hour]
        shift.factory_id = shift_data[:factory_id]
        shift.description = shift_data[:description]
        shift.is_active = true
      end
    end
  end

  def down
    # 作成したシフトを削除
    default_shift_names = ['2H', '3H', '4H', '5H', '6H', '6H休憩あり', '7H休憩あり', '8H休憩あり']
    Shift.where(name: default_shift_names).destroy_all
  end
end
