/* eslint-disable */
/* @ts-nocheck */
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
    matchId?: string;
    type?: string;
  }[];
  onLogout?: () => void;
  onNotificationClick?: (notification: any) => void;
}

export default function DashboardHeader({ 
  userName, 
  userEmail, 
  userRole,
  notifications,
  onLogout,
  onNotificationClick
}: DashboardHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showViewAllModal, setShowViewAllModal] = useState(false);
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
    <header className="bg-white! border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          
          {/* Left Section - Logo & Title */}
          <div className="shrink-0 flex items-center gap-3">
            <div className="w-14 h-14 bg-white! rounded-full flex items-center justify-center shadow-inner">
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
                className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50! rounded-lg transition-all duration-200"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500! text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Menu */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white! rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Bell size={16} />
                      Notifications {unreadCount > 0 && `(${unreadCount})`}
                    </h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => {
                            if (onNotificationClick) {
                              onNotificationClick(notification);
                              setShowNotifications(false);
                            }
                          }}
                          className={`p-4 border-b border-gray-50 hover:!bg-blue-50 cursor-pointer transition-all duration-200 active:scale-98 ${
                            !notification.read ? '!bg-blue-100' : 'bg-white'
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <div className={`p-1.5 rounded-full ${
                                notification.type === 'incident' ? '!bg-red-100' :
                                notification.type === 'completed' ? '!bg-green-100' :
                                notification.type === 'admin_update' ? '!bg-purple-100' :
                                '!bg-blue-100'
                              }`}>
                                <AlertCircle
                                  size={14}
                                  className={
                                    notification.type === 'incident' ? 'text-red-600' :
                                    notification.type === 'completed' ? 'text-green-600' :
                                    notification.type === 'admin_update' ? 'text-purple-600' :
                                    notification.read ? 'text-gray-400' : 'text-blue-600'
                                  }
                                />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                            </div>
                            {!notification.read && (
                              <div className="flex-shrink-0 w-2 h-2 rounded-full !bg-blue-600 mt-1" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <Bell size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-100 bg-gray-50 flex gap-2">
                    {notifications.length > 5 && (
                      <button 
                        onClick={() => {
                          setShowViewAllModal(true);
                          setShowNotifications(false);
                        }}
                        className="flex-1 text-sm text-blue-600 hover:text-blue-700 font-semibold py-2 px-3 rounded-lg hover:!bg-blue-100 transition-colors"
                      >
                        View All ({notifications.length})
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button 
                        onClick={() => {
                          // Optional: Clear all notifications
                          // For now, just close
                          setShowNotifications(false);
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-2 rounded hover:!bg-gray-200 transition-colors"
                        title="Close"
                      >
                        ✕
                      </button>
                    )}
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

      {/* View All Notifications Modal */}
      {showViewAllModal && (
        <div className="fixed inset-0 !bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="!bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between gap-4 p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">All Notifications</h2>
                <p className="text-sm text-gray-600 mt-1">Total: {notifications.length}</p>
              </div>
              <button
                onClick={() => setShowViewAllModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:!bg-gray-100 rounded-full transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => {
                        if (onNotificationClick) {
                          onNotificationClick(notification);
                          setShowViewAllModal(false);
                        }
                      }}
                      className={`p-4 hover:!bg-blue-50 cursor-pointer transition-all duration-200 ${
                        !notification.read ? '!bg-blue-100' : 'bg-white'
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={`p-2 rounded-full ${
                            notification.type === 'incident' ? '!bg-red-100' :
                            notification.type === 'completed' ? '!bg-green-100' :
                            notification.type === 'admin_update' ? '!bg-purple-100' :
                            '!bg-blue-100'
                          }`}>
                            <AlertCircle
                              size={16}
                              className={
                                notification.type === 'incident' ? 'text-red-600' :
                                notification.type === 'completed' ? 'text-green-600' :
                                notification.type === 'admin_update' ? 'text-purple-600' :
                                notification.read ? 'text-gray-400' : 'text-blue-600'
                              }
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                        </div>
                        {!notification.read && (
                          <div className="flex-shrink-0 w-2 h-2 rounded-full !bg-blue-600 mt-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-gray-500">
                  <Bell size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="text-base">No notifications</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 p-4 bg-gray-50 flex gap-2">
              <button
                onClick={() => setShowViewAllModal(false)}
                className="flex-1 px-4 py-2 !bg-gray-100 text-gray-700 font-medium rounded-lg hover:!bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
