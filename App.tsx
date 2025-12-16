
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { UserRole } from './types';
import { ProfilePage } from './components/profile/ProfilePage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { StudentDashboard } from './components/student/StudentDashboard';
import { OrganizerDashboard } from './components/organizer/OrganizerDashboard';
import { DashboardLayout } from './components/layout/DashboardLayout';

const APP_VERSION = 'v1.0.1';

type ViewState = 'dashboard' | 'profile';

// Router Component to decide which dashboard to show
const RoleBasedDashboard: React.FC = () => {
    const { user } = useAuth();

    if (user?.role === UserRole.ADMIN) {
        return <AdminDashboard />;
    }

    if (user?.role === UserRole.ORGANIZER) {
        return <OrganizerDashboard />;
    }

    return <StudentDashboard />;
};

const AuthScreen: React.FC = () => {
  const [view, setView] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-purple-50 to-white">
       <div className="mb-10 text-center animate-fade-in-down">
          <div className="h-20 w-20 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-6 transform rotate-3 hover:rotate-6 transition-transform duration-300">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
             </svg>
          </div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-2">USV Events</h1>
          <p className="text-lg text-gray-500 font-medium">Platforma ta pentru viața studențească</p>
       </div>
       
       <div className="w-full flex justify-center transition-all duration-500 ease-in-out">
         {view === 'login' ? (
           <LoginForm onSwitchToRegister={() => setView('register')} />
         ) : (
           <RegisterForm onSwitchToLogin={() => setView('login')} />
         )}
       </div>
       <div className="mt-8 text-xs text-gray-400 font-mono">
           {APP_VERSION}
       </div>
    </div>
  );
}

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [view, setView] = useState<ViewState>('dashboard');

  // Automatically reset to dashboard view when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      setView('dashboard');
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-500 font-medium animate-pulse">Se încarcă...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
      return <AuthScreen />;
  }

  return (
    <DashboardLayout currentView={view} onViewChange={setView}>
        {view === 'dashboard' ? <RoleBasedDashboard /> : <ProfilePage />}
    </DashboardLayout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
