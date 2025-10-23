Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # ローカル開発環境
    origins 'http://localhost:3000'
    
    # Amplify本番環境
    origins 'https://staging.d36n7im1whhgo.amplifyapp.com'
    
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: false
  end
end