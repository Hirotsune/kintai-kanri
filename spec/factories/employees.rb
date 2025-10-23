FactoryBot.define do
  factory :employee do
    employee_id { "MyString" }
    name { "MyString" }
    department { "MyString" }
    line { nil }
    #factory { nil }
    status { "MyString" }
  end
end
