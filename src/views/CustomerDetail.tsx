import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateUUID, Customer, Case, Evidence } from '../db';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, Edit2, Phone, Mail, Globe, Calendar, MapPin, UserCheck, FileText, Clipboard, Plus, Layers, MessageSquare, CheckCircle, XCircle, Clock, AlertCircle, Ban, CheckCircle2, Paperclip, Eye, Trash2, HelpCircle, ImageIcon, Music, Video } from 'lucide-react';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddCaseOpen, setIsAddCaseOpen] = useState(false);
  const [previewEvidence, setPreviewEvidence] = useState<Evidence | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Form states (Customer Edit)
  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [referrer, setReferrer] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // Form states (New Case)
  const [caseTitle, setCaseTitle] = useState('');
  const [caseCategory, setCaseCategory] = useState('翻訳');
  const [caseConsultationContent, setCaseConsultationContent] = useState('');
  const [caseBackground, setCaseBackground] = useState('');
  const [caseActionTaken, setCaseActionTaken] = useState('');
  const [caseFee, setCaseFee] = useState<number>(0);
  const [caseStatus, setCaseStatus] = useState<Case['status']>('pending');
  const [caseProgress, setCaseProgress] = useState<number>(0);

  // Reactively query customer detail
  const customer = useLiveQuery(() => id ? db.customers.get(id) : Promise.resolve(undefined), [id]);

  // Reactively query customer cases
  const associatedCases = useLiveQuery(() => id ? db.cases.where('customerId').equals(id).toArray() : Promise.resolve([]), [id]) || [];

  // Reactively query customer consultations
  const associatedConsultations = useLiveQuery(() => {
    return id ? db.consultations.where('customerId').equals(id).toArray() : Promise.resolve([]);
  }, [id]) || [];

  // Reactively query evidence files for all cases of this customer
  const associatedEvidence = useLiveQuery(async () => {
    if (!id) return [];
    const cases = await db.cases.where('customerId').equals(id).toArray();
    const caseIds = cases.map(c => c.caseId);
    if (caseIds.length === 0) return [];
    return db.evidenceFiles.where('caseId').anyOf(caseIds).toArray();
  }, [id, associatedCases]) || [];

  // Clean up ObjectURLs to prevent memory leaks
  useEffect(() => {
    if (previewEvidence?.fileData) {
      const url = URL.createObjectURL(previewEvidence.fileData);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setPreviewUrl(null);
      };
    }
  }, [previewEvidence]);

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (window.confirm('この証拠ファイルを削除してもよろしいですか？')) {
      await db.evidenceFiles.delete(evidenceId);
      if (previewEvidence?.evidenceId === evidenceId) setPreviewEvidence(null);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-emerald-500" />;
    if (type === 'application/pdf') return <FileText className="h-5 w-5 text-rose-500" />;
    if (type.startsWith('audio/')) return <Music className="h-5 w-5 text-amber-500" />;
    if (type.startsWith('video/')) return <Video className="h-5 w-5 text-indigo-500" />;
    return <Paperclip className="h-5 w-5 text-slate-400" />;
  };

  // Initialize edit form values when customer loads or when modal opens
  const openEditModal = () => {
    if (!customer) return;
    setName(customer.name);
    setNationality(customer.nationality || '');
    setBirthdate(customer.birthdate || '');
    setPhone(customer.phone || '');
    setEmail(customer.email || '');
    setAddress(customer.address || '');
    setReferrer(customer.referrer || '');
    setNotes(customer.notes || '');
    setStatus(customer.status || 'active');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    const updatedCustomer: Customer = {
      ...customer,
      name,
      nationality,
      birthdate,
      phone,
      email,
      address,
      referrer,
      notes,
      status,
      updatedAt: Date.now(),
      syncStatus: 'pending',
    };

    await db.customers.put(updatedCustomer);
    setIsEditModalOpen(false);
  };

  const handleAddCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const newCase: Case = {
      caseId: generateUUID(),
      customerId: id,
      title: caseTitle,
      category: caseCategory,
      consultationContent: caseConsultationContent,
      background: caseBackground,
      actionTaken: caseActionTaken,
      fee: Number(caseFee) || 0,
      paymentStatus: 'unpaid', // Default paymentStatus
      status: caseStatus,
      progress: caseProgress,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncStatus: 'pending',
    };

    await db.cases.put(newCase);
    
    // Reset Form
    setCaseTitle('');
    setCaseCategory('翻訳');
    setCaseConsultationContent('');
    setCaseBackground('');
    setCaseActionTaken('');
    setCaseFee(0);
    setCaseStatus('pending');
    setCaseProgress(0);
    setIsAddCaseOpen(false);
  };

  if (customer === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-indigo-900/30 border-t-indigo-900 rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500">{t('loading')}</span>
        </div>
      </div>
    );
  }

  if (customer === null) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">顧客が見つかりません</h2>
        <p className="text-xs text-slate-400 mt-2">削除されたか、IDが正しくない可能性があります。</p>
        <button
          onClick={() => navigate('/customers')}
          className="mt-6 inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-950 transition active:scale-95 shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>顧客一覧に戻る</span>
        </button>
      </div>
    );
  }

  const sortedConsultations = [...associatedConsultations].sort((a, b) => b.date.localeCompare(a.date));

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

  const getMethodBadge = (m: string) => {
    let name = m;
    let color = 'bg-slate-100 text-slate-700';
    if (m === 'line') { name = 'LINE'; color = 'bg-emerald-50 text-emerald-800'; }
    else if (m === 'whatsapp') { name = 'WhatsApp'; color = 'bg-green-50 text-green-800'; }
    else if (m === 'phone') { name = '電話'; color = 'bg-blue-50 text-blue-800'; }
    else if (m === 'email') { name = 'メール'; color = 'bg-indigo-50 text-indigo-800'; }
    else if (m === 'in_person') { name = '対面'; color = 'bg-amber-50 text-amber-800'; }
    else if (m === 'online') { name = 'オンライン'; color = 'bg-purple-50 text-purple-800'; }

    return (
      <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full ${color}`}>
        {name}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header breadcrumb & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-900 transition self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>顧客一覧に戻る</span>
        </button>

        <button
          onClick={openEditModal}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-950 transition active:scale-95 shadow-sm self-start"
        >
          <Edit2 className="h-3.5 w-3.5" />
          <span>顧客情報の編集</span>
        </button>
      </div>

      {/* Main Profile Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Card: Customer Profile Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="space-y-3">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                customer.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {customer.status === 'active' ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    <span>有効顧客</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    <span>無効顧客</span>
                  </>
                )}
              </span>
              
              <h2 className="text-xl font-black text-slate-800 tracking-tight leading-tight">
                {customer.name}
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                ID: {customer.customerId}
              </p>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Globe className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">国籍</span>
                  <span className="text-xs font-bold text-slate-700">{customer.nationality || '未登録'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">生年月日</span>
                  <span className="text-xs font-bold text-slate-700">{customer.birthdate || '未登録'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">電話番号</span>
                  <a href={`tel:${customer.phone}`} className="text-xs font-bold text-indigo-900 hover:underline">
                    {customer.phone || '未登録'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">メールアドレス</span>
                  {customer.email ? (
                    <a href={`mailto:${customer.email}`} className="text-xs font-bold text-indigo-900 hover:underline">
                      {customer.email}
                    </a>
                  ) : (
                    <span className="text-xs font-medium text-slate-400">未登録</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">住所</span>
                  <span className="text-xs font-semibold text-slate-700 leading-relaxed">
                    {customer.address || '未登録'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <UserCheck className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">紹介者</span>
                  {customer.referrer ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">
                      {customer.referrer}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-400">なし</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">登録日時</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {customer.createdAt ? new Date(customer.createdAt).toLocaleString() : '未設定'}
                  </span>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">メモ・備考</span>
              <p className="text-xs text-slate-600 bg-slate-50 border rounded-xl p-3.5 leading-relaxed min-h-[80px]">
                {customer.notes || 'メモはありません。'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Sections: Associated Cases & Consultation History */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Linked Cases List Section */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-900" />
                <span>関連する案件一覧 ({associatedCases.length})</span>
              </h3>
              
              <button
                onClick={() => setIsAddCaseOpen(true)}
                className="flex items-center justify-center gap-1 px-3 py-1.5 bg-indigo-900 text-white text-xs font-bold rounded-lg hover:bg-indigo-950 transition active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>新規案件登録</span>
              </button>
            </div>

            {associatedCases.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-8 border-2 border-dashed rounded-xl border-slate-100 font-semibold">
                登録されている案件はありません。上の「新規案件登録」から案件を追加できます。
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {associatedCases.map((kase) => (
                  <Link
                    key={kase.caseId}
                    to={`/cases/${kase.caseId}`}
                    className="block p-4 border border-slate-100 rounded-xl hover:border-indigo-900 hover:shadow-sm transition bg-slate-50/20"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      {getStatusBadge(kase.status)}
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[9px]">
                        {kase.category}
                      </span>
                    </div>

                    <h4 className="font-black text-slate-850 text-xs tracking-tight line-clamp-1 mb-3">
                      {kase.title}
                    </h4>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>進捗率</span>
                        <span className="text-indigo-900">{kase.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-900 rounded-full transition-all duration-550"
                          style={{ width: `${kase.progress}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Linked Evidence Files Section */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-indigo-900" />
              <span>証拠ファイル一覧 ({associatedEvidence.length})</span>
            </h3>

            {associatedEvidence.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-8 border-2 border-dashed rounded-xl border-slate-100 font-semibold">
                アップロードされたファイルはありません。各案件詳細ページから追加できます。
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {associatedEvidence.map((ev) => {
                  const parentCase = associatedCases.find(c => c.caseId === ev.caseId);
                  return (
                    <div key={ev.evidenceId} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs gap-2 hover:bg-slate-100/50 transition">
                      <div className="truncate min-w-0 flex-1">
                        <div className="font-bold text-slate-800 truncate" title={ev.name}>{ev.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-slate-400 font-mono">
                            {(ev.size / 1024).toFixed(1)} KB
                          </span>
                          {parentCase && (
                            <span className="text-[9px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold truncate max-w-[120px]" title={parentCase.title}>
                              {parentCase.title}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setPreviewEvidence(ev)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition"
                          title="プレビュー"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvidence(ev.evidenceId)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition"
                          title="削除"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Linked Consultation Timeline Section */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-900" />
              <span>関連する相談履歴タイムライン ({sortedConsultations.length})</span>
            </h3>

            <div className="space-y-6">
              {sortedConsultations.length === 0 ? (
                <div className="text-center text-slate-400 text-xs py-8 font-semibold">
                  相談履歴はまだありません。各案件詳細ページから相談記録を追加できます。
                </div>
              ) : (
                sortedConsultations.map((con) => (
                  <div key={con.consultationId} className="relative pl-6 border-l-2 border-indigo-900/10 py-1">
                    <div className="absolute left-[-6px] top-2.5 h-3.5 w-3.5 rounded-full bg-indigo-900 flex items-center justify-center border-2 border-white">
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-slate-400 mb-1">
                      <span className="font-mono">{con.date}</span>
                      <div className="flex items-center gap-2">
                        {getMethodBadge(con.method)}
                        {con.caseId && (
                          <Link
                            to={`/cases/${con.caseId}`}
                            className="inline-flex items-center gap-0.5 text-indigo-900 hover:underline text-[9px] font-bold bg-indigo-50 px-1.5 py-0.5 rounded"
                          >
                            <Layers className="h-2.5 w-2.5" />
                            <span>関連案件</span>
                          </Link>
                        )}
                      </div>
                    </div>

                    <h4 className="font-black text-slate-800 text-xs leading-snug mb-1.5">
                      {con.summary}
                    </h4>

                    {con.notes && (
                      <p className="text-xs text-slate-500 font-medium leading-relaxed bg-slate-50/50 rounded-xl p-3 border border-slate-50">
                        {con.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Customer Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-slate-800 tracking-tight mb-4">
              顧客情報の編集
            </h3>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ステータス</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="active">有効</option>
                    <option value="inactive">無効</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">メモ</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[85px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition active:scale-95"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-950 transition active:scale-95"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Case Modal (Predefined Customer) */}
      {isAddCaseOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-slate-800 tracking-tight mb-4">
              新規案件登録
            </h3>

            <form onSubmit={handleAddCaseSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">顧客名 (固定)</label>
                  <input
                    type="text"
                    disabled
                    value={customer.name}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">カテゴリー</label>
                  <select
                    value={caseCategory}
                    onChange={(e) => setCaseCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="翻訳">翻訳</option>
                    <option value="通訳">通訳</option>
                    <option value="査証申請">査証申請 (ビザ)</option>
                    <option value="法律相談">法律相談</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">案件名</label>
                <input
                  type="text"
                  required
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  placeholder="例: 身元保証通訳案件"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ステータス</label>
                  <select
                    value={caseStatus}
                    onChange={(e) => setCaseStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="pending">未着手</option>
                    <option value="in_progress">進行中</option>
                    <option value="completed">完了</option>
                    <option value="suspended">保留</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">料金 (JPY)</label>
                  <input
                    type="number"
                    value={caseFee}
                    onChange={(e) => setCaseFee(Number(e.target.value))}
                    placeholder="15000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>進捗率</span>
                    <span className="text-indigo-900">{caseProgress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={caseProgress}
                    onChange={(e) => setCaseProgress(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-900 mt-2"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">相談内容</label>
                <textarea
                  value={caseConsultationContent}
                  onChange={(e) => setCaseConsultationContent(e.target.value)}
                  placeholder="相談内容の詳細"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">経緯・理由</label>
                <textarea
                  value={caseBackground}
                  onChange={(e) => setCaseBackground(e.target.value)}
                  placeholder="案件に至る経緯"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">対応内容</label>
                <textarea
                  value={caseActionTaken}
                  onChange={(e) => setCaseActionTaken(e.target.value)}
                  placeholder="今後のステップ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCaseOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition active:scale-95"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-950 transition active:scale-95"
                >
                  登録
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewEvidence && previewUrl && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-3xl h-[80vh] shadow-xl overflow-hidden flex flex-col justify-between">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getFileIcon(previewEvidence.type)}
                <h3 className="text-sm font-black text-slate-800 tracking-tight truncate max-w-[450px]">
                  {previewEvidence.name}
                </h3>
              </div>
              <button
                onClick={() => setPreviewEvidence(null)}
                className="px-3 py-1.5 border text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition active:scale-95"
              >
                閉じる
              </button>
            </div>

            {/* Preview Area */}
            <div className="flex-1 bg-slate-900 flex items-center justify-center overflow-hidden p-4">
              {previewEvidence.type.startsWith('image/') && (
                <img src={previewUrl} alt={previewEvidence.name} className="max-w-full max-h-full object-contain rounded" />
              )}
              {previewEvidence.type === 'application/pdf' && (
                <iframe src={previewUrl} title={previewEvidence.name} className="w-full h-full border-0 rounded bg-white" />
              )}
              {previewEvidence.type.startsWith('audio/') && (
                <audio src={previewUrl} controls className="w-full max-w-md bg-white rounded-lg p-2" />
              )}
              {previewEvidence.type.startsWith('video/') && (
                <video src={previewUrl} controls className="max-w-full max-h-full rounded" />
              )}
              {!previewEvidence.type.startsWith('image/') &&
               previewEvidence.type !== 'application/pdf' &&
               !previewEvidence.type.startsWith('audio/') &&
               !previewEvidence.type.startsWith('video/') && (
                <div className="text-center text-white space-y-3">
                  <HelpCircle className="h-12 w-12 text-slate-500 mx-auto" />
                  <p className="text-xs">このファイル形式のプレビューはブラウザでサポートされていません。</p>
                  <a
                    href={previewUrl}
                    download={previewEvidence.name}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl text-xs font-bold transition"
                  >
                    ファイルをダウンロード
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-slate-50 flex justify-between items-center text-xs text-slate-500">
              <span>サイズ: {(previewEvidence.size / 1024).toFixed(1)} KB</span>
              <span>形式: {previewEvidence.type}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
