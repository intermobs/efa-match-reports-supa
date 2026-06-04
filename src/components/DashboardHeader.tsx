import { useState, useRef, useEffect } from 'react';
import { Bell, User, LogOut, Menu, X, AlertCircle } from 'lucide-react';
import { signOut } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface DashboardHeaderProps {
  userName: string;
  userEmail: string;
  userRole: string;
  notifications: {
    id: string;
    message: string;
    time: string;
    read?: boolean;
  }[];
  onLogout?: () => void;
}

export default function DashboardHeader({ 
  userName, 
  userEmail, 
  userRole,
  notifications,
  onLogout 
}: DashboardHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      if (onLogout) onLogout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="!bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          
          {/* Left Section - Logo & Title */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <div className="w-14 h-14 !bg-white rounded-full flex items-center justify-center shadow-inner">
             <img src="/safety_logo.png" className="w-12 h-12" />
            </div>
            <div className="hidden sm:block">               
              <h1 className="text-2xl font-bold text-blue-900">Command Center</h1>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold text-blue-900">EFA</h1>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Notifications Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
                className="relative p-2 text-gray-600 hover:text-blue-600 hover:!bg-blue-50 rounded-lg transition-all duration-200"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 !bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Menu */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 !bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Bell size={16} />
                      Notifications
                    </h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-50 hover:!bg-gray-50 cursor-pointer transition-colors ${
                            !notification.read ? '!bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-1">
                              <AlertCircle
                                size={16}
                                className={notification.read ? 'text-gray-400' : 'text-blue-600'}
                              />
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <Bell size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-100 text-center">
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      View All
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu Dropdown */}
            <div className="relative hidden sm:block" ref={userMenuRef}>
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:!bg-blue-50 rounded-lg transition-all duration-200"
                aria-label="User menu"
              >
                <User size={20} />
                <span className="text-sm font-medium hidden md:inline truncate max-w-[120px]">{userName}</span>
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 !bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 !bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                        <User size={20} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                        <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <div className="px-3 py-2 rounded hover:!bg-gray-50 cursor-pointer transition-colors">
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Account</p>
                      <p className="text-sm text-gray-700 mt-1">{userRole.toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="p-2 border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:!bg-red-50 rounded-lg transition-colors text-sm font-medium"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="sm:hidden p-2 text-gray-600 hover:!bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="sm:hidden border-t border-gray-200 py-4 px-2 !bg-gray-50">
            <div className="space-y-3">
              {/* Mobile User Info */}
              <div className="px-3 py-3 !bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 !bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                    <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                    <span className="text-xs !bg-blue-100 text-blue-800 font-bold rounded px-2 py-0.5 inline-block mt-1 uppercase">
                      {userRole}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Notifications Link */}
              <button
                onClick={() => {
                  setShowNotifications(true);
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:!bg-gray-200 rounded-lg transition-colors text-sm font-medium"
              >
                <Bell size={18} />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="ml-auto w-5 h-5 !bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Mobile Logout */}
              <button
                onClick={() => {
                  handleLogout();
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:!bg-red-50 rounded-lg transition-colors text-sm font-medium"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
