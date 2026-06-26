import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateUUID, Case, Customer } from '../db';
import { useLanguage } from '../context/LanguageContext';
import { Plus, Edit2, Trash2, Calendar, Clipboard, CheckCircle2, AlertCircle, Clock, Ban, User, MessageSquare, Paperclip, HelpCircle, DollarSign, BookOpen, MessageCircle, Eye } from 'lucide-react';

export const Cases: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Reactive DB queries
  const cases = useLiveQuery(() => db.cases.toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];

  // Selected customer for filtering cases
  const [selectedCustFilter, setSelectedCustFilter] = useState<string>('All');

  // Modals state
  const [isAddCaseOpen, setIsAddCaseOpen] = useState(false);
  const [isEditCaseOpen, setIsEditCaseOpen] = useState(false);
  const [currentCase, setCurrentCase] = useState<Case | null>(null);

  // Form states (Case)
  const [customerId, setCustomerId] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('翻訳');
  const [consultationContent, setConsultationContent] = useState('');
  const [background, setBackground] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [fee, setFee] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'paid' | 'partially_paid'>('unpaid');
  const [status, setStatus] = useState<Case['status']>('pending');
  const [progress, setProgress] = useState<number>(0);
  const [translationLanguageFrom, setTranslationLanguageFrom] = useState('スペイン語');
  const [translationLanguageTo, setTranslationLanguageTo] = useState('日本語');
  const [deadline, setDeadline] = useState('');

  const handleAddCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      alert('顧客を選択してください');
      return;
    }
    const newCase: Case = {
      caseId: generateUUID(),
      customerId,
      title,
      category,
      consultationContent,
      background,
      actionTaken,
      fee: Number(fee) || 0,
      paymentStatus,
      status,
      progress,
      translationLanguageFrom: category === '翻訳' ? translationLanguageFrom : undefined,
      translationLanguageTo: category === '翻訳' ? translationLanguageTo : undefined,
      deadline: category === '翻訳' ? deadline : undefined,
      translationProgress: category === '翻訳' ? progress : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncStatus: 'pending',
    };
    await db.cases.put(newCase);
    resetCaseForm();
    setIsAddCaseOpen(false);
  };

  const handleEditCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCase) return;
    const updatedCase: Case = {
      ...currentCase,
      customerId,
      title,
      category,
      consultationContent,
      background,
      actionTaken,
      fee: Number(fee) || 0,
      paymentStatus,
      status,
      progress,
      updatedAt: Date.now(),
      syncStatus: 'pending',
    };
    await db.cases.put(updatedCase);
    resetCaseForm();
    setIsEditCaseOpen(false);
  };

  const handleDeleteCase = async (caseId: string) => {
    if (window.confirm('この案件を削除してもよろしいですか？関連する相談履歴と証拠ファイルもすべて削除されます。')) {
      await db.cases.delete(caseId);
      await db.consultations.where('caseId').equals(caseId).delete();
      await db.evidenceFiles.where('caseId').equals(caseId).delete();
    }
  };

  const openEditCaseModal = (kase: Case) => {
    setCurrentCase(kase);
    setCustomerId(kase.customerId);
    setTitle(kase.title);
    setCategory(kase.category);
    setConsultationContent(kase.consultationContent || '');
    setBackground(kase.background || '');
    setActionTaken(kase.actionTaken || '');
    setFee(kase.fee || 0);
    setPaymentStatus(kase.paymentStatus || 'unpaid');
    setStatus(kase.status);
    setProgress(kase.progress);
    setIsEditCaseOpen(true);
  };

  const resetCaseForm = () => {
    setCustomerId(customers[0]?.customerId || '');
    setTitle('');
    setCategory('翻訳');
    setConsultationContent('');
    setBackground('');
    setActionTaken('');
    setFee(0);
    setPaymentStatus('unpaid');
    setStatus('pending');
    setProgress(0);
    setTranslationLanguageFrom('スペイン語');
    setTranslationLanguageTo('日本語');
    setDeadline('');
    setCurrentCase(null);
  };

  // Filter cases by selected Customer
  const filteredCases = cases.filter(c => selectedCustFilter === 'All' || c.customerId === selectedCustFilter);

  const getStatusBadge = (stat: Case['status']) => {
    switch (stat) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            <Clock className="h-3 w-3" />
            {t('pending')}
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
            <AlertCircle className="h-3 w-3 animate-pulse" />
            {t('in_progress')}
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            {t('completed')}
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
            <Ban className="h-3 w-3" />
            {t('suspended')}
          </span>
        );
      default:
        return null;
    }
  };

  const getPaymentBadge = (p: Case['paymentStatus']) => {
    switch (p) {
      case 'paid':
        return (
          <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
            支払済
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800">
            一部支払済
          </span>
        );
      case 'unpaid':
      default:
        return (
          <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800">
            未払
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{t('cases')}</h1>
          <p className="text-xs text-slate-400 mt-1">顧客ごとの案件・進捗管理・時系列相談記録</p>
        </div>
        <button
          onClick={() => { resetCaseForm(); setIsAddCaseOpen(true); }}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-950 transition active:scale-95 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>{t('addCase')}</span>
        </button>
      </div>

      {/* Main Container: Filters & Cases Grid */}
      <div className="space-y-6">
        {/* Customer filter bar */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">顧客で絞り込む:</span>
          </div>
          <select
            value={selectedCustFilter}
            onChange={(e) => setSelectedCustFilter(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="All">すべての顧客</option>
            {customers.map((c) => (
              <option key={c.customerId} value={c.customerId}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Cases grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.length === 0 ? (
            <div className="col-span-full bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 font-semibold">
              {t('noData')}
            </div>
          ) : (
            filteredCases.map((kase) => {
              const customer = customers.find(cust => cust.customerId === kase.customerId);
              return (
                <div
                  key={kase.caseId}
                  onClick={() => navigate(`/cases/${kase.caseId}`)}
                  className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md cursor-pointer transition relative flex flex-col justify-between hover:border-indigo-900"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex gap-1.5">
                        {getStatusBadge(kase.status)}
                        {getPaymentBadge(kase.paymentStatus)}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                        <BookOpen className="h-3 w-3 text-indigo-400" />
                        <span>{kase.category || '未設定'}</span>
                      </span>
                    </div>
                    
                    <h3 className="font-black text-slate-800 text-sm tracking-tight mb-2 line-clamp-1">
                      {kase.title}
                    </h3>

                    <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-bold text-slate-600">{customer?.name || 'Unknown'}</span>
                      </div>
                      {kase.fee > 0 && (
                        <div className="flex items-center gap-0.5 font-bold text-indigo-900 bg-indigo-50/50 px-2 py-0.5 rounded-md">
                          <span>¥{kase.fee.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>{t('caseProgress')}</span>
                        <span className="text-indigo-900">{kase.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-900 rounded-full transition-all duration-550"
                          style={{ width: `${kase.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Card actions (Edit/Delete) */}
                    <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-4">
                      <span className="text-[9px] text-slate-400 font-mono">
                        ID: {kase.caseId.substring(0, 8)}
                      </span>
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => openEditCaseModal(kase)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCase(kase.caseId)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Case Modal */}
      {isAddCaseOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-slate-800 tracking-tight mb-4">
              {t('addCase')}
            </h3>

            <form onSubmit={handleAddCase} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('caseCustomer')}</label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- 顧客を選択 --</option>
                    {customers.map((c) => (
                      <option key={c.customerId} value={c.customerId}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">カテゴリー</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="翻訳">翻訳</option>
                    <option value="通訳">通訳</option>
                    <option value="査証申請">査証申請 (ビザ)</option>
                    <option value="法律関係">法律関係</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
              </div>

              {category === '翻訳' && (
                <div className="grid grid-cols-3 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100/50 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">原文言語</label>
                    <input
                      type="text"
                      value={translationLanguageFrom}
                      onChange={(e) => setTranslationLanguageFrom(e.target.value)}
                      placeholder="スペイン語"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">訳文言語</label>
                    <input
                      type="text"
                      value={translationLanguageTo}
                      onChange={(e) => setTranslationLanguageTo(e.target.value)}
                      placeholder="日本語"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">納期</label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('caseTitle')}</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例: 配偶者ビザ申請翻訳・身元保証通訳案件"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">料金 (JPY)</label>
                  <input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                    placeholder="15000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">支払状況</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="unpaid">未払</option>
                    <option value="paid">支払済</option>
                    <option value="partially_paid">一部支払済</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('status')}</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {category === '翻訳' ? (
                      <>
                        <option value="pending">受付中</option>
                        <option value="in_progress">翻訳中</option>
                        <option value="completed">完了</option>
                        <option value="delivered">納品済み</option>
                      </>
                    ) : (
                      <>
                        <option value="pending">{t('pending')}</option>
                        <option value="in_progress">{t('in_progress')}</option>
                        <option value="completed">{t('completed')}</option>
                        <option value="suspended">{t('suspended')}</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>進捗率</span>
                    <span className="text-indigo-900">{progress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={progress}
                    onChange={(e) => setProgress(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-900 mt-2"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">相談内容</label>
                <textarea
                  value={consultationContent}
                  onChange={(e) => setConsultationContent(e.target.value)}
                  placeholder="相談された内容詳細"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">経緯・理由</label>
                <textarea
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  placeholder="案件に至る経緯"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">対応内容</label>
                <textarea
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="今後の作業・対応ステップ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCaseOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition active:scale-95"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-950 transition active:scale-95"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Case Modal */}
      {isEditCaseOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-slate-800 tracking-tight mb-4">
              {t('editCase')}
            </h3>

            <form onSubmit={handleEditCase} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('caseCustomer')}</label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {customers.map((c) => (
                      <option key={c.customerId} value={c.customerId}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">カテゴリー</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="翻訳">翻訳</option>
                    <option value="通訳">通訳</option>
                    <option value="査証申請">査証申請 (ビザ)</option>
                    <option value="法律関係">法律関係</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('caseTitle')}</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">料金 (JPY)</label>
                  <input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">支払状況</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="unpaid">未払</option>
                    <option value="paid">支払済</option>
                    <option value="partially_paid">一部支払済</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('status')}</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="pending">{t('pending')}</option>
                    <option value="in_progress">{t('in_progress')}</option>
                    <option value="completed">{t('completed')}</option>
                    <option value="suspended">{t('suspended')}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>進捗率</span>
                    <span className="text-indigo-900">{progress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={progress}
                    onChange={(e) => setProgress(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-900 mt-2"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">相談内容</label>
                <textarea
                  value={consultationContent}
                  onChange={(e) => setConsultationContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">経緯・理由</label>
                <textarea
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">対応内容</label>
                <textarea
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditCaseOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition active:scale-95"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-950 transition active:scale-95"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
