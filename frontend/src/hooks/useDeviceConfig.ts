import { useState, useEffect } from 'react';
import { deviceConfigApi } from '../services/api';

interface DeviceConfig {
  device_id: string;
  device_name: string;
  device_type: 'kiosk' | 'admin' | 'mobile';
  location: string;
  show_factory_selection: boolean;
  show_line_selection: boolean;
  punch_buttons: string[];
  line_ids: number[];
  display_lines?: Array<{
    id: number;
    line_id: string;
    name: string;
    factory_id: string;
  }>;
  display_factories?: Array<{
    id: number;
    factory_id: string;
    name: string;
  }>;
}

export const useDeviceConfig = () => {
  const [config, setConfig] = useState<DeviceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        // URLパラメータから端末IDを取得
        const urlParams = new URLSearchParams(window.location.search);
        const deviceId = urlParams.get('device') || 'DEFAULT';
        
        if (!deviceId) {
          setError('端末IDが設定されていません');
          setLoading(false);
          return;
        }

        // DEFAULTの場合はデータベースから設定を取得
        if (deviceId === 'DEFAULT') {
          console.log('DEFAULT端末IDのため、データベースから設定を取得します');
          
          try {
            const data = await deviceConfigApi.getByEnv('DEFAULT');
            setConfig(data);
            setError(null);
            setLoading(false);
            return;
          } catch (error: any) {
            if (error.response?.status === 404) {
              // DEFAULT設定が存在しない場合はデフォルト設定を作成
              console.log('DEFAULT設定が存在しないため、デフォルト設定を適用します');
              const defaultConfig: DeviceConfig = {
                device_id: 'DEFAULT',
                device_name: 'DEFAULT (デフォルト)',
                device_type: 'kiosk' as const,
                location: '未設定',
                show_factory_selection: true,
                show_line_selection: true,
                punch_buttons: ['出社', '退社', '昼休出1', '昼休入1', '昼休出2', '昼休入2'],
                line_ids: [],
                display_lines: [],
                display_factories: []
              };
              setConfig(defaultConfig);
              setError(null);
              setLoading(false);
              return;
            } else {
              throw error;
            }
          }
        }

        // データベースから設定を取得
        const data = await deviceConfigApi.getByEnv(deviceId);
        setConfig(data);
      } catch (error: any) {
        console.error('設定の読み込みに失敗:', error);
        if (error.response?.status === 404) {
          // URLパラメータから端末IDを再取得
          const urlParams = new URLSearchParams(window.location.search);
          const deviceId = urlParams.get('device') || 'DEFAULT';
          
          // 端末IDが見つからない場合はデフォルト設定（全機能）を適用
          console.log(`端末ID "${deviceId}" の設定が見つからないため、デフォルト設定（全機能）を適用します`);
          
          setConfig({
            device_id: deviceId,
            device_name: `${deviceId} (デフォルト)`,
            device_type: 'kiosk' as const,
            location: '未設定',
            show_factory_selection: false, // 未登録IDの場合は工場選択は無効
            show_line_selection: true,
            punch_buttons: ['出社', '退社', '昼休出1', '昼休入1', '昼休出2', '昼休入2'],
            line_ids: [], // 全ライン表示
            display_lines: [],
            display_factories: []
          });
          setError(null); // エラーをクリア
        } else {
          setError('設定の読み込みに失敗しました');
        }
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  return { config, loading, error };
};

