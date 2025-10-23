import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
} from '@mui/material';

interface ShiftSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (startTime: string, duration: string) => void;
  employeeName: string;
}

const ShiftSelectionDialog: React.FC<ShiftSelectionDialogProps> = ({
  open,
  onClose,
  onConfirm,
  employeeName,
}) => {
  // 30分間隔の開始時刻オプション（6:00-22:00）
  const startTimeOptions: string[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      startTimeOptions.push(timeString);
    }
  }

  // 現在の時間に最も近い時間を取得する関数
  const getClosestTime = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // 現在の時間に最も近い時間を探す
    let closestTime = startTimeOptions[0];
    let minDiff = Infinity;
    
    for (const time of startTimeOptions) {
      const [timeHour, timeMinute] = time.split(':').map(Number);
      const [currentHour, currentMinute] = currentTime.split(':').map(Number);
      
      const timeMinutes = timeHour * 60 + timeMinute;
      const currentMinutes = currentHour * 60 + currentMinute;
      
      const diff = Math.abs(timeMinutes - currentMinutes);
      
      if (diff < minDiff) {
        minDiff = diff;
        closestTime = time;
      }
    }
    
    return closestTime;
  };

  const [selectedStartTime, setSelectedStartTime] = useState(getClosestTime());
  const [selectedDuration, setSelectedDuration] = useState('');

  // ダイアログが開かれるたびに現在の時間に最も近い時間を設定
  useEffect(() => {
    if (open) {
      setSelectedStartTime(getClosestTime());
      setSelectedDuration('');
    }
  }, [open]);

  // 勤務時間オプション（2H-8H）
  const durationOptions = [];
  for (let hours = 2; hours <= 8; hours++) {
    const startHour = parseInt(selectedStartTime.split(':')[0]);
    const startMinute = parseInt(selectedStartTime.split(':')[1]);
    
    // 6Hの場合は休憩ありとなしの両方を追加
    if (hours === 6) {
      // 6H休憩なし
      let endHour = startHour + hours;
      let endMinute = startMinute;
      
      let endTime = '';
      let isNextDay = false;
      
      if (endHour >= 24) {
        endHour -= 24;
        isNextDay = true;
      }
      
      endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      let label = '';
      if (isNextDay) {
        label = `${hours}H-翌${endTime}迄`;
      } else {
        label = `${hours}H-${endTime}迄`;
      }
      
      durationOptions.push({
        value: `${hours}H`,
        label: label
      });
      
      // 6H休憩あり
      endHour = startHour + hours + 1; // 1時間休憩を追加
      endMinute = startMinute;
      
      endTime = '';
      isNextDay = false;
      
      if (endHour >= 24) {
        endHour -= 24;
        isNextDay = true;
      }
      
      endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      if (isNextDay) {
        label = `${hours}H-翌${endTime}迄 休憩あり`;
      } else {
        label = `${hours}H-${endTime}迄 休憩あり`;
      }
      
      durationOptions.push({
        value: `${hours}H_break`,
        label: label
      });
    } else {
      // 6H以外の通常処理
      let endHour = startHour + hours;
      let endMinute = startMinute;
      
      // 7H以上の場合、休憩時間を考慮（1時間休憩）
      if (hours >= 7) {
        endHour += 1; // 1時間休憩を追加
      }
      
      // 日付跨ぎの処理
      let endTime = '';
      let isNextDay = false;
      
      if (endHour >= 24) {
        endHour -= 24;
        isNextDay = true;
      }
      
      endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      let label = '';
      if (isNextDay) {
        label = `${hours}H-翌${endTime}迄`;
      } else {
        label = `${hours}H-${endTime}迄`;
      }
      if (hours >= 7) {
        label += ' 休憩あり';
      }
      
      durationOptions.push({
        value: `${hours}H`,
        label: label
      });
    }
  }

  const handleConfirm = () => {
    if (selectedStartTime && selectedDuration) {
      onConfirm(selectedStartTime, selectedDuration);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedStartTime('');
    setSelectedDuration('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth={false}
      fullWidth
      fullScreen
      PaperProps={{
        sx: {
          width: '100vw',
          height: '100vh',
          maxWidth: 'none',
          maxHeight: 'none',
          margin: 0,
          borderRadius: 0
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h3" component="div" sx={{ fontSize: 'clamp(28px, 7vw, 56px)', fontWeight: 'bold' }}>
          シフト選択 - {employeeName}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Box sx={{ mb: 4 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ fontSize: 'clamp(24px, 5vw, 40px)' }}>出勤時刻</InputLabel>
              <Select
                value={selectedStartTime}
                onChange={(e) => {
                  setSelectedStartTime(e.target.value);
                  setSelectedDuration(''); // 開始時刻が変わったら勤務時間をリセット
                }}
                label="出勤時刻"
                sx={{ 
                  fontSize: 'clamp(24px, 5vw, 40px)',
                  '& .MuiSelect-select': {
                    fontSize: 'clamp(24px, 5vw, 40px)',
                    padding: '20px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: '60vh',
                    },
                  },
                }}
              >
                {startTimeOptions.map((time) => (
                  <MenuItem 
                    key={time} 
                    value={time}
                    style={{ 
                      minHeight: '80px',
                      fontSize: 'clamp(28px, 6vw, 48px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '16px 24px'
                    }}
                  >
                    {time}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ mb: 4 }}>
            <FormControl fullWidth disabled={!selectedStartTime}>
              <InputLabel sx={{ fontSize: 'clamp(24px, 5vw, 40px)' }}>勤務時間</InputLabel>
              <Select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                label="勤務時間"
                sx={{ 
                  fontSize: 'clamp(24px, 5vw, 40px)',
                  '& .MuiSelect-select': {
                    fontSize: 'clamp(24px, 5vw, 40px)',
                    padding: '20px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: '60vh',
                    },
                  },
                }}
              >
                {durationOptions.map((option) => (
                  <MenuItem 
                    key={option.value} 
                    value={option.value}
                    style={{ 
                      minHeight: '80px',
                      fontSize: 'clamp(22px, 4.5vw, 36px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '16px 24px'
                    }}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          {selectedStartTime && selectedDuration && (
            <Box sx={{ mt: 4, p: 3, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="h6" color="text.secondary" sx={{ fontSize: 'clamp(22px, 4.5vw, 36px)' }}>
                選択されたシフト: {selectedStartTime} 出勤 {selectedDuration === '6H_break' ? '6H勤務 休憩あり' : `${selectedDuration}勤務`}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ padding: '20px' }}>
        <Button 
          onClick={handleClose} 
          color="inherit"
          sx={{ 
            fontSize: 'clamp(18px, 3.5vw, 28px)',
            minHeight: '80px',
            minWidth: '200px'
          }}
        >
          キャンセル
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          disabled={!selectedStartTime || !selectedDuration}
          sx={{ 
            fontSize: 'clamp(18px, 3.5vw, 28px)',
            minHeight: '80px',
            minWidth: '200px'
          }}
        >
          確定
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShiftSelectionDialog;
