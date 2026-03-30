
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AsgardeoProvider } from '@asgardeo/react';


import App from './App.jsx';

// Debug: Log the redirect URL being used
console.log("Redirect URL:", "http://localhost:5173/");


// Debug: Log Asgardeo config object

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AsgardeoProvider
      clientId={import.meta.env.VITE_ASGARDEO_CLIENT_ID}
      baseUrl={import.meta.env.VITE_ASGARDEO_BASE_URL}
      signInRedirectURL="http://localhost:5173/"
      signOutRedirectURL="http://localhost:5173/"
      scopes="openid profile"
      redirectUri="http://localhost:5173/"
    >
      <App />
    </AsgardeoProvider>
  </React.StrictMode>
);