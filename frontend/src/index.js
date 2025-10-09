import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import store from './store.js';
import { Provider } from 'react-redux';
import './styles/app.scss';
import { logout } from './slices/userSlice';
import { setLogoutHandler } from './axiosSetup';
const root = ReactDOM.createRoot(document.getElementById('root'));

setLogoutHandler(() => {
  store.dispatch(logout());
  window.location.href = '/';
});
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
