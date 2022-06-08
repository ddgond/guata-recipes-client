import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { grey } from '@mui/material/colors';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1E90FF',
    },
    secondary: {
      main: '#90EE90',
    },
    error: {
      main: '#F08080'
    },
    info: {
      main: grey[800]
    }
  },
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      }
    },
  },
  typography: {
    fontFamily: [
      'circe',
      'sans-serif'
    ].join(',')
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <Routes>
          <Route path="/" element={<App />}/>
          <Route path=":recipeSlug" element={<App />}/>
          <Route path="*" element={<App />}/>
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
