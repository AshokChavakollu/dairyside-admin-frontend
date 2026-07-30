import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import { ToastContainer, Zoom } from 'react-toastify'
import App from './App.jsx'
import { AdminAuthProvider } from './auth/AdminAuthContext'
import './styles/index.css'
import 'react-toastify/dist/ReactToastify.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AdminAuthProvider>
          <App />
        </AdminAuthProvider>
        <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        transition={Zoom}
      />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)
