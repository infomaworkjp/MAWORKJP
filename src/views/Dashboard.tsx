import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useLanguage } from '../context/LanguageContext';
import { useSync } from '../hooks/useSync';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Layers, FolderOpen, RefreshCw, Wifi, WifiOff, MessageSquare, ArrowRight, ShieldAlert, CheckCircle2, AlertCircle, Ban, Clock, Globe, Calendar, CheckCircle, XCircle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isOnline, isSyncing, lastSyncedAt, syncData } = useSync();

  // Basic stats
  const customerCount = useLiveQuery(() => db.customers.count()) || 0;
  const activeCasesCount = useLiveQuery(() => db.cases.where('status').equals('in_progress').count()) || 0;
  const evidenceCount = useLiveQuery(() => db.evidenceFiles.count()) || 0;

  // Unsynced count
  const pendingSyncCount = useLiveQuery(async () => {
    const pc = await db.customers.where('syncStatus').equals('pending').count();
    const pk = await db.cases.where('syncStatus').equals('pending').count();
    const pcon = await db.consultations.where('syncStatus').equals('pending').count();
    const pe = await db.evidenceFiles.where('syncStatus').equals('pending').count();
    return pc + pk + pcon + pe;
  }) || 0;

  // Determine Backup Status (成功 / 失敗 / 保留中)
  let backupStatus: 'success' | 'failure' | 'pending' = 'success';
  if (isSyncing || (pendingSyncCount > 0 && isOnline)) {
    backupStatus = 'pending';
  } else if (!isOnline && pendingSyncCount > 0) {
    backupStatus = 'failure';
  } else if (pendingSyncCount === 0) {
    backupStatus = 'success';
  }

  // 5 Recent Customers
  const recentCustomers = useLiveQuery(async () => {
    const list = await db.customers.toArray();
    return list.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  }) || [];

  // 5 Recent Cases
  const recentCases = useLiveQuery(async () => {
    const list = await db.cases.toArray();
    return list.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  }) || [];

  // Today's Activity Queries (actions since midnight today)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();
  const todayDateStr = new Date().toISOString().split('T')[0];

  const todayActivities = useLiveQuery(async () => {
    const newCusts = await db.customers.filter(c => c.updatedAt >= todayStartMs).toArray();
    const newCases = await db.cases.filter(k => k.updatedAt >= todayStartMs).toArray();
    const todayCons = await db.consultations.filter(con => con.date === todayDateStr).toArray();

    return {
      newCustomersCount: newCusts.length,
      newCasesCount: newCases.length,
      newConsultationsCount: todayCons.length,
      details: [
        ...newCusts.map(c => ({
          type: 'customer' as const,
          time: c.updatedAt,
          text: `顧客情報が更新されました: ${c.name} (${c.nationality})`,
          link: `/customers/${c.customerId}`
        })),
        ...newCases.map(k => ({
          type: 'case' as const,
          time: k.updatedAt,
          text: `案件情報が更新されました: ${k.title} (${k.category})`,
          link: `/cases/${k.caseId}`
        })),
        ...todayCons.map(con => ({
          type: 'consultation' as const,
          time: con.updatedAt,
          text: `相談記録が登録されました: ${con.summary}`,
          link: `/cases/${con.caseId}`
        }))
      ].sort((a, b) => b.time - a.time)
    };
  }, [todayStartMs, todayDateStr]) || { newCustomersCount: 0, newCasesCount: 0, newConsultationsCount: 0, details: [] };

  const getStatusBadge = (stat: Case['status']) => {
    switch (stat) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700">
            {t('pending')}
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700">
            {t('in_progress')}
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700">
            {t('completed')}
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700">
            {t('suspended')}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            M-A Work JP 業務管理システム
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            翻訳・通訳業務の顧客管理・案件進捗・証拠デジタル保管システム
          </p>
        </div>
        
        {/* Offline Warning Banner */}
        {!isOnline && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-100 max-w-sm text-xs text-amber-800 font-semibold leading-relaxed shrink-0">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">オフライン動作中</div>
              <div className="text-[10px] text-amber-700/80 font-medium mt-0.5">
                変更はローカルに保存されます。オンライン復帰時に自動的にバックアップされます。
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards & Backup Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Total Customers */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">顧客総数</span>
            <span className="text-2xl font-black text-slate-800 block">
              {customerCount} <span className="text-xs font-semibold text-slate-400">名</span>
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Users className="h-5 w-5 text-indigo-905 text-indigo-900" />
          </div>
        </div>

        {/* Active Cases */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">進行中案件</span>
            <span className="text-2xl font-black text-slate-800 block">
              {activeCasesCount} <span className="text-xs font-semibold text-slate-400">件</span>
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Layers className="h-5 w-5 text-emerald-700" />
          </div>
        </div>

        {/* Evidence files count */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">保管ファイル数</span>
            <span className="text-2xl font-black text-slate-800 block">
              {evidenceCount} <span className="text-xs font-semibold text-slate-400">ファイル</span>
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <FolderOpen className="h-5 w-5 text-blue-700" />
          </div>
        </div>

        {/* Backup Status card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              バックアップ状況
            </span>
            {backupStatus === 'success' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                <CheckCircle className="h-3 w-3" />
                <span>成功 (同期済)</span>
              </span>
            )}
            {backupStatus === 'pending' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
                <Clock className="h-3 w-3" />
                <span>保留中</span>
              </span>
            )}
            {backupStatus === 'failure' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                <XCircle className="h-3 w-3" />
                <span>失敗 (未同期)</span>
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-[10px] text-slate-500 font-semibold flex items-center justify-between">
              <span>未バックアップ件数:</span>
              <span className="font-bold text-slate-700">{pendingSyncCount} 件</span>
            </div>
            <div className="text-[9px] text-slate-400 leading-tight">
              {lastSyncedAt ? `最終同期: ${lastSyncedAt}` : '未同期'}
            </div>
          </div>

          <button
            onClick={syncData}
            disabled={!isOnline || isSyncing || pendingSyncCount === 0}
            className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 border ${
              pendingSyncCount > 0 && isOnline
                ? 'bg-indigo-900 text-white border-indigo-900 hover:bg-indigo-950 shadow-sm'
                : 'bg-slate-50 text-slate-400 border-slate-200 disabled:opacity-50'
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>手動バックアップ同期</span>
          </button>
        </div>
      </div>

      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Today's Summary Log */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-900" />
              <span>今日の活動サマリー</span>
            </h2>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">新規/更新顧客</span>
                <span className="text-lg font-black text-slate-800 mt-1 block">
                  {todayActivities.newCustomersCount} <span className="text-xs font-semibold text-slate-400">名</span>
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">更新案件</span>
                <span className="text-lg font-black text-slate-800 mt-1 block">
                  {todayActivities.newCasesCount} <span className="text-xs font-semibold text-slate-400">件</span>
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">実施相談</span>
                <span className="text-lg font-black text-slate-800 mt-1 block">
                  {todayActivities.newConsultationsCount} <span className="text-xs font-semibold text-slate-400">件</span>
                </span>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {todayActivities.details.length === 0 ? (
                <div className="text-center text-slate-400 text-xs py-8 font-semibold">
                  今日の活動（顧客追加、案件更新、相談記録登録）はまだありません。
                </div>
              ) : (
                todayActivities.details.map((act, index) => (
                  <div
                    key={index}
                    onClick={() => navigate(act.link)}
                    className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-indigo-900/50 hover:bg-slate-50 transition cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {act.type === 'customer' && <Users className="h-4 w-4 text-indigo-900 shrink-0" />}
                      {act.type === 'case' && <Layers className="h-4 w-4 text-emerald-700 shrink-0" />}
                      {act.type === 'consultation' && <MessageSquare className="h-4 w-4 text-blue-700 shrink-0" />}
                      <span className="font-semibold text-slate-700 leading-snug">{act.text}</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-2">
                      {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Quick actions & Lists */}
        <div className="space-y-6">
          
          {/* Quick links */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-800 tracking-tight">クイック操作</h2>
            <div className="grid grid-cols-1 gap-2.5 text-xs font-bold">
              <Link
                to="/customers"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2 text-slate-700">
                  <Users className="h-4 w-4 text-indigo-900" />
                  <span>顧客の管理・新規追加</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>

              <Link
                to="/cases"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2 text-slate-700">
                  <Layers className="h-4 w-4 text-emerald-700" />
                  <span>案件の管理・新規追加</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Recent Customers (5 items) */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-800 tracking-tight">最近の顧客一覧（5件）</h2>
            <div className="space-y-3">
              {recentCustomers.length === 0 ? (
                <div className="text-center text-slate-400 text-xs py-4 font-semibold">
                  登録された顧客はありません。
                </div>
              ) : (
                recentCustomers.map((c) => (
                  <div
                    key={c.customerId}
                    onClick={() => navigate(`/customers/${c.customerId}`)}
                    className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-indigo-900 cursor-pointer flex items-center justify-between gap-3 text-xs transition hover:bg-slate-50"
                  >
                    <div className="truncate">
                      <div className="font-bold text-slate-800 truncate">{c.name}</div>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold mt-1 uppercase">
                        <Globe className="h-3 w-3" />
                        <span>{c.nationality || '未設定'}</span>
                        <span>•</span>
                        <span>{c.birthdate || '未設定'}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Cases (5 items) */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-800 tracking-tight">最近の案件一覧（5件）</h2>
            <div className="space-y-3">
              {recentCases.length === 0 ? (
                <div className="text-center text-slate-400 text-xs py-4 font-semibold">
                  登録された案件はありません。
                </div>
              ) : (
                recentCases.map((kase) => (
                  <div
                    key={kase.caseId}
                    onClick={() => navigate(`/cases/${kase.caseId}`)}
                    className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-indigo-900 cursor-pointer flex items-center justify-between gap-3 text-xs transition hover:bg-slate-50"
                  >
                    <div className="truncate flex-1 min-w-0">
                      <div className="font-bold text-slate-800 truncate">{kase.title}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {getStatusBadge(kase.status)}
                        <span className="text-[9px] text-slate-400 font-bold uppercase">
                          {kase.category} • 進捗: {kase.progress}%
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
