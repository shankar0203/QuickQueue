import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import axios from 'axios';
import './App.css';

// Components
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import EventsPage from './pages/EventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import CheckoutPage from './pages/CheckoutPage';
import TicketPage from './pages/TicketPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ContactPage from './pages/ContactPage';
import { AuthProvider, useAuth } from './context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Set axios default base URL
axios.defaults.baseURL = API;

// Protected Route Component
function ProtectedRoute({ children, requireRole = null }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireRole && user.role !== requireRole && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

// App Layout Component
function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main>{children}</main>
      <Toaster position="top-right" richColors />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            <Route path="/" element={
              <AppLayout>
                <LandingPage />
              </AppLayout>
            } />
            
            <Route path="/events" element={
              <AppLayout>
                <EventsPage />
              </AppLayout>
            } />
            
            <Route path="/events/:id" element={
              <AppLayout>
                <EventDetailsPage />
              </AppLayout>
            } />
            
            <Route path="/checkout/:eventId" element={
              <AppLayout>
                <CheckoutPage />
              </AppLayout>
            } />
            
            <Route path="/ticket/:ticketNumber" element={
              <AppLayout>
                <TicketPage />
              </AppLayout>
            } />
            
            <Route path="/contact" element={
              <AppLayout>
                <ContactPage />
              </AppLayout>
            } />
            
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;