import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSync } from '../../hooks/useSync';
import { Shield, RefreshCw, Wifi, WifiOff, LogOut, Globe, LayoutDashboard, Users, FolderOpen, Layers } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { isOnline, isSyncing, lastSyncedAt, syncData } = useSync();

  return (
    <nav className="bg-indigo-950 text-white shadow-md border-b border-indigo-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section: Logo and app name */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <Shield className="h-5 w-5 text-indigo-950" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight leading-tight">
                {t('appName')}
              </span>
              {user?.isOfflineUser && (
                <span className="text-[10px] text-emerald-400 font-bold leading-none">
                  {t('loginOffline')}
                </span>
              )}
            </div>
          </div>

          {/* Middle section: Navigation links */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  isActive ? 'bg-indigo-900 text-white' : 'text-slate-300 hover:bg-indigo-900/40 hover:text-white'
                }`
              }
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>{t('dashboard')}</span>
            </NavLink>
            <NavLink
              to="/customers"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  isActive ? 'bg-indigo-900 text-white' : 'text-slate-300 hover:bg-indigo-900/40 hover:text-white'
                }`
              }
            >
              <Users className="h-4 w-4" />
              <span>{t('customers')}</span>
            </NavLink>
            <NavLink
              to="/cases"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  isActive ? 'bg-indigo-900 text-white' : 'text-slate-300 hover:bg-indigo-900/40 hover:text-white'
                }`
              }
            >
              <Layers className="h-4 w-4" />
              <span>{t('cases')}</span>
            </NavLink>
            <NavLink
              to="/evidence"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  isActive ? 'bg-indigo-900 text-white' : 'text-slate-300 hover:bg-indigo-900/40 hover:text-white'
                }`
              }
            >
              <FolderOpen className="h-4 w-4" />
              <span>{t('evidence')}</span>
            </NavLink>
          </div>

          {/* Right section: connection status, sync, language, logout */}
          <div className="flex items-center gap-3">
            {/* Connection state banner */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Wifi className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('online')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <WifiOff className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('offline')}</span>
                </div>
              )}

              {/* Sync button */}
              <button
                onClick={syncData}
                disabled={!isOnline || isSyncing}
                title={lastSyncedAt ? `${t('lastSynced')}: ${lastSyncedAt}` : t('sync')}
                className={`p-2 rounded-xl hover:bg-indigo-900/60 transition active:scale-95 ${
                  isSyncing ? 'text-indigo-400' : 'text-slate-300 hover:text-white'
                } disabled:opacity-40 disabled:scale-100`}
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="h-4 w-px bg-indigo-900"></div>

            {/* Language selector */}
            <button
              onClick={() => setLanguage(language === 'ja' ? 'es' : 'ja')}
              className="p-2 rounded-xl hover:bg-indigo-900/60 text-slate-300 hover:text-white transition active:scale-95 flex items-center gap-1 text-xs font-bold"
              title="Change Language"
            >
              <Globe className="h-4 w-4" />
              <span className="uppercase text-[10px]">{language}</span>
            </button>

            {/* Logout button */}
            <div className="flex items-center gap-2 pl-1">
              <span className="hidden lg:inline text-xs font-semibold text-slate-300">
                {user?.displayName}
              </span>
              <button
                onClick={logout}
                className="p-2 rounded-xl hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition active:scale-95"
                title={t('logout')}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile nav bar menu (bottom for mobile devices or sub header) */}
      <div className="md:hidden flex items-center justify-around bg-indigo-950/80 border-t border-indigo-900/40 py-2">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[10px] font-bold transition ${
              isActive ? 'text-white' : 'text-slate-400'
            }`
          }
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>{t('dashboard')}</span>
        </NavLink>
        <NavLink
          to="/customers"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[10px] font-bold transition ${
              isActive ? 'text-white' : 'text-slate-400'
            }`
          }
        >
          <Users className="h-4 w-4" />
          <span>{t('customers')}</span>
        </NavLink>
        <NavLink
          to="/cases"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[10px] font-bold transition ${
              isActive ? 'text-white' : 'text-slate-400'
            }`
          }
        >
          <Layers className="h-4 w-4" />
          <span>{t('cases')}</span>
        </NavLink>
        <NavLink
          to="/evidence"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[10px] font-bold transition ${
              isActive ? 'text-white' : 'text-slate-400'
            }`
          }
        >
          <FolderOpen className="h-4 w-4" />
          <span>{t('evidence')}</span>
        </NavLink>
      </div>
    </nav>
  );
};
