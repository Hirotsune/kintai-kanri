import React, { useState, useEffect } from 'react';
import { Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
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
  Timeline,
  BarChart,
  ErrorOutline,
  Input,
  AdminPanelSettings
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import AdminPasswordDialog from '../components/AdminPasswordDialog';
import '../styles/custom.css';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showPasswordDialog, setShowPasswordDialog] = useState(() => {
    // 管理画面から戻ってきた場合は認証済みとして扱う
    // ただし、初回アクセス時は必ずパスワード認証を求める
    const isFromManagement = sessionStorage.getItem('fromManagement') === 'true';
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
    return !isFromManagement || !isAuthenticated;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // セッションストレージから認証状態を復元
    return sessionStorage.getItem('adminAuthenticated') === 'true';
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // admin画面から離れた際のログアウト処理
  useEffect(() => {
    const handleBeforeUnload = () => {
      // ページを離れる際に認証状態をクリア
      sessionStorage.removeItem('adminAuthenticated');
      sessionStorage.removeItem('fromManagement');
    };

    const handleVisibilityChange = () => {
      // タブが非表示になった際も認証状態をクリア
      if (document.hidden) {
        sessionStorage.removeItem('adminAuthenticated');
        sessionStorage.removeItem('fromManagement');
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
    sessionStorage.setItem('adminAuthenticated', 'true');
    // 管理画面からのフラグをクリア
    sessionStorage.removeItem('fromManagement');
  };

  const handleClosePasswordDialog = () => {
    setShowPasswordDialog(false);
    // 認証に失敗した場合のみ前のページに戻る
    if (!isAuthenticated) {
      window.history.back();
    }
  };

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


      {/* メニューグリッド */}
      <div className="grid grid-3">
        {/* ライン別日別実績表 */}
        <div className="card fade-in" style={{ cursor: 'pointer' }} onClick={() => {
          const urlParams = new URLSearchParams(window.location.search);
          const deviceId = urlParams.get('device');
          navigate(`/line-daily-report${deviceId ? `?device=${deviceId}` : ''}`);
        }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Timeline sx={{ fontSize: 32, color: '#1976d2' }} />
            <h2>ライン別日別実績表</h2>
          </div>
          <p style={{ color: 'var(--text-gray)', marginBottom: '20px' }}>
            各ラインの日別勤務実績を確認できます
          </p>
        </div>

        {/* ライン別月間実績表 */}
        <div className="card fade-in" style={{ cursor: 'pointer' }} onClick={() => {
          const urlParams = new URLSearchParams(window.location.search);
          const deviceId = urlParams.get('device');
          navigate(`/line-monthly-report${deviceId ? `?device=${deviceId}` : ''}`);
        }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BarChart sx={{ fontSize: 32, color: '#1976d2' }} />
            <h2>ライン別月間実績表</h2>
          </div>
          <p style={{ color: 'var(--text-gray)', marginBottom: '20px' }}>
            各ラインの月間勤務実績をガントチャートで表示
          </p>
        </div>

        {/* 勤怠実績表（月間） */}
        <div className="card fade-in" style={{ cursor: 'pointer' }} onClick={() => {
          const urlParams = new URLSearchParams(window.location.search);
          const deviceId = urlParams.get('device');
          navigate(`/monthly-report${deviceId ? `?device=${deviceId}` : ''}`);
        }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <People sx={{ fontSize: 32, color: '#1976d2' }} />
            <h2>勤怠実績表（月間）</h2>
          </div>
          <p style={{ color: 'var(--text-gray)', marginBottom: '20px' }}>
            従業員別の月間勤怠実績を確認できます
          </p>
        </div>

        {/* 勤怠集計表（月間） */}
        <div className="card fade-in" style={{ cursor: 'pointer' }} onClick={() => {
          const urlParams = new URLSearchParams(window.location.search);
          const deviceId = urlParams.get('device');
          navigate(`/monthly-summary${deviceId ? `?device=${deviceId}` : ''}`);
        }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Assessment sx={{ fontSize: 32, color: '#1976d2' }} />
            <h2>勤怠集計表（月間）</h2>
          </div>
          <p style={{ color: 'var(--text-gray)', marginBottom: '20px' }}>
            部署別・ライン別の勤怠集計を確認できます
          </p>
        </div>

        {/* 勤怠チェック・エラーリスト */}
        <div className="card fade-in" style={{ cursor: 'pointer' }} onClick={() => {
          const urlParams = new URLSearchParams(window.location.search);
          const deviceId = urlParams.get('device');
          navigate(`/error-list${deviceId ? `?device=${deviceId}` : ''}`);
        }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ErrorOutline sx={{ fontSize: 32, color: '#1976d2' }} />
            <h2>勤怠チェック・エラーリスト</h2>
          </div>
          <p style={{ color: 'var(--text-gray)', marginBottom: '20px' }}>
            打刻エラーや不備をチェック・修正できます
          </p>
        </div>

        {/* 勤怠入力 */}
        <div className="card fade-in" style={{ cursor: 'pointer' }} onClick={() => {
          const urlParams = new URLSearchParams(window.location.search);
          const deviceId = urlParams.get('device');
          navigate(`/attendance-input${deviceId ? `?device=${deviceId}` : ''}`);
        }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Input sx={{ fontSize: 32, color: '#1976d2' }} />
            <h2>勤怠入力</h2>
          </div>
          <p style={{ color: 'var(--text-gray)', marginBottom: '20px' }}>
            手動で勤怠データを入力・修正できます
          </p>
        </div>

        {/* 出勤簿 */}
        <div className="card fade-in" style={{ cursor: 'pointer' }} onClick={() => {
          const urlParams = new URLSearchParams(window.location.search);
          const deviceId = urlParams.get('device');
          navigate(`/attendance-book${deviceId ? `?device=${deviceId}` : ''}`);
        }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Book sx={{ fontSize: 32, color: '#1976d2' }} />
            <h2>出勤簿</h2>
          </div>
          <p style={{ color: 'var(--text-gray)', marginBottom: '20px' }}>
            モックと同じUIで社員の月間詳細勤怠を表示します
          </p>
        </div>


        {/* 管理画面 */}
        <div className="card fade-in" style={{ cursor: 'pointer' }} onClick={() => {
          const urlParams = new URLSearchParams(window.location.search);
          const deviceId = urlParams.get('device');
          navigate(`/management${deviceId ? `?device=${deviceId}` : ''}`);
        }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AdminPanelSettings sx={{ fontSize: 32, color: '#1976d2' }} />
            <h2>管理画面</h2>
          </div>
          <p style={{ color: 'var(--text-gray)', marginBottom: '20px' }}>
            工場・ライン・従業員のマスターデータを管理できます
          </p>
        </div>
      </div>

      {/* トップへ戻るボタン（左上固定） */}
      <Box sx={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 1000
      }}>
        <Button
          variant="outlined"
          onClick={() => {
            // 認証状態をクリアしてからメインメニューに戻る
            sessionStorage.removeItem('adminAuthenticated');
            sessionStorage.removeItem('fromManagement');
            sessionStorage.setItem('fromOtherPage', 'true');
            // URLパラメータを引き継いで画面遷移
            const urlParams = new URLSearchParams(window.location.search);
            const deviceId = urlParams.get('device');
            navigate(`/${deviceId ? `?device=${deviceId}` : ''}`);
          }}
          size="small"
          sx={{
            backgroundColor: 'transparent',
            color: '#1976d2',
            borderColor: '#1976d2',
            fontSize: '12px',
            height: '28px',
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              borderColor: '#1976d2',
            }
          }}
        >
          トップへ戻る
        </Button>
      </Box>
    </Box>
  );
};

export default AdminPage;
