import React, { useState, useEffect } from 'react';
import { Typography, Box } from '@mui/material';
import { 
  AccessTime, 
  Assessment, 
  Settings, 
  Home as HomeIcon,
  Schedule,
  People,
  CheckCircle,
  Edit,
  Book,
  PunchClock,
  Timeline,
  BarChart,
  ErrorOutline,
  Input,
  AdminPanelSettings,
  Assignment,
  ShoppingCart,
  CalendarToday,
  ScheduleSend
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import AdminPasswordDialog from '../components/AdminPasswordDialog';
import '../styles/custom.css';

const Home: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showPasswordDialog, setShowPasswordDialog] = useState(() => {
    // 他の画面から戻ってきた場合は認証済みとして扱う
    // ただし、初回アクセス時は必ずパスワード認証を求める
    const isFromOtherPage = sessionStorage.getItem('fromOtherPage') === 'true';
    const isAuthenticated = sessionStorage.getItem('mainAuthenticated') === 'true';
    
    // 他の画面から戻ってきた場合は認証不要
    if (isFromOtherPage) {
      return false;
    }
    
    // 初回アクセス時は認証が必要
    return !isAuthenticated;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // セッションストレージから認証状態を復元
    const isFromOtherPage = sessionStorage.getItem('fromOtherPage') === 'true';
    const mainAuthenticated = sessionStorage.getItem('mainAuthenticated') === 'true';
    
    // 他の画面から戻ってきた場合は認証済みとして扱う
    return isFromOtherPage || mainAuthenticated;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // fromOtherPageフラグが設定されている場合の処理
  useEffect(() => {
    const isFromOtherPage = sessionStorage.getItem('fromOtherPage') === 'true';
    if (isFromOtherPage && !isAuthenticated) {
      setIsAuthenticated(true);
      setShowPasswordDialog(false);
    }
  }, [isAuthenticated]);

  // ページを離れた際のログアウト処理
  useEffect(() => {
    const handleBeforeUnload = () => {
      // ページを離れる際に認証状態をクリア
      sessionStorage.removeItem('mainAuthenticated');
    };

    const handleVisibilityChange = () => {
      // タブが非表示になった際も認証状態をクリア
      if (document.hidden) {
        sessionStorage.removeItem('mainAuthenticated');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${weekdays[date.getDay()]}）`;
  };

  const handleAuthenticationSuccess = () => {
    setIsAuthenticated(true);
    setShowPasswordDialog(false);
    // セッションストレージに認証状態を保存
    sessionStorage.setItem('mainAuthenticated', 'true');
    // 他の画面からのフラグをクリア
    sessionStorage.removeItem('fromOtherPage');
  };

  const handleClosePasswordDialog = () => {
    setShowPasswordDialog(false);
    // 認証に失敗した場合はページを閉じるか、エラーページにリダイレクト
    if (!isAuthenticated) {
      window.close();
    }
  };

  // 認証されていない場合はパスワードダイアログを表示
  if (!isAuthenticated) {
    return (
      <AdminPasswordDialog
        open={showPasswordDialog}
        onClose={handleClosePasswordDialog}
        onSuccess={handleAuthenticationSuccess}
      />
    );
  }

  return (
    <Box>
      {/* 現在時刻表示 */}
      <div className="clock fade-in">
        <div className="time">{formatTime(currentTime)}</div>
        <div className="date">{formatDate(currentTime)}</div>
      </div>

      {/* メインメニューレイアウト */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginTop: '20px',
        height: 'calc(100vh - 160px)',
        paddingBottom: '40px'
      }}>
        {/* 左側: 勤怠入力（大きなカード） */}
        <div style={{ flex: '2.2' }}>
          <div className="card fade-in" style={{ 
            cursor: 'pointer', 
            height: 'calc(100% - 20px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '44px',
            marginBottom: '20px',
            animationDelay: '0.1s'
          }} onClick={() => {
            const urlParams = new URLSearchParams(window.location.search);
            const deviceId = urlParams.get('device');
            window.location.href = `/punch${deviceId ? `?device=${deviceId}` : ''}`;
          }}>
            <PunchClock sx={{ fontSize: 80, color: '#1976d2', marginBottom: '20px' }} />
            <h1 style={{ 
              fontSize: 'clamp(32px, 6vw, 48px)', 
              margin: '0 0 20px 0',
              color: '#1976d2',
              fontWeight: 'bold'
            }}>
              勤怠入力
            </h1>
            <p style={{ 
              fontSize: 'clamp(16px, 3vw, 20px)', 
              color: 'var(--text-gray)',
              margin: 0
            }}>
              出社・退社の打刻を簡単に行うことができます
            </p>
          </div>
        </div>

        {/* 右側: 2x2グリッド */}
        <div style={{ flex: '1.1', display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' }}>
          {/* 上段 */}
          <div style={{ display: 'flex', gap: '20px', flex: '1' }}>
            {/* 申請 */}
            <div className="card fade-in" style={{ 
              cursor: 'pointer', 
              flex: '1',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              padding: '22px'
            }} onClick={() => {
              const urlParams = new URLSearchParams(window.location.search);
              const deviceId = urlParams.get('device');
              window.location.href = `/application${deviceId ? `?device=${deviceId}` : ''}`;
            }}>
              <Assignment sx={{ fontSize: 48, color: '#1976d2', marginBottom: '10px' }} />
              <h2 style={{ 
                fontSize: 'clamp(18px, 4vw, 24px)', 
                margin: '0 0 10px 0',
                color: '#1976d2'
              }}>
                申請
              </h2>
              <p style={{ 
                fontSize: 'clamp(12px, 2.5vw, 14px)', 
                color: 'var(--text-gray)',
                margin: 0
              }}>
                各種申請を行います
              </p>
            </div>

            {/* 勤怠シフト入力 */}
            <div className="card fade-in" style={{ 
              cursor: 'pointer', 
              flex: '1',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              padding: '22px'
            }} onClick={() => {
              const urlParams = new URLSearchParams(window.location.search);
              const deviceId = urlParams.get('device');
              window.location.href = `/shift-input${deviceId ? `?device=${deviceId}` : ''}`;
            }}>
              <ScheduleSend sx={{ fontSize: 48, color: '#1976d2', marginBottom: '10px' }} />
              <h2 style={{ 
                fontSize: 'clamp(18px, 4vw, 24px)', 
                margin: '0 0 10px 0',
                color: '#1976d2'
              }}>
                勤怠シフト入力
              </h2>
              <p style={{ 
                fontSize: 'clamp(12px, 2.5vw, 14px)', 
                color: 'var(--text-gray)',
                margin: 0
              }}>
                シフトの入力・管理を行います
              </p>
            </div>
          </div>

          {/* 下段 */}
          <div style={{ display: 'flex', gap: '20px', flex: '1' }}>
            {/* 個人カレンダー */}
            <div className="card fade-in" style={{ 
              cursor: 'pointer', 
              flex: '1',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              padding: '22px'
            }} onClick={() => {
              const urlParams = new URLSearchParams(window.location.search);
              const deviceId = urlParams.get('device');
              window.location.href = `/personal-calendar${deviceId ? `?device=${deviceId}` : ''}`;
            }}>
              <CalendarToday sx={{ fontSize: 48, color: '#1976d2', marginBottom: '10px' }} />
              <h2 style={{ 
                fontSize: 'clamp(18px, 4vw, 24px)', 
                margin: '0 0 10px 0',
                color: '#1976d2'
              }}>
                個人カレンダー
              </h2>
              <p style={{ 
                fontSize: 'clamp(12px, 2.5vw, 14px)', 
                color: 'var(--text-gray)',
                margin: 0
              }}>
                個人のスケジュールを確認
              </p>
            </div>

            {/* 管理者画面 */}
            <div className="card fade-in" style={{ 
              cursor: 'pointer', 
              flex: '1',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              padding: '22px'
            }} onClick={() => {
              const urlParams = new URLSearchParams(window.location.search);
              const deviceId = urlParams.get('device');
              window.location.href = `/admin${deviceId ? `?device=${deviceId}` : ''}`;
            }}>
              <AdminPanelSettings sx={{ fontSize: 48, color: '#1976d2', marginBottom: '10px' }} />
              <h2 style={{ 
                fontSize: 'clamp(18px, 4vw, 24px)', 
                margin: '0 0 10px 0',
                color: '#1976d2'
              }}>
                管理者画面
              </h2>
              <p style={{ 
                fontSize: 'clamp(12px, 2.5vw, 14px)', 
                color: 'var(--text-gray)',
                margin: 0
              }}>
                システム管理を行います
              </p>
            </div>
          </div>
        </div>
      </div>
    </Box>
  );
};

export default Home;