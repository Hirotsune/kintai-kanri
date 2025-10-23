class NetworkStatus
  def self.online?
    # 実際の実装では、APIエンドポイントへのpingやHTTPリクエストで判定
    begin
      # ローカルサーバーへの接続テスト
      response = Net::HTTP.get_response(URI('http://localhost:3000/api/v1/health'))
      response.code == '200'
    rescue
      false
    end
  end

  def self.offline?
    !online?
  end

  def self.check_connection
    {
      online: online?,
      timestamp: Time.current,
      server_url: 'http://localhost:3000'
    }
  end
end
