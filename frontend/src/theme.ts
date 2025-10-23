import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  shape: {
    borderRadius: 16, // デフォルトの角の丸みを16pxに設定
  },
  typography: {
    // フォントサイズを全体的に大きく調整
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
    button: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    caption: {
      fontSize: '0.75rem',
    },
  },
  components: {
    // カードコンポーネント
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    // ボタンコンポーネント
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    // ダイアログコンポーネント
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    // テキストフィールドコンポーネント
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            fontSize: '1rem',
          },
          '& .MuiInputLabel-root': {
            fontSize: '1rem',
          },
        },
      },
    },
    // タブコンポーネント
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTab-root': {
            borderRadius: '12px 12px 0 0',
            fontSize: '1rem',
            fontWeight: 500,
          },
        },
      },
    },
    // テーブルコンポーネント
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    // テーブルヘッダー
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontSize: '1rem',
            fontWeight: 600,
          },
        },
      },
    },
    // テーブルセル
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
        },
      },
    },
    // ペーパーコンポーネント
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    // チェックボックスコンポーネント
    MuiCheckbox: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    // スイッチコンポーネント
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-track': {
            borderRadius: 12,
          },
          '& .MuiSwitch-thumb': {
            borderRadius: 10,
          },
        },
      },
    },
    // セレクトコンポーネント
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    // アラートコンポーネント
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontSize: '1rem',
        },
      },
    },
    // ダイアログタイトル
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 600,
        },
      },
    },
    // フォームコントロールラベル
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          fontSize: '1rem',
        },
      },
    },
  },
});

export default theme;
