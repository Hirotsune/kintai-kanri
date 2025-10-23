class CreateAttendances < ActiveRecord::Migration[8.0]
  def change
    create_table :attendances do |t|
      t.references :employee, null: false, foreign_key: true
      t.datetime :punch_time
      t.string :punch_type
      t.date :work_date
      t.references :factory, null: false, foreign_key: true
      t.references :line, null: false, foreign_key: true
      t.string :shift_type

      t.timestamps
    end
  end
end
