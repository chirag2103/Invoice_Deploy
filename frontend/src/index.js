import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import store from './store.js';
import { Provider } from 'react-redux';
import './styles/app.scss';
import 'react-toastify/dist/ReactToastify.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
