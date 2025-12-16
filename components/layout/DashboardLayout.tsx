
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { NotificationDropdown } from '../ui/NotificationDropdown';
import { notificationService } from '../../services/notificationService';

// Version injected or hardcoded
const APP_VERSION = 'v1.0.1';

type ViewState = 'dashboard' | 'profile';

interface DashboardLayoutProps {
    children: React.ReactNode;
    currentView: ViewState;
    onViewChange: (view: ViewState) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, currentView, onViewChange }) => {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    const res = await notificationService.getUnreadCount();
    if (res.success && res.data) {
      setUnreadCount(res.data.unreadCount);
    }
  };

  const getRoleBadgeStyles = (role?: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-red-100 text-red-700 border-red-200";
      case UserRole.ORGANIZER:
        return "bg-purple-100 text-purple-700 border-purple-200";
      case UserRole.STUDENT:
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => onViewChange('dashboard')}>
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-2 shadow-sm">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">USV Events</span>
            </div>
            <div className="flex items-center space-x-4">
              
              {/* Notifications Bell */}
              <div className="relative">
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors relative focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <NotificationDropdown 
                  isOpen={isNotifOpen} 
                  onClose={() => setIsNotifOpen(false)} 
                  onUpdateUnreadCount={setUnreadCount}
                />
              </div>

              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900 leading-tight">{user?.firstName} {user?.lastName}</p>
                <div className="flex justify-end mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide ${getRoleBadgeStyles(user?.role)}`}>
                    {user?.role === UserRole.ORGANIZER ? 'Organizator' : user?.role}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={() => onViewChange('profile')}
                className={`h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md transition-transform hover:scale-105 ${currentView === 'profile' ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
                title="Profilul Meu"
              >
                {user?.profileImage ? (
                     <img src={user.profileImage} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                     <span>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</span>
                )}
              </button>

              <button 
                onClick={logout}
                className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors ml-2 px-3 py-1.5 rounded-md hover:bg-red-50"
              >
                Deconectare
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {children}
      </main>

      <footer className="w-full bg-white border-t border-gray-200 py-4 text-center mt-auto">
         <p className="text-xs text-gray-400">
           &copy; {new Date().getFullYear()} USV Events. Universitatea Ștefan cel Mare din Suceava. <span className="font-mono text-gray-300 ml-2">{APP_VERSION}</span>
         </p>
      </footer>
    </div>
  );
};
