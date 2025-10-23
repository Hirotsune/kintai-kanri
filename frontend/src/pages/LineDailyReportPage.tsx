import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Card, CardContent, Box, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Line, Employee, AttendanceWithEmployee } from '../types';
import '../styles/lineDailyReport.css';
import { reportApi, lineApi, employeeApi } from '../services/api';
import Header from '../components/Header';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import NotoSansJPBase64 from '../fonts/NotoSansJP-Regular-base64';

// 日本語フォントをPDFに追加する関数
const addJapaneseFont = async (doc: jsPDF) => {
  try {
    // Base64データが有効な場合のみフォントを追加
    if (NotoSansJPBase64 && NotoSansJPBase64.length > 1000) {
      doc.addFileToVFS('NotoSansJP-Regular.ttf', NotoSansJPBase64);
      doc.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'normal');
      doc.setFont('NotoSansJP');
      console.log('日本語フォント（Noto Sans JP）が正常に設定されました');
      return true;
    } else {
      // CDNからフォントを読み込む方法を試す
      try {
        const fontUrl = 'https://fonts.gstatic.com/s/notosansjp/v52/o-0IIpQlx3QUlC5A4PNr5TRASf6M7Q.woff2';
        const response = await fetch(fontUrl);
        const fontArrayBuffer = await response.arrayBuffer();
        const fontBase64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(fontArrayBuffer))));
        
        doc.addFileToVFS('NotoSansJP-Regular.ttf', fontBase64);
        doc.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'normal');
        doc.setFont('NotoSansJP');
        console.log('CDNから日本語フォント（Noto Sans JP）が正常に設定されました');
        return true;
      } catch (cdnError) {
        console.warn('CDNからのフォント読み込みに失敗しました:', cdnError);
        throw new Error('フォントデータが不完全です');
      }
    }
  } catch (error) {
    console.warn('日本語フォントの設定に失敗しました。デフォルトフォントを使用します。', error);
    // フォールバック: デフォルトフォントを使用
    doc.setFont('helvetica');
    return false;
  }
};

// 日本語文字を安全に表示するための関数
const safeText = (text: string, useJapaneseFont: boolean): string => {
  if (!useJapaneseFont) {
    // 日本語フォントが使用できない場合は、英数字のみ表示
    return text.replace(/[^\u0000-\u007F]/g, '?');
  }
  return text;
};

interface LineDailyData {
  line: Line;
  employees: Array<{
    employee: {
      id: number;
      name: string;
      employee_id: string;
    };
    hourly_status: boolean[];
    total_hours: number;
  }>;
  time_slots: string[];
  time_periods: string[];
  hasAttendanceData: boolean;
  attendances?: AttendanceWithEmployee[];
}

const LineDailyReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLine, setSelectedLine] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [lines, setLines] = useState<Line[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [lineData, setLineData] = useState<LineDailyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [attendanceCount, setAttendanceCount] = useState<number | null>(null);
  const [timeRoundingMode, setTimeRoundingMode] = useState<number>(15); // デフォルト15分刻み

  // ライン一覧の取得
  useEffect(() => {
    const loadLines = async () => {
      try {
        const linesData = await lineApi.getAll();
        const activeLines = linesData.filter(line => line.is_active).sort((a, b) => a.id - b.id);
        setLines(activeLines);
      } catch (err) {
        console.error('ライン情報の読み込みに失敗:', err);
      }
    };
    loadLines();
  }, []);

  // 従業員一覧の取得
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const employeesData = await employeeApi.getAll();
        const activeEmployees = employeesData.filter(employee => employee.is_active);
        setEmployees(activeEmployees);
      } catch (err) {
        console.error('従業員情報の読み込みに失敗:', err);
      }
    };
    loadEmployees();
  }, []);

  // 時間刻み設定の取得
  useEffect(() => {
    const loadTimeRoundingMode = () => {
      try {
        const savedMode = localStorage.getItem('time_rounding_mode');
        if (savedMode) {
          setTimeRoundingMode(parseInt(savedMode));
        } else {
        }
      } catch (err) {
        console.warn('時間刻み設定の取得に失敗、デフォルト値を使用:', err);
      }
    };
    loadTimeRoundingMode();
  }, []);

  // レポート生成
  const generateReport = useCallback(async () => {
    if (!selectedLine || !selectedDate) return;
  
    setLoading(true);
    setAttendanceCount(null); // 表示更新時に件数表示をクリア
    try {
      // selectedLineは数値のIDなので、対応するline_idを取得
      const selectedLineData = lines.find(l => l.id.toString() === selectedLine);
      const lineId = selectedLineData?.line_id || selectedLine;
      
      
      const result = await reportApi.lineDaily(
        selectedDate.toISOString().split('T')[0],
        lineId
      );
      
      
      // 選択されたラインに属する従業員のみをフィルタリング
      // selectedLineは数値のID、emp.line_idは文字列のL001形式
      const lineEmployees = employees.filter(emp => emp.line_id === selectedLineData?.line_id);
      
      
      // データを適切な形式に変換
      if (result.attendances && result.attendances.length > 0) {
        // 従業員IDごとにグループ化
        const employeeMap = new Map();
        
        (result.attendances as AttendanceWithEmployee[]).forEach(att => {
          // 従業員IDを文字列のまま使用（employee_idフィールド）
          const empId = att.employee_id;
          
          if (!employeeMap.has(empId)) {
            employeeMap.set(empId, {
              id: empId,
              name: att.employee.name,
              employee_id: att.employee.employee_id,
              attendances: []
            });
          }
          employeeMap.get(empId).attendances.push(att);
        });

        // 時間スロットを生成（3から始まって2で終わり、30分おき）
        const timeSlots: string[] = [];
        for (let i = 0; i < 24; i++) {
          const hour = (i + 3) % 24;
          timeSlots.push(`${hour}`);        // 00分は時間のみ表示
          timeSlots.push('');               // 30分は空白
        }
  
        setLineData({
            line: lines.find(l => l.id.toString() === selectedLine) || lines[0],
            employees: lineEmployees.map(emp => {
               // 従業員のemployee_idフィールドを使用して勤怠記録を取得
               const empAttendances = employeeMap.has(emp.employee_id) ? employeeMap.get(emp.employee_id).attendances : [];
              
               const workPeriods = calculateWorkHours(empAttendances);
               const hourlyStatus = generateHourlyStatus(workPeriods, timeSlots.slice(0, 48), empAttendances); // 計列を除く
               
               // 合計勤務時間を計算（分単位）
               const totalWorkMinutes = calculateTotalWorkMinutes(workPeriods);
               
               // 総勤務時間を計算（出社から退社まで、昼休み含む）
               const totalWorkTime = calculateTotalWorkTime(empAttendances);
               
               return {
              employee: {
                id: emp.id,
                name: emp.name,
                employee_id: emp.employee_id
              },
                 hourly_status: hourlyStatus,
                 total_hours: totalWorkMinutes
               };
            }),
            time_slots: timeSlots,
            time_periods: [
               '深夜', '', '深夜', '', '深夜', '',     // 3, 3.5, 4, 4.5, 5, 5.5時
               '早朝', '', '早朝', '', '早朝', '',     // 6, 6.5, 7, 7.5, 8, 8.5時
               '午前', '', '午前', '', '午前', '',     // 9, 9.5, 10, 10.5, 11, 11.5時
               '昼間', '', '昼間', '', '昼間', '',     // 12, 12.5, 13, 13.5, 14, 14.5時
               '午後', '', '午後', '', '午後', '',     // 15, 15.5, 16, 16.5, 17, 17.5時
               '夕方', '', '夕方', '', '夕方', '',     // 18, 18.5, 19, 19.5, 20, 20.5時
               '夜間', '', '夜間', '', '夜間', '',     // 21, 21.5, 22, 22.5, 23, 23.5時
               '夜中', '', '夜中', '', '夜中', ''      // 0, 0.5, 1, 1.5, 2, 2.5時
             ],
            hasAttendanceData: true,  // 勤怠記録があることを示すフラグ
            attendances: result.attendances  // 勤怠記録データを追加
          });
      } else {
                 // 勤怠記録がない場合でも、ラインに属する従業員は表示
         const timeSlots: string[] = [];
         for (let i = 0; i < 24; i++) {
           const hour = (i + 3) % 24;
           timeSlots.push(`${hour}`);        // 00分は時間のみ表示
           timeSlots.push('');               // 30分は空白
         }
  
        setLineData({
            line: lines.find(l => l.id.toString() === selectedLine) || lines[0],
          employees: lineEmployees.map(emp => ({
              employee: {
                id: emp.id,
                name: emp.name,
                employee_id: emp.employee_id
              },
                         hourly_status: Array(48).fill(false),
            total_hours: 0
            })),
          time_slots: timeSlots,
            time_periods: [
             '深夜', '', '深夜', '', '深夜', '',     // 3, 3.5, 4, 4.5, 5, 5.5時
             '早朝', '', '早朝', '', '早朝', '',     // 6, 6.5, 7, 7.5, 8, 8.5時
             '午前', '', '午前', '', '午前', '',     // 9, 9.5, 10, 10.5, 11, 11.5時
             '昼間', '', '昼間', '', '昼間', '',     // 12, 12.5, 13, 13.5, 14, 14.5時
             '午後', '', '午後', '', '午後', '',     // 15, 15.5, 16, 16.5, 17, 17.5時
             '夕方', '', '夕方', '', '夕方', '',     // 18, 18.5, 19, 19.5, 20, 20.5時
             '夜間', '', '夜間', '', '夜間', '',     // 21, 21.5, 22, 22.5, 23, 23.5時
             '夜中', '', '夜中', '', '夜中', ''      // 0, 0.5, 1, 1.5, 2, 2.5時
            ],
          hasAttendanceData: false,  // 勤怠記録がないことを示すフラグ
          attendances: []  // 空の勤怠記録データを追加
          });
      }
    } catch (err) {
      console.error('レポートの生成に失敗:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedLine, selectedDate, lines, employees]);

  // 日付が変更された時に勤怠記録の件数を取得
  useEffect(() => {
    if (selectedLine && selectedDate) {
      fetchAttendanceCount(selectedLine, selectedDate);
    }
  }, [selectedDate]);

  // 自動検索を停止 - 手動で「表示更新」ボタンを押した時のみ検索

  // 勤怠記録の件数を取得する関数
  const fetchAttendanceCount = async (lineId: string, date: Date) => {
    try {
      // selectedLineは数値のIDなので、対応するline_idを取得
      const selectedLineData = lines.find(l => l.id.toString() === lineId);
      const actualLineId = selectedLineData?.line_id || lineId;
      
      const response = await reportApi.lineDaily(date.toISOString().split('T')[0], actualLineId);
      
      // 実際の勤怠記録がある従業員数をカウント
      let count = 0;
      if (response.attendances && response.attendances.length > 0) {
        // 従業員IDごとにグループ化して、勤怠記録がある従業員数をカウント
        const employeeSet = new Set();
        response.attendances.forEach((att: any) => {
          employeeSet.add(att.employee_id);
        });
        count = employeeSet.size;
      }
      
      setAttendanceCount(count);
    } catch (error) {
      console.error('勤怠記録件数の取得に失敗:', error);
      setAttendanceCount(0);
    }
  };

  // ライン選択が変更された時の処理
  const handleLineChange = (lineId: string) => {
    setSelectedLine(lineId);
    // ライン変更時は lineData をクリアしない（表示更新ボタンを押すまで待つ）
    
    // 勤怠記録の件数を取得
    if (selectedDate) {
      fetchAttendanceCount(lineId, selectedDate);
    }
  };

  // CSV出力処理
  const handleExportCSV = () => {
    if (!lineData || !lineData.employees || lineData.employees.length === 0) {
      alert('出力するデータがありません');
      return;
    }

    // ヘッダー行を生成
    const headers = ['社員CD', '氏名', ...lineData.time_slots, '勤務時間'];
    
    // データ行を生成
    const csvData = lineData.employees.map(empData => {
      const row = [
        empData.employee.employee_id,
        empData.employee.name
      ];
      
      // 時間帯別の勤務状況を追加
      empData.hourly_status.forEach(status => {
        row.push(status ? '1' : '0');
      });
      
      // 勤務時間を追加
      const attendanceRecord = lineData?.attendances?.find(att => 
        att.employee_id === empData.employee.employee_id
      );
      
      let totalMinutes = 0;
      if (attendanceRecord) {
        switch (timeRoundingMode) {
          case 15:
            totalMinutes = attendanceRecord.total_work_time_15min || 0;
            break;
          case 10:
            totalMinutes = attendanceRecord.total_work_time_10min || 0;
            break;
          case 5:
            totalMinutes = attendanceRecord.total_work_time_5min || 0;
            break;
          case 1:
            totalMinutes = attendanceRecord.total_work_time_1min || 0;
            break;
          default:
            totalMinutes = attendanceRecord.total_work_time_15min || 0;
        }
      }
      
      const workTime = totalMinutes > 0 
        ? `${Math.floor(totalMinutes / 60)}:${(totalMinutes % 60).toString().padStart(2, '0')}`
        : '0:00';
      
      row.push(workTime);
      
      return row;
    });

    // CSV文字列を生成
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // BOMを追加してUTF-8エンコーディングを指定
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // ダウンロード
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const dateStr = selectedDate ? selectedDate.toLocaleDateString('ja-JP').replace(/\//g, '') : 'unknown';
    link.setAttribute('download', `ライン別実績表_${lineData.line.name}_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF出力処理
  const handleExportPDF = async () => {
    if (!lineData || !lineData.employees || lineData.employees.length === 0) {
      alert('出力するデータがありません');
      return;
    }

    try {
      // PDFドキュメントを作成（横向きA4）
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      // 日本語フォントを追加（非同期）
      const useJapaneseFont = await addJapaneseFont(doc);
      
      // タイトルを追加（日本語対応）
      const dateStr = selectedDate ? selectedDate.toLocaleDateString('ja-JP') : '不明';
      doc.setFontSize(16);
      doc.text(safeText(`ライン別実績表 - ${lineData.line.name}`, useJapaneseFont), 20, 20);
      doc.setFontSize(12);
      doc.text(safeText(`対象日: ${dateStr}`, useJapaneseFont), 20, 28);
      
      // テーブルデータを準備（日本語ヘッダー）
      const headers = [
        safeText('社員CD', useJapaneseFont), 
        safeText('氏名', useJapaneseFont), 
        ...lineData.time_slots.map(slot => safeText(slot, useJapaneseFont)), 
        safeText('計', useJapaneseFont)
      ];
      const tableData: any[][] = [];
      
      lineData.employees.forEach(empData => {
        const row: any[] = [
          empData.employee.employee_id,
          safeText(empData.employee.name, useJapaneseFont)
        ];
        
        // 時間帯別の勤務状況を追加（緑色の背景色付き）
        empData.hourly_status.forEach(status => {
          if (status) {
            // 勤務時間の場合は緑色の背景色を設定
            row.push({
              content: '',
              styles: { fillColor: [144, 238, 144] } // 薄い緑色
            });
          } else {
            row.push('');
          }
        });
        
        // 勤務時間を追加
        const attendanceRecord = lineData?.attendances?.find(att => 
          att.employee_id === empData.employee.employee_id
        );
        
        let totalMinutes = 0;
        if (attendanceRecord) {
          switch (timeRoundingMode) {
            case 15:
              totalMinutes = attendanceRecord.total_work_time_15min || 0;
              break;
            case 10:
              totalMinutes = attendanceRecord.total_work_time_10min || 0;
              break;
            case 5:
              totalMinutes = attendanceRecord.total_work_time_5min || 0;
              break;
            case 1:
              totalMinutes = attendanceRecord.total_work_time_1min || 0;
              break;
            default:
              totalMinutes = attendanceRecord.total_work_time_15min || 0;
          }
        }
        
        const workTime = totalMinutes > 0 
          ? `${Math.floor(totalMinutes / 60)}:${(totalMinutes % 60).toString().padStart(2, '0')}`
          : '0:00';
        
        // 0:00の場合は背景色と同じ色にして非表示
        if (workTime === '0:00') {
          row.push({
            content: workTime,
            styles: { textColor: [240, 240, 240] } // 背景色と同じ色
          });
        } else {
          row.push(workTime);
        }
        
        tableData.push(row);
      });
      
      // テーブルを追加
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 30,
        styles: {
          fontSize: 8,
          cellPadding: 1,
          halign: 'center',
          valign: 'middle',
          lineColor: [0, 0, 0], // 罫線の色（黒）
          lineWidth: 0.1, // 罫線の太さ
          font: useJapaneseFont ? 'NotoSansJP' : 'helvetica', // フォントを動的に設定
        },
        headStyles: {
          fillColor: [200, 200, 200], // 薄いグレー
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 8,
          lineColor: [0, 0, 0], // ヘッダーの罫線
          lineWidth: 0.1,
          font: 'NotoSansJP', // 日本語フォントを指定
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255], // 白
          lineColor: [0, 0, 0], // 行の罫線
          lineWidth: 0.1,
          font: 'NotoSansJP', // 日本語フォントを指定
        },
        columnStyles: {
          0: { 
            cellWidth: 12, // 社員CD
            halign: 'center',
            fontStyle: 'bold',
            fontSize: 8,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            font: 'NotoSansJP', // 日本語フォントを指定
          },
          1: { 
            cellWidth: 20, // 氏名
            halign: 'left',
            fontStyle: 'bold',
            fontSize: 8,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            font: 'NotoSansJP', // 日本語フォントを指定
          },
          // 時間帯の列は自動幅
          [headers.length - 1]: { // 計列
            cellWidth: 12,
            halign: 'center',
            fontStyle: 'bold',
            fontSize: 8,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            font: 'NotoSansJP', // 日本語フォントを指定
          }
        },
        margin: { left: 10, right: 10 },
        tableWidth: 'auto',
        showHead: 'everyPage',
        pageBreak: 'auto',
        theme: 'grid', // グリッドテーマで罫線を表示
      });
      
      // ファイル名を生成してダウンロード
      const fileName = `ライン別実績表_${lineData.line.name}_${dateStr.replace(/\//g, '')}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('PDF出力エラー:', error);
      alert('PDF出力中にエラーが発生しました。');
    }
  };

  // 勤務時間を計算する関数（Flask版のロジックを移植）
  const calculateWorkHours = (attendanceRecords: AttendanceWithEmployee[]): Array<[Date, Date]> => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return [];
    }

    const workPeriods: Array<[Date, Date]> = [];
    let currentStart: Date | null = null;

    // 打刻記録を時刻順でソート
    const sortedRecords = [...attendanceRecords].sort((a, b) => 
      new Date(a.punch_time).getTime() - new Date(b.punch_time).getTime()
    );

    for (const record of sortedRecords) {
      const punchTime = new Date(record.punch_time);
      const punchType = record.punch_type;

      if (punchType === '出社') {
        currentStart = punchTime;
      } else if (punchType === '昼休出１' && currentStart) {
        // 1回目昼休み開始（午前勤務終了）
        workPeriods.push([currentStart, punchTime]);
        currentStart = null;
      } else if (punchType === '昼休入１') {
        // 1回目昼休み終了（午後勤務開始）
        currentStart = punchTime;
      } else if (punchType === '昼休出２' && currentStart) {
        // 2回目昼休み開始（午後勤務終了）
        workPeriods.push([currentStart, punchTime]);
        currentStart = null;
      } else if (punchType === '昼休入２') {
        // 2回目昼休み終了（残業開始）
        currentStart = punchTime;
        
        // 昼休出２と昼休入２の間の時間を勤務時間として追加
        if (punchTime) {
          const previousPunch = sortedRecords.find(r => r.punch_type === '昼休出２');
          if (previousPunch) {
            const lunchStart = new Date(previousPunch.punch_time);
            const lunchEnd = punchTime;
            workPeriods.push([lunchStart, lunchEnd]);
          }
        }
      } else if (punchType === '退社' && currentStart) {
        // 勤務終了
        workPeriods.push([currentStart, punchTime]);
        currentStart = null;
      }
    }

         return workPeriods;
   };

   // 勤務時間の合計を計算する関数（分単位、実際の打刻時刻で計算）
   const calculateTotalWorkMinutes = (workPeriods: Array<[Date, Date]>): number => {
     let totalMinutes = 0;
     
     for (const [startTime, endTime] of workPeriods) {
       // 実際の打刻時刻で計算（丸めなし）
       const durationMs = endTime.getTime() - startTime.getTime();
       const durationMinutes = Math.floor(durationMs / (1000 * 60));
       totalMinutes += durationMinutes;
     }
     
     return totalMinutes;
   };

  // 時間を丸める関数（各刻みデータを30分刻みセルに合わせる）
  const roundTime = (date: Date, roundType: 'start' | 'end'): Date => {
    const minutes = date.getMinutes();
    
    if (roundType === 'start') {
      // 出社時間: 15分刻みデータを30分刻みセルにマッピング
      if (minutes < 15) {
        // 0-14分: 00分のセルを使用
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0, 0, 0);
      } else if (minutes < 30) {
        // 15-29分: 30分のセルを使用（例：8:28 → 8:30）
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 30, 0, 0);
      } else if (minutes < 45) {
        // 30-44分: 30分のセルを使用
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 30, 0, 0);
      } else {
        // 45-59分: 次の時間の00分セルを使用（例：8:55 → 9:00）
        const nextHour = date.getHours() + 1;
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), nextHour, 0, 0, 0);
      }
    } else {
      // 退社時間: 各刻みデータをそのまま使用
      return date;
    }
  };

   // 総勤務時間を計算する関数（出社から退社まで、昼休み含む、実際の打刻時刻で計算）
   const calculateTotalWorkTime = (attendanceRecords: AttendanceWithEmployee[]): number => {
     if (!attendanceRecords || attendanceRecords.length === 0) {
       return 0;
     }
     
     const sortedRecords = [...attendanceRecords].sort((a, b) => 
       new Date(a.punch_time).getTime() - new Date(b.punch_time).getTime()
     );
     
     const firstRecord = sortedRecords[0];
     const lastRecord = sortedRecords[sortedRecords.length - 1];
     
     if (firstRecord.punch_type === '出社' && lastRecord.punch_type === '退社') {
       const startTime = new Date(firstRecord.punch_time);
       const endTime = new Date(lastRecord.punch_time);
       
       // 実際の打刻時刻で計算（丸めなし）
       console.log(`出社時刻: ${startTime.toLocaleString()}`);
       console.log(`退社時刻: ${endTime.toLocaleString()}`);
       
       const durationMs = endTime.getTime() - startTime.getTime();
       const durationMinutes = Math.floor(durationMs / (1000 * 60));
       return durationMinutes;
     }
     
     return 0;
   };

           // 時間軸での勤務状況を生成する関数（30分おき対応、出社・退社のみ時間丸め適用）
    const generateHourlyStatus = (workPeriods: Array<[Date, Date]>, timeSlots: string[], attendanceRecords: AttendanceWithEmployee[]): boolean[] => {
      // 30分おきの48スロット（24時間 × 2）
      const hourlyStatus = new Array(48).fill(false);

      console.log('=== 時間軸勤務状況生成開始 ===');
      console.log('時間スロット:', timeSlots);
      console.log('勤務期間数:', workPeriods.length);

      if (workPeriods.length === 0) {
        console.log('勤務期間がありません - 出社打刻のみの可能性をチェック');
        
        // 出社打刻のみの場合、出社時刻のセルを緑色にする
        const clockInRecord = attendanceRecords.find(r => r.punch_type === '出社');
        if (clockInRecord) {
          const clockInTime = new Date(clockInRecord.punch_time);
          const roundedClockInTime = roundTime(clockInTime, 'start');
          
          // 出社時刻の30分スロットを特定
          let startSlot = roundedClockInTime.getHours() * 2 + (roundedClockInTime.getMinutes() >= 30 ? 1 : 0);
          
          // 出社時刻のセルのみを緑色にする（1セル分のみ）
          const timeSlotIndex = (startSlot - 6 + 48) % 48; // 3時 = 6スロット目
          console.log(`出社打刻のみ: スロット ${startSlot} → インデックス ${timeSlotIndex}`);
          
          if (timeSlotIndex >= 0 && timeSlotIndex < 48) {
            hourlyStatus[timeSlotIndex] = true;
            console.log(`出社打刻のみ: インデックス ${timeSlotIndex} を true に設定`);
          }
        }
        
        return hourlyStatus;
      }

      // 昼休み期間を計算（最低1時間分の空白を確保）
      const sortedRecords = [...attendanceRecords].sort((a, b) => 
        new Date(a.punch_time).getTime() - new Date(b.punch_time).getTime()
      );
      
      const lunchPeriods: Array<[Date, Date]> = [];
      
      // 昼休出１と昼休入１の間の時間を処理
      const lunchOut1 = sortedRecords.find(r => r.punch_type === '昼休出１');
      const lunchIn1 = sortedRecords.find(r => r.punch_type === '昼休入１');
      
      if (lunchOut1 && lunchIn1) {
        const lunchStart = new Date(lunchOut1.punch_time);
        const lunchEnd = new Date(lunchIn1.punch_time);
        
        // 昼休み時間が1時間未満の場合は、1時間分の空白を確保
        const lunchDuration = lunchEnd.getTime() - lunchStart.getTime();
        const oneHour = 60 * 60 * 1000; // 1時間（ミリ秒）
        
        if (lunchDuration < oneHour) {
          // 1時間分の空白を追加（昼休出１から1時間後まで）
          const extendedLunchEnd = new Date(lunchStart.getTime() + oneHour);
          lunchPeriods.push([lunchStart, extendedLunchEnd]);
          console.log(`昼休出１〜昼休入１: 1時間分の空白を追加 - ${lunchStart.toLocaleString()} 〜 ${extendedLunchEnd.toLocaleString()}`);
        } else {
          // 実際の昼休み時間を追加
          lunchPeriods.push([lunchStart, lunchEnd]);
          console.log(`昼休出１〜昼休入１: 実際の昼休み時間を追加 - ${lunchStart.toLocaleString()} 〜 ${lunchEnd.toLocaleString()}`);
        }
      }

                                               for (let index = 0; index < workPeriods.length; index++) {
          const [startTime, endTime] = workPeriods[index];
          // 勤務期間の順序で判定（最初が午前勤務、最後が残業勤務）
          const isFirstPeriod = index === 0; // 最初の期間（午前勤務）
          const isLastPeriod = index === workPeriods.length - 1; // 最後の期間（残業勤務）
          
          // 最初の期間の開始時刻（出社）と最後の期間の終了時刻（退社）のみ丸めを適用
          console.log(`期間${index + 1}: isFirstPeriod=${isFirstPeriod}, isLastPeriod=${isLastPeriod}`);
          const roundedStartTime = isFirstPeriod ? roundTime(startTime, 'start') : startTime;
          const roundedEndTime = isLastPeriod ? roundTime(endTime, 'end') : endTime;
          
                  // 丸め後の時刻から30分スロットを特定
           let startSlot = roundedStartTime.getHours() * 2 + (roundedStartTime.getMinutes() >= 30 ? 1 : 0);
          // 退社時刻の場合は、その時刻の前のセルまで表示（17:30の場合は17:00のセルまで）
          let endSlot = roundedEndTime.getHours() * 2 + (roundedEndTime.getMinutes() >= 30 ? 1 : 0) - 1;

               console.log(`勤務期間: ${startTime.toLocaleString()} 〜 ${endTime.toLocaleString()}`);
        console.log(`丸め後時刻: ${roundedStartTime.toLocaleString()} 〜 ${roundedEndTime.toLocaleString()}`);
        console.log(`30分スロット: ${startSlot} 〜 ${endSlot}`);
        console.log(`元の時間: ${startTime.getHours()}:${startTime.getMinutes().toString().padStart(2, '0')} 〜 ${endTime.getHours()}:${endTime.getMinutes().toString().padStart(2, '0')}`);
        console.log(`丸め後時間: ${roundedStartTime.getHours()}:${roundedStartTime.getMinutes().toString().padStart(2, '0')} 〜 ${roundedEndTime.getHours()}:${roundedEndTime.getMinutes().toString().padStart(2, '0')}`);

       // 30分スロットの処理
       if (startTime.getDate() === endTime.getDate() && startSlot <= endSlot) {
         // 同日内で正常な時間範囲
         console.log('同日内の正常な時間範囲です');
         for (let slot = startSlot; slot <= endSlot; slot++) {
           // 30分スロットのインデックスを計算（3時から始まるため）
           const timeSlotIndex = (slot - 6 + 48) % 48; // 3時 = 6スロット目
           console.log(`スロット ${slot} → インデックス ${timeSlotIndex}`);
           if (timeSlotIndex >= 0 && timeSlotIndex < 48) {
             hourlyStatus[timeSlotIndex] = true;
             console.log(`インデックス ${timeSlotIndex} を true に設定`);
           }
         }
       } else if (startTime.getDate() === endTime.getDate() && startSlot > endSlot) {
         // 同日内で時間が逆転している場合（短時間勤務）
         console.log('同日内の短時間勤務期間です');
         for (let slot = startSlot; slot <= endSlot; slot++) {
           // 30分スロットのインデックスを計算（3時から始まるため）
           const timeSlotIndex = (slot - 6 + 48) % 48; // 3時 = 6スロット目
           console.log(`スロット ${slot} → インデックス ${timeSlotIndex}`);
           if (timeSlotIndex >= 0 && timeSlotIndex < 48) {
             hourlyStatus[timeSlotIndex] = true;
             console.log(`インデックス ${timeSlotIndex} を true に設定`);
           }
         }
       } else {
         // 日をまたぐ場合
         console.log('日をまたぐ勤務期間です');
         
         // 開始時刻から48スロットまで
         for (let slot = startSlot; slot < 48; slot++) {
           const timeSlotIndex = (slot - 6 + 48) % 48; // 3時 = 6スロット目
           console.log(`スロット ${slot} → インデックス ${timeSlotIndex} (日をまたぐ前半)`);
           if (timeSlotIndex >= 0 && timeSlotIndex < 48) {
             hourlyStatus[timeSlotIndex] = true;
             console.log(`インデックス ${timeSlotIndex} を true に設定 (前半)`);
           }
         }

         // 0スロットから終了時刻まで
         for (let slot = 0; slot <= endSlot; slot++) {
           const timeSlotIndex = (slot - 6 + 48) % 48; // 3時 = 6スロット目
           console.log(`スロット ${slot} → インデックス ${timeSlotIndex} (日をまたぐ後半)`);
           if (timeSlotIndex >= 0 && timeSlotIndex < 48) {
             hourlyStatus[timeSlotIndex] = true;
             console.log(`インデックス ${timeSlotIndex} を true に設定 (後半)`);
           }
         }
       }
     }

      // 昼休み期間を空白として処理（勤務期間の処理の後）
      for (const [lunchStart, lunchEnd] of lunchPeriods) {
        const startSlot = lunchStart.getHours() * 2 + (lunchStart.getMinutes() >= 30 ? 1 : 0);
        const endSlot = lunchEnd.getHours() * 2 + (lunchEnd.getMinutes() >= 30 ? 1 : 0);
        
        console.log(`昼休み期間: ${lunchStart.toLocaleString()} 〜 ${lunchEnd.toLocaleString()}`);
        console.log(`昼休み30分スロット: ${startSlot} 〜 ${endSlot}`);
        
        // 昼休み期間は空白として処理（falseのまま）
        for (let slot = startSlot; slot < endSlot; slot++) {
          const arrayIndex = slot >= 6 ? slot - 6 : slot + 42;
          if (arrayIndex >= 0 && arrayIndex < 48) {
            hourlyStatus[arrayIndex] = false; // 昼休みは空白
            console.log(`昼休みスロット ${slot} → インデックス ${arrayIndex} を空白に設定`);
          }
        }
      }

    console.log('最終的な勤務状況:', hourlyStatus);
    console.log('=== 時間軸勤務状況生成完了 ===');
    return hourlyStatus;
  };

  


  // セルクリック時のハイライト
  const handleCellClick = (event: React.MouseEvent<HTMLTableCellElement>) => {
    const target = event.target as HTMLTableCellElement;
    
    // 既存のハイライトを削除
    document.querySelectorAll('.attendance-cell.highlighted').forEach(cell => {
      cell.classList.remove('highlighted');
    });
    
    // クリックされたセルをハイライト
    target.classList.add('highlighted');
    
    // セルの情報をログに出力（デバッグ用）
    const row = target.parentElement;
    if (row) {
      const employeeName = row.children[1]?.textContent;
      const cellIndex = Array.from(row.children).indexOf(target);
      const hour = cellIndex - 2; // -2は番号・氏名カラム分
      console.log(`クリック: ${employeeName} - ${hour}時`);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: 'MS PGothic, sans-serif',
        width: '100vw',
        margin: 0,
        padding: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'auto'
      }}>
      {/* 最上段バー1 */}
      <Box sx={{ 
        backgroundColor: '#003366',
        color: 'white',
        padding: '8px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '40px'
      }}>
        <Typography variant="h6" sx={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
          ライン別日別実績表
        </Typography>
        <Typography sx={{ fontSize: '18px', fontWeight: 'normal' }}>
          {new Date().toLocaleDateString('ja-JP', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            weekday: 'short'
          })}
        </Typography>
      </Box>

      {/* 最上段バー2 */}
      <Box sx={{ 
        backgroundColor: 'transparent',
        color: 'white',
        padding: '8px 20px',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        height: '40px'
      }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBack />}
          onClick={() => navigate('/admin')}
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
          メニューに戻る
        </Button>
      </Box>

      <Box sx={{ flexGrow: 1, margin: 0, padding: '8px 20px 20px 20px', width: '100%' }}>

      {/* 検索条件 */}
      <Card sx={{ mb: 2, margin: 0, padding: 0, width: '100%' }} className="fade-in">
        <CardContent sx={{ margin: 0, width: '100%', boxSizing: 'border-box', padding: '12px 16px' }}>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: '0.16fr 0.16fr 0.25fr 0.43fr' },
            gap: '12px',
            alignItems: 'end',
            backgroundColor: 'white',
            padding: '12px',
            borderRadius: 1,
            border: '1px solid #dee2e6',
            width: '100%',
            boxSizing: 'border-box',
            overflow: 'visible',
            position: 'relative',
            zIndex: 1
          }}>
            <DatePicker
              label="対象年月"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              format="yyyy年M月d日"
              slotProps={{
                textField: {
                  size: 'small'
                }
              }}
            />
            
            <FormControl sx={{ minWidth: 120, zIndex: 9999 }} size="small">
              <InputLabel>ライン</InputLabel>
              <Select
                value={selectedLine}
                label="ライン"
                onChange={(e) => handleLineChange(e.target.value)}
                size="small"
                MenuProps={{
                  style: {
                    zIndex: 9999
                  },
                  PaperProps: {
                    style: {
                      zIndex: 9999
                    }
                  }
                }}
              >
                <MenuItem value="">全て</MenuItem>
                {lines.map((line) => (
                  <MenuItem key={line.id} value={line.id.toString()}>
                    {line.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* ボタンエリア */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'end' }}>
              <Button
                variant="contained"
                onClick={generateReport}
                disabled={loading || !selectedLine || !selectedDate}
                size="small"
                sx={{ minWidth: '80px' }}
              >
                {loading ? '読み込み中...' : '表示更新'}
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleExportCSV}
                size="small"
                sx={{ minWidth: '80px' }}
              >
                CSV出力
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleExportPDF}
                size="small"
                sx={{ minWidth: '80px', ml: 1 }}
              >
                PDF出力
              </Button>
            </Box>
            
          </Box>
        </CardContent>
      </Card>

      {/* メイン表示エリア（カレンダー形式） */}
      {lineData && (
        <Card sx={{ margin: 0, padding: 0, width: '100%' }} className="fade-in-delay-1">
          <CardContent sx={{ padding: 0, margin: 0, width: '100%' }}>
            <Typography variant="h6" sx={{ padding: 2, borderBottom: '1px solid #dee2e6' }}>
              {lineData.line.name} - {selectedDate?.toLocaleDateString('ja-JP', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
            
            <div className="calendar-container">
              <table className="calendar-table">
                <thead>
                  <tr>
                    <th className="employee-header employee-no">社員CD</th>
                    <th className="employee-header employee-name">氏名</th>
                    {lineData.time_slots.map((hour, index) => {
                      // 30分刻みのセルを1時間ごとに結合（00分のセルのみ表示、30分のセルは非表示）
                      if (index % 2 === 1) return null; // 30分のセルは非表示
                      
                      const hourGroup = Math.floor(index / 2) % 2 === 0 ? 'hour-group-1' : 'hour-group-2';
                      return (
                        <th key={index} className={`time-header ${hourGroup}`} colSpan={2}>{hour}</th>
                      );
                    })}
                    <th className="total-cell">計</th>
                  </tr>
                  <tr>
                    <th className="employee-header employee-no"></th>
                    <th className="employee-header employee-name"></th>
                    {lineData.time_periods.map((period, index) => {
                      // 30分刻みのセルを1時間ごとに結合（00分のセルのみ表示、30分のセルは非表示）
                      if (index % 2 === 1) return null; // 30分のセルは非表示
                      
                      const hourGroup = Math.floor(index / 2) % 2 === 0 ? 'hour-group-1' : 'hour-group-2';
                      return (
                        <th key={index} className={`time-period ${hourGroup}`} colSpan={2}>{period}</th>
                      );
                    })}
                    <th className="total-cell"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineData.employees.map((empData, index) => (
                    <tr key={empData.employee.id} className="employee-row">
                      <td className="employee-no">{empData.employee.employee_id}</td>
                      <td className="employee-name">{empData.employee.name}</td>
                      {empData.hourly_status.map((status, hourIndex) => (
                        <td 
                          key={hourIndex}
                          className={`attendance-cell ${status ? 'attendance-present' : 'attendance-absent'}`}
                          onClick={handleCellClick}
                        >
                          {status ? (
                            <span style={{ color: '#90EE90' }}>■</span>
                          ) : ''}
                        </td>
                      ))}
                                             <td className="total-cell">
                         {(() => {
                           // 管理画面の設定に基づいて適切なtotal_work_timeを取得
                           let totalMinutes = 0;
                           const attendanceRecord = lineData?.attendances?.find(att => 
                             att.employee_id === empData.employee.employee_id
                           );
                           
                           if (attendanceRecord) {
                             switch (timeRoundingMode) {
                               case 15:
                                 totalMinutes = attendanceRecord.total_work_time_15min || 0;
                                 break;
                               case 10:
                                 totalMinutes = attendanceRecord.total_work_time_10min || 0;
                                 break;
                               case 5:
                                 totalMinutes = attendanceRecord.total_work_time_5min || 0;
                                 break;
                               case 1:
                                 totalMinutes = attendanceRecord.total_work_time_1min || 0;
                                 break;
                               default:
                                 totalMinutes = attendanceRecord.total_work_time_15min || 0;
                             }
                           }
                           
                           const workTime = totalMinutes > 0 
                             ? `${Math.floor(totalMinutes / 60)}:${(totalMinutes % 60).toString().padStart(2, '0')}`
                             : '0:00';
                           
                           return workTime === '0:00' ? (
                             <span style={{ color: '#F0F0F0' }}>0:00</span>
                           ) : workTime;
                         })()}
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 勤怠記録の件数表示 - ライン選択後、表表示前 */}
      {selectedLine && attendanceCount !== null && !lineData && !loading && (
        <Card sx={{ backgroundColor: '#d4edda', borderLeft: '4px solid #28a745' }} className="fade-in-delay-2">
          <CardContent>
            <Typography color="#155724">
              {attendanceCount > 0 
                ? `${attendanceCount}名の勤怠記録があります。「表示更新」ボタンを押して詳細を表示してください。`
                : '勤怠記録がありません。'
              }
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* データなしの場合 - 表示更新ボタンを押した後にのみ表示 */}
      {selectedLine && lineData && !lineData.hasAttendanceData && !loading && (
        <Card sx={{ backgroundColor: '#fff3cd', borderLeft: '4px solid #ffc107' }} className="fade-in-delay-2">
          <CardContent>
            <Typography color="#856404">
              選択されたライン・日付に勤怠記録がありません。
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* ライン未選択の場合 */}
      {!selectedLine && (
        <Card sx={{ backgroundColor: '#d1ecf1', borderLeft: '4px solid #17a2b8' }} className="fade-in-delay-2">
          <CardContent>
            <Typography color="#0c5460">
              レポートを表示するにはラインを選択してください。
            </Typography>
          </CardContent>
        </Card>
      )}
      </Box>
    </Box>
    </LocalizationProvider>
  );
};

export default LineDailyReportPage;