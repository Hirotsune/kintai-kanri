require 'rails_helper'

RSpec.describe "Api::V1::Reports", type: :request do
  describe "GET /daily" do
    it "returns http success" do
      get "/api/v1/reports/daily"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /monthly" do
    it "returns http success" do
      get "/api/v1/reports/monthly"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /line_daily" do
    it "returns http success" do
      get "/api/v1/reports/line_daily"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /line_monthly" do
    it "returns http success" do
      get "/api/v1/reports/line_monthly"
      expect(response).to have_http_status(:success)
    end
  end

end
