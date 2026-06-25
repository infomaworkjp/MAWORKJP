import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateUUID, Customer } from '../db';
import { useLanguage } from '../context/LanguageContext';
import { Search, Plus, Edit2, Trash2, Mail, Phone, Tag, Clipboard, CheckCircle, XCircle, MapPin, UserCheck, Calendar, Globe, HelpCircle, Clock, FileText } from 'lucide-react';

export const Customers: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // Reactively query customers from Dexie
  const customers = useLiveQuery(() => db.customers.toArray()) || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNationality, setSelectedNationality] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [referrer, setReferrer] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Customer['status']>('inquiry');
  const [mainCategory, setMainCategory] = useState('書類のみの翻訳');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCustomer: Customer = {
      customerId: generateUUID(),
      name,
      nationality,
      birthdate,
      phone,
      email,
      address,
      referrer,
      notes,
      status,
      mainCategory,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncStatus: 'pending',
    };

    await db.customers.put(newCustomer);
    resetForm();
    setIsAddModalOpen(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;

    const updatedCustomer: Customer = {
      ...currentCustomer,
      name,
      nationality,
      birthdate,
      phone,
      email,
      address,
      referrer,
      notes,
      status,
      mainCategory,
      updatedAt: Date.now(),
      syncStatus: 'pending',
    };

    await db.customers.put(updatedCustomer);
    resetForm();
    setIsEditModalOpen(false);
  };

  const handleDelete = async (customerId: string) => {
    if (window.confirm('この顧客を削除してもよろしいですか？関連する案件、相談履歴、証拠ファイルもすべて削除されます。')) {
      await db.customers.delete(customerId);
      
      // Delete associated cases and evidence
      const assocCases = await db.cases.where('customerId').equals(customerId).toArray();
      for (const kase of assocCases) {
        await db.cases.delete(kase.caseId);
        await db.evidenceFiles.where('caseId').equals(kase.caseId).delete();
      }
      
      // Delete consultations
      await db.consultations.where('customerId').equals(customerId).delete();
    }
  };

  const openEditModal = (customer: Customer) => {
    setCurrentCustomer(customer);
    setName(customer.name);
    setNationality(customer.nationality);
    setBirthdate(customer.birthdate);
    setPhone(customer.phone);
    setEmail(customer.email);
    setAddress(customer.address);
    setReferrer(customer.referrer);
    setNotes(customer.notes);
    setStatus(customer.status);
    setMainCategory(customer.mainCategory || 'その他');
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setName('');
    setNationality('');
    setBirthdate('');
    setPhone('');
    setEmail('');
    setAddress('');
    setReferrer('');
    setNotes('');
    setStatus('inquiry');
    setMainCategory('書類のみの翻訳');
    setCurrentCustomer(null);
  };

  // Unique list of nationalities for filtering
  const nationalities = Array.from(new Set(customers.map(c => c.nationality).filter(Boolean)));

  // Filter logic
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.referrer && c.referrer.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesNationality = selectedNationality === 'All' || c.nationality === selectedNationality;
    const matchesCategory =
      selectedCategory === 'All' ||
      c.mainCategory === selectedCategory ||
      (!c.mainCategory && selectedCategory === 'その他');
    return matchesSearch && matchesNationality && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{t('customers')}</h1>
          <p className="text-xs text-slate-400 mt-1">顧客登録・生年月日・国籍・住所・紹介者の管理</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsAddModalOpen(true); }}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-950 transition active:scale-95 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>{t('addCustomer')}</span>
        </button>
      </div>

      {/* Filters bar */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="氏名・電話番号・紹介者で検索..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs bg-white"
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 md:col-span-2 items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">業務:</span>
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 text-xs font-bold rounded-full border whitespace-nowrap transition active:scale-95 ${
                selectedCategory === 'All'
                  ? 'bg-indigo-900 text-white border-indigo-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              すべての業務
            </button>
            {['法律関係', '書類のみの翻訳', '在留カード更新サポート', '通訳関係', 'その他'].map((cat) => {
              const count = customers.filter(c => c.mainCategory === cat || (!c.mainCategory && cat === 'その他')).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full border whitespace-nowrap transition active:scale-95 ${
                    selectedCategory === cat
                      ? 'bg-indigo-900 text-white border-indigo-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Nationality filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1 shrink-0">国籍:</span>
          <button
            onClick={() => setSelectedNationality('All')}
            className={`px-3 py-1 text-xs font-bold rounded-full border whitespace-nowrap transition active:scale-95 ${
              selectedNationality === 'All'
                ? 'bg-indigo-900 text-white border-indigo-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            すべての国籍
          </button>
          {nationalities.map((nat) => (
            <button
              key={nat}
              onClick={() => setSelectedNationality(nat)}
              className={`px-3 py-1 text-xs font-bold rounded-full border whitespace-nowrap transition active:scale-95 ${
                selectedNationality === nat
                  ? 'bg-indigo-900 text-white border-indigo-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {nat}
            </button>
          ))}
        </div>
      </div>

      {/* Customers table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">{t('customerName')}</th>
                <th className="p-4">国籍 / 生年月日</th>
                <th className="p-4">連絡先 / 住所</th>
                <th className="p-4">紹介者</th>
                <th className="p-4">{t('status')}</th>
                <th className="p-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                    {t('noData')}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr
                    key={c.customerId}
                    onClick={() => navigate(`/customers/${c.customerId}`)}
                    className="hover:bg-slate-50/40 transition cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="font-bold text-indigo-900 hover:underline text-sm">{c.name}</div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[9px] text-slate-400 font-mono">{c.customerId.substring(0, 8)}...</span>
                        <span className={`inline-flex items-center text-[9px] font-black px-2 py-0.5 rounded-full ${
                          c.mainCategory === '法律関係' ? 'bg-purple-50 text-purple-700' :
                          c.mainCategory === '書類のみの翻訳' ? 'bg-blue-50 text-blue-700' :
                          c.mainCategory === '在留カード更新サポート' ? 'bg-emerald-50 text-emerald-700' :
                          c.mainCategory === '通訳関係' ? 'bg-amber-50 text-amber-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {c.mainCategory || 'その他'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                        <Globe className="h-3.5 w-3.5 text-slate-400" />
                        <span>{c.nationality || '未登録'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{c.birthdate || '未登録'}</span>
                      </div>
                    </td>
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span>{c.email}</span>
                        </div>
                      )}
                      {c.address && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] truncate max-w-[200px]">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{c.address}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-slate-600 font-semibold">
                      {c.referrer ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                          <UserCheck className="h-3 w-3" />
                          {c.referrer}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      {(() => {
                        switch (c.status) {
                          case 'inquiry':
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                <HelpCircle className="h-3 w-3" />
                                <span>{t('inquiry')}</span>
                              </span>
                            );
                          case 'waiting_payment':
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                <Clock className="h-3 w-3" />
                                <span>{t('waiting_payment')}</span>
                              </span>
                            );
                          case 'in_progress':
                          case 'active':
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                <CheckCircle className="h-3 w-3" />
                                <span>{c.status === 'active' ? t('active') : t('in_progress')}</span>
                              </span>
                            );
                          case 'waiting_documents':
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                                <FileText className="h-3 w-3" />
                                <span>{t('waiting_documents')}</span>
                              </span>
                            );
                          case 'translating':
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                <Globe className="h-3 w-3" />
                                <span>{t('translating')}</span>
                              </span>
                            );
                          case 'completed':
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100">
                                <CheckCircle className="h-3 w-3" />
                                <span>{t('completed')}</span>
                              </span>
                            );
                          case 'inactive':
                          default:
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                <XCircle className="h-3 w-3" />
                                <span>{t('inactive')}</span>
                              </span>
                            );
                        }
                      })()}
                      {c.syncStatus === 'pending' && (
                        <span className="ml-2 text-[9px] text-amber-500 font-semibold bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">
                          未同期
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                          title={t('edit')}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.customerId)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          title={t('delete')}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden p-6">
            <h3 className="text-base font-black text-slate-800 tracking-tight mb-4">
              {t('addCustomer')}
            </h3>
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">氏名</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="山田 太郎"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">国籍</label>
                  <input
                    type="text"
                    required
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="例: ペルー / ボリビア"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">生年月日</label>
                  <input
                    type="date"
                    required
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">電話番号</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="090-0000-0000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">メールアドレス</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">紹介者</label>
                  <input
                    type="text"
                    value={referrer}
                    onChange={(e) => setReferrer(e.target.value)}
                    placeholder="紹介者の氏名"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">住所</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="東京都新宿区西新宿1-1-1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">主な業務カテゴリー</label>
                  <select
                    value={mainCategory}
                    onChange={(e) => setMainCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="法律関係">法律関係</option>
                    <option value="書類のみの翻訳">書類のみの翻訳</option>
                    <option value="在留カード更新サポート">在留カード更新サポート</option>
                    <option value="通訳関係">通訳関係</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('status')}</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="inquiry">{t('inquiry')}</option>
                    <option value="waiting_payment">{t('waiting_payment')}</option>
                    <option value="in_progress">{t('in_progress')}</option>
                    <option value="waiting_documents">{t('waiting_documents')}</option>
                    <option value="translating">{t('translating')}</option>
                    <option value="completed">{t('completed')}</option>
                    <option value="inactive">{t('inactive')}</option>
                    {status === 'active' && <option value="active">{t('active')}</option>}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">メモ</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="アレルギー、特筆すべき背景等メモがあれば記入してください"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden p-6">
            <h3 className="text-base font-black text-slate-800 tracking-tight mb-4">
              {t('editCustomer')}
            </h3>
            
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">氏名</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">国籍</label>
                  <input
                    type="text"
                    required
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">生年月日</label>
                  <input
                    type="date"
                    required
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">電話番号</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">メールアドレス</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">紹介者</label>
                  <input
                    type="text"
                    value={referrer}
                    onChange={(e) => setReferrer(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">住所</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">主な業務カテゴリー</label>
                  <select
                    value={mainCategory}
                    onChange={(e) => setMainCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="法律関係">法律関係</option>
                    <option value="書類のみの翻訳">書類のみの翻訳</option>
                    <option value="在留カード更新サポート">在留カード更新サポート</option>
                    <option value="通訳関係">通訳関係</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('status')}</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="inquiry">{t('inquiry')}</option>
                    <option value="waiting_payment">{t('waiting_payment')}</option>
                    <option value="in_progress">{t('in_progress')}</option>
                    <option value="waiting_documents">{t('waiting_documents')}</option>
                    <option value="translating">{t('translating')}</option>
                    <option value="completed">{t('completed')}</option>
                    <option value="inactive">{t('inactive')}</option>
                    {status === 'active' && <option value="active">{t('active')}</option>}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">メモ</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
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
