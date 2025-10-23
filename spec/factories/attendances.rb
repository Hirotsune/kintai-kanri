FactoryBot.define do
  factory :attendance do
    employee { nil }
    punch_time { "2025-09-03 09:11:12" }
    punch_type { "MyString" }
    work_date { "2025-09-03" }
    #factory { nil }
    line { nil }
    shift_type { "MyString" }
  end
end
