import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { isMockMode } from '../lib/firebase';
import { KeyRound, Mail, Lock, Shield, HelpCircle, Check, Languages, Globe } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, loginOffline, loading } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showHelper, setShowHelper] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || t('loginError'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-300 px-4">
      {/* Absolute top right settings: language */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={() => setLanguage(language === 'ja' ? 'es' : 'ja')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border rounded-full hover:bg-slate-50 shadow-sm transition"
        >
          <Globe className="h-3.5 w-3.5 text-slate-500" />
          <span>{language === 'ja' ? 'Español' : '日本語'}</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden p-8 relative">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-indigo-900 flex items-center justify-center mb-3 shadow-md shadow-indigo-950/20">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight text-center">
            {t('appName')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isMockMode ? t('mockFirebaseActive') : t('realFirebaseActive')}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-800 font-semibold leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              {t('email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mawork.jp"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-slate-50/50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                {t('password')}
              </label>
              {isMockMode && (
                <button
                  type="button"
                  onClick={() => setShowHelper(!showHelper)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-bold"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>認証情報</span>
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-slate-50/50"
              />
            </div>
          </div>

          {showHelper && isMockMode && (
            <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-lg text-xs text-indigo-900 leading-relaxed font-medium">
              <div className="font-bold mb-1">デモログイン情報:</div>
              <div>メール: <span className="font-mono bg-white px-1 py-0.5 rounded border">demo@mawork.jp</span></div>
              <div>パスワード: <span className="font-mono bg-white px-1 py-0.5 rounded border">demo1234</span></div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-900 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-950 transition active:scale-[0.98] shadow-md shadow-indigo-900/10 text-sm flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                <span>{t('login')}</span>
              </>
            )}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <span className="relative px-3 bg-white text-xs font-semibold text-slate-400">OR</span>
        </div>

        <button
          onClick={loginOffline}
          className="w-full border border-slate-200 text-slate-700 bg-white font-bold py-3 rounded-xl hover:bg-slate-50 transition active:scale-[0.98] text-sm flex items-center justify-center gap-2 shadow-sm"
        >
          <Shield className="h-4 w-4 text-emerald-600" />
          <span>{t('offlineBypass')}</span>
        </button>

        <div className="mt-8 text-center text-[10px] text-slate-400 font-semibold leading-relaxed">
          {t('fileLimitWarning')}
        </div>
      </div>
    </div>
  );
};
