import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import Layout from './components/Layout';
import Home from './pages/Home';
import PunchPage from './pages/PunchPage';
import ReportsPage from './pages/ReportsPage';
import ManagementPage from './pages/ManagementPage';
import AdminPage from './pages/AdminPage'; // 追加
import LineDailyReportPage from './pages/LineDailyReportPage'; // 追加
import LineMonthlyReportPage from './pages/LineMonthlyReportPage'; // 追加
import MonthlyReportPage from './pages/MonthlyReportPage'; // 追加
import MonthlySummaryPage from './pages/MonthlySummaryPage'; // 追加
import ErrorListPage from './pages/ErrorListPage'; // 追加
import AttendanceInputPage from './pages/AttendanceInputPage'; // 追加
import AttendanceBookPage from './pages/AttendanceBookPage'; // 追加
import ApplicationPage from './pages/ApplicationPage'; // 追加
import PersonalCalendarPage from './pages/PersonalCalendarPage'; // 追加
import ShiftInputPage from './pages/ShiftInputPage'; // 追加
import theme from './theme'; // カスタムテーマをインポート

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/line-monthly-report" element={<LineMonthlyReportPage />} />
          <Route path="/line-daily-report" element={<LineDailyReportPage />} />
          <Route path="/monthly-report" element={<MonthlyReportPage />} />
          <Route path="/monthly-summary" element={<MonthlySummaryPage />} />
          <Route path="/error-list" element={<ErrorListPage />} />
          <Route path="/attendance-input" element={<AttendanceInputPage />} />
          <Route path="/attendance-book" element={<AttendanceBookPage />} />
          <Route path="/application" element={<ApplicationPage />} />
          <Route path="/personal-calendar" element={<PersonalCalendarPage />} />
          <Route path="/shift-input" element={<ShiftInputPage />} />
          <Route path="/punch" element={<PunchPage />} />
          <Route path="/management" element={<ManagementPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;