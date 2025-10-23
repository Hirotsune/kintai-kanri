require 'rails_helper'

RSpec.describe "Api::V1::Attendances", type: :request do
  describe "GET /index" do
    it "returns http success" do
      get "/api/v1/attendances/index"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /show" do
    it "returns http success" do
      get "/api/v1/attendances/show"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /create" do
    it "returns http success" do
      get "/api/v1/attendances/create"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /update" do
    it "returns http success" do
      get "/api/v1/attendances/update"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /destroy" do
    it "returns http success" do
      get "/api/v1/attendances/destroy"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /punch" do
    it "returns http success" do
      get "/api/v1/attendances/punch"
      expect(response).to have_http_status(:success)
    end
  end

end
