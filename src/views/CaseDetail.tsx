import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateUUID, Case, Customer, Consultation, Evidence } from '../db';
import { jsPDF } from 'jspdf';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, Edit2, User, Layers, Calendar, Clipboard, MessageSquare, Paperclip, Plus, Trash2, Eye, Upload, CheckCircle, CheckCircle2, Clock, AlertCircle, Ban, HelpCircle, ImageIcon, FileText, Music, Video, DollarSign, BookOpen, Download } from 'lucide-react';

export const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Modals / Dialogs state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddConsultationOpen, setIsAddConsultationOpen] = useState(false);
  const [previewEvidence, setPreviewEvidence] = useState<Evidence | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Form states (Case Edit)
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
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
  const [uploadCategory, setUploadCategory] = useState<'原文書' | '訳文書' | 'その他'>('その他');
  const [uploadFileCategories, setUploadFileCategories] = useState<('原文書' | '訳文書' | 'その他')[]>([]);

  // Form states (New Consultation)
  const [consultationDate, setConsultationDate] = useState(new Date().toISOString().split('T')[0]);
  const [consultant, setConsultant] = useState(''); // 相談者
  const [consultationMethod, setConsultationMethod] = useState<Consultation['method']>('line');
  const [consultationSummary, setConsultationSummary] = useState('');
  const [consultationNotes, setConsultationNotes] = useState('');
  const [consultationFiles, setConsultationFiles] = useState<FileList | null>(null);

  const handleConsultationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setConsultationFiles(files);
    if (files && files.length >= 2) {
      const imageCount = Array.from(files).filter(f => f.type.startsWith('image/')).length;
      if (imageCount >= 2) {
        setConsultationMergedPdfName(`面接写真結合_${new Date().toISOString().split('T')[0]}.pdf`);
        return;
      }
    }
    setConsultationMergedPdfName('');
    setShouldMergeConsultationImages(false);
  };

  // Drag and drop uploader state
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [evidenceTab, setEvidenceTab] = useState<'all' | 'image' | 'audio' | 'video' | 'pdf'>('all');

  // Upload confirmation and merging states
  const [pendingUploadFiles, setPendingUploadFiles] = useState<File[]>([]);
  const [uploadFileNames, setUploadFileNames] = useState<string[]>([]);
  const [isUploadConfirmOpen, setIsUploadConfirmOpen] = useState(false);
  const [shouldMergeImages, setShouldMergeImages] = useState(false);
  const [mergedPdfName, setMergedPdfName] = useState('');

  // Consultation merging states
  const [shouldMergeConsultationImages, setShouldMergeConsultationImages] = useState(false);
  const [consultationMergedPdfName, setConsultationMergedPdfName] = useState('');

  // Reactively query case detail
  const kase = useLiveQuery(() => id ? db.cases.get(id) : Promise.resolve(undefined), [id]);

  // Reactively query linked customer
  const customer = useLiveQuery(() => {
    if (kase) {
      return db.customers.get(kase.customerId);
    }
    return Promise.resolve(undefined);
  }, [kase]);

  // Reactively query associated consultations for this case
  const associatedConsultations = useLiveQuery(() => {
    return id ? db.consultations.where('caseId').equals(id).toArray() : Promise.resolve([]);
  }, [id]) || [];

  // Reactively query associated evidence for this case
  const associatedEvidence = useLiveQuery(() => {
    return id ? db.evidenceFiles.where('caseId').equals(id).toArray() : Promise.resolve([]);
  }, [id]) || [];

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

  const openEditModal = () => {
    if (!kase) return;
    setTitle(kase.title);
    setCategory(kase.category || '翻訳');
    setConsultationContent(kase.consultationContent || '');
    setBackground(kase.background || '');
    setActionTaken(kase.actionTaken || '');
    setFee(kase.fee || 0);
    setPaymentStatus(kase.paymentStatus || 'unpaid');
    setStatus(kase.status || 'pending');
    setProgress(kase.progress || 0);
    setTranslationLanguageFrom(kase.translationLanguageFrom || 'スペイン語');
    setTranslationLanguageTo(kase.translationLanguageTo || '日本語');
    setDeadline(kase.deadline || '');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kase) return;

    const updatedCase: Case = {
      ...kase,
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
      updatedAt: Date.now(),
      syncStatus: 'pending',
    };

    await db.cases.put(updatedCase);
    setIsEditModalOpen(false);
  };

  const handleAddConsultationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kase || !id) return;

    const newConsultation: Consultation = {
      consultationId: generateUUID(),
      customerId: kase.customerId,
      caseId: id,
      date: consultationDate,
      consultant,
      summary: consultationSummary,
      notes: consultationNotes,
      method: consultationMethod,
      createdAt: Date.now(),
      syncStatus: 'pending',
    };

    await db.consultations.put(newConsultation);

    // Save attached evidence files if any
    if (consultationFiles && consultationFiles.length > 0) {
      const fileList = Array.from(consultationFiles);
      const imageFiles = fileList.filter(f => f.type.startsWith('image/'));
      
      if (shouldMergeConsultationImages && imageFiles.length >= 2) {
        const finalPdfName = consultationMergedPdfName.endsWith('.pdf') ? consultationMergedPdfName : `${consultationMergedPdfName}.pdf`;
        try {
          const pdfBlob = await mergeImagesToPdf(imageFiles, finalPdfName);
          const newEvidence: Evidence = {
            evidenceId: generateUUID(),
            caseId: id,
            name: finalPdfName,
            type: 'application/pdf',
            size: pdfBlob.size,
            fileData: new File([pdfBlob], finalPdfName, { type: 'application/pdf' }),
            createdAt: Date.now(),
            syncStatus: 'pending',
          };
          await db.evidenceFiles.put(newEvidence);
        } catch (err) {
          console.error("Failed merging consultation images", err);
          alert("写真のPDF結合に失敗しました。個別に追加します。");
          for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            const newEvidence: Evidence = {
              evidenceId: generateUUID(),
              caseId: id,
              name: file.name,
              type: file.type,
              size: file.size,
              fileData: file,
              createdAt: Date.now(),
              syncStatus: 'pending',
            };
            await db.evidenceFiles.put(newEvidence);
          }
        }

        // Save non-image files
        const nonImageFiles = fileList.filter(f => !f.type.startsWith('image/'));
        for (let i = 0; i < nonImageFiles.length; i++) {
          const file = nonImageFiles[i];
          const newEv: Evidence = {
            evidenceId: generateUUID(),
            caseId: id,
            name: file.name,
            type: file.type,
            size: file.size,
            fileData: file,
            createdAt: Date.now(),
            syncStatus: 'pending',
          };
          await db.evidenceFiles.put(newEv);
        }
      } else {
        for (let i = 0; i < fileList.length; i++) {
          const file = fileList[i];
          const newEvidence: Evidence = {
            evidenceId: generateUUID(),
            caseId: id,
            name: file.name,
            type: file.type,
            size: file.size,
            fileData: file,
            createdAt: Date.now(),
            syncStatus: 'pending',
          };
          await db.evidenceFiles.put(newEvidence);
        }
      }
    }

    setConsultant('');
    setConsultationSummary('');
    setConsultationNotes('');
    setConsultationFiles(null);
    setShouldMergeConsultationImages(false);
    setConsultationMergedPdfName('');
    setIsAddConsultationOpen(false);
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      prepareUpload(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      prepareUpload(Array.from(e.target.files));
    }
  };

  const handlePairFiles = async (originalFileId: string, translatedFileId: string) => {
    try {
      await db.evidenceFiles.update(originalFileId, { relatedFileId: translatedFileId || undefined });
    } catch (err) {
      console.error("Failed to pair files", err);
    }
  };

  const prepareUpload = (files: File[], cat: '原文書' | '訳文書' | 'その他' = 'その他') => {
    setPendingUploadFiles(files);
    setUploadFileNames(files.map(f => f.name));
    setUploadFileCategories(files.map(() => cat));
    setShouldMergeImages(false);
    setUploadCategory(cat);
    
    const imageCount = files.filter(f => f.type.startsWith('image/')).length;
    if (imageCount >= 2) {
      setMergedPdfName(`画像結合_${new Date().toISOString().split('T')[0]}.pdf`);
    } else {
      setMergedPdfName('');
    }
    
    setIsUploadConfirmOpen(true);
  };

  const handleConfirmUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || pendingUploadFiles.length === 0) return;

    try {
      const imageFiles = pendingUploadFiles.filter(f => f.type.startsWith('image/'));
      
      if (shouldMergeImages && imageFiles.length >= 2) {
        const finalPdfName = mergedPdfName.endsWith('.pdf') ? mergedPdfName : `${mergedPdfName}.pdf`;
        const pdfBlob = await mergeImagesToPdf(imageFiles, finalPdfName);
        
        const newEvidence: Evidence = {
          evidenceId: generateUUID(),
          caseId: id,
          name: finalPdfName,
          type: 'application/pdf',
          size: pdfBlob.size,
          fileData: new File([pdfBlob], finalPdfName, { type: 'application/pdf' }),
          fileCategory: uploadCategory,
          createdAt: Date.now(),
          syncStatus: 'pending',
        };
        await db.evidenceFiles.put(newEvidence);

        const nonImageFiles = pendingUploadFiles.filter(f => !f.type.startsWith('image/'));
        for (let i = 0; i < nonImageFiles.length; i++) {
          const file = nonImageFiles[i];
          const originalIdx = pendingUploadFiles.indexOf(file);
          const customName = uploadFileNames[originalIdx] || file.name;
          const newEv: Evidence = {
            evidenceId: generateUUID(),
            caseId: id,
            name: customName,
            type: file.type,
            size: file.size,
            fileData: file,
            fileCategory: uploadFileCategories[originalIdx] || uploadCategory,
            createdAt: Date.now(),
            syncStatus: 'pending',
          };
          await db.evidenceFiles.put(newEv);
        }
      } else {
        for (let i = 0; i < pendingUploadFiles.length; i++) {
          const file = pendingUploadFiles[i];
          const customName = uploadFileNames[i] || file.name;
          const newEvidence: Evidence = {
            evidenceId: generateUUID(),
            caseId: id,
            name: customName,
            type: file.type,
            size: file.size,
            fileData: file,
            fileCategory: uploadFileCategories[i] || uploadCategory,
            createdAt: Date.now(),
            syncStatus: 'pending',
          };
          await db.evidenceFiles.put(newEvidence);
        }
      }
      
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to upload files", err);
      alert("ファイルの保存に失敗しました。");
    } finally {
      setIsUploadConfirmOpen(false);
      setPendingUploadFiles([]);
      setUploadFileNames([]);
      setUploadFileCategories([]);
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (window.confirm('この証拠ファイルを削除してもよろしいですか？')) {
      await db.evidenceFiles.delete(evidenceId);
      if (previewEvidence?.evidenceId === evidenceId) setPreviewEvidence(null);
    }
  };

  const handleDownloadEvidence = (ev: Evidence) => {
    const url = URL.createObjectURL(ev.fileData);
    const a = document.createElement('a');
    a.href = url;
    a.download = ev.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (kase === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-indigo-900/30 border-t-indigo-900 rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500">{t('loading')}</span>
        </div>
      </div>
    );
  }

  if (kase === null) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">案件が見つかりません</h2>
        <p className="text-xs text-slate-400 mt-2">削除されたか、IDが正しくない可能性があります。</p>
        <button
          onClick={() => navigate('/cases')}
          className="mt-6 inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-950 transition active:scale-95 shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>案件一覧に戻る</span>
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

  const getPaymentBadge = (p: Case['paymentStatus']) => {
    switch (p) {
      case 'paid':
        return (
          <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-750 text-emerald-700">
            支払済
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
            一部支払済
          </span>
        );
      case 'unpaid':
      default:
        return (
          <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700">
            未払
          </span>
        );
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

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-emerald-500" />;
    if (type === 'application/pdf') return <FileText className="h-5 w-5 text-rose-500" />;
    if (type.startsWith('audio/')) return <Music className="h-5 w-5 text-amber-500" />;
    if (type.startsWith('video/')) return <Video className="h-5 w-5 text-indigo-500" />;
    return <Paperclip className="h-5 w-5 text-slate-400" />;
  };

  const renderTranslationCase = () => {
    const originalFiles = associatedEvidence.filter(ev => ev.fileCategory === '原文書' || ev.fileCategory === 'original');
    const translatedFiles = associatedEvidence.filter(ev => ev.fileCategory === '訳文書' || ev.fileCategory === 'translated');

    // Mailto link for client submission
    const clientEmail = customer?.email || '';
    const mailSubject = encodeURIComponent(`【訳文書納品】${kase.title} のお知らせ`);
    const mailBody = encodeURIComponent(`${customer?.name || ''} 様\n\nお世話になっております。M-A Work JP です。\nご依頼いただいておりました翻訳案件「${kase.title}」の翻訳作業が完了いたしましたので、訳文書を納品いたします。\n\n添付のファイルをご確認いただけますと幸いです。\nよろしくお願いいたします。`);
    const mailtoUrl = `mailto:${clientEmail}?subject=${mailSubject}&body=${mailBody}`;

    const getTranslationStatusBadge = (stat: Case['status']) => {
      switch (stat) {
        case 'pending':
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
              <Clock className="h-3 w-3" />
              <span>受付中</span>
            </span>
          );
        case 'in_progress':
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <AlertCircle className="h-3 w-3 animate-pulse" />
              <span>翻訳中</span>
            </span>
          );
        case 'completed':
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <CheckCircle2 className="h-3 w-3" />
              <span>完了</span>
            </span>
          );
        case 'delivered':
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100">
              <CheckCircle className="h-3 w-3" />
              <span>納品済み</span>
            </span>
          );
        case 'suspended':
        default:
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
              <Ban className="h-3 w-3" />
              <span>保留</span>
            </span>
          );
      }
    };

    const handleProgressChange = async (newVal: number) => {
      if (!kase) return;
      const updated = {
        ...kase,
        progress: newVal,
        translationProgress: newVal,
        status: newVal === 100 ? 'completed' as const : kase.status,
        updatedAt: Date.now(),
        syncStatus: 'pending' as const,
      };
      await db.cases.put(updated);
    };

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
        {/* Back and Edit Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            onClick={() => navigate('/cases')}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-900 transition self-start"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>案件一覧に戻る</span>
          </button>

          <button
            onClick={openEditModal}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-950 transition active:scale-95 shadow-sm self-start"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>案件情報の編集</span>
          </button>
        </div>

        {/* TOP: Header Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-1.5">
              {getTranslationStatusBadge(kase.status)}
              {getPaymentBadge(kase.paymentStatus)}
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
              <BookOpen className="h-3 w-3 text-indigo-900" />
              <span>翻訳案件</span>
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight leading-tight">
                {kase.title}
              </h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-[11px] text-slate-500 font-medium">
                <div>
                  <span className="text-slate-400">クライクライアント: </span>
                  <Link to={`/customers/${customer?.customerId}`} className="font-bold text-indigo-900 hover:underline">
                    {customer?.name || '不明'}
                  </Link>
                </div>
                <div>
                  <span className="text-slate-400">依頼日: </span>
                  <span className="font-semibold">{new Date(kase.createdAt).toLocaleDateString()}</span>
                </div>
                {kase.deadline && (
                  <div>
                    <span className="text-slate-400">納期: </span>
                    <span className="font-bold text-rose-650 text-rose-600">{kase.deadline}</span>
                  </div>
                )}
                {kase.translationLanguageFrom && (
                  <div>
                    <span className="text-slate-400">言語ペア: </span>
                    <span className="font-bold text-indigo-900 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {kase.translationLanguageFrom} ➔ {kase.translationLanguageTo}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {translatedFiles.length > 0 && (
                <button
                  onClick={() => handleDownloadEvidence(translatedFiles[translatedFiles.length - 1])}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition"
                  title="最新の訳文書をダウンロード"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>訳文書をダウンロード</span>
                </button>
              )}
              {clientEmail && (
                <a
                  href={mailtoUrl}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 text-indigo-800 text-xs font-bold rounded-xl transition"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>クライアントに送信</span>
                </a>
              )}
              <button
                onClick={() => {
                  setConsultationDate(new Date().toISOString().split('T')[0]);
                  setConsultant('');
                  setConsultationMethod('line');
                  setConsultationSummary('');
                  setConsultationNotes('');
                  setIsAddConsultationOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-205 hover:bg-slate-50 text-xs font-bold rounded-xl transition text-slate-600"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>相談記録を追加</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 Columns Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Original Documents */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2">
              <h3 className="text-xs font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-indigo-900" />
                <span>原文書リスト ({originalFiles.length})</span>
              </h3>
              
              {/* Invisible file input */}
              <input
                id="original-file-input"
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files) prepareUpload(Array.from(e.target.files), '原文書');
                }}
                className="hidden"
              />
              <label
                htmlFor="original-file-input"
                className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-900 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-950 transition active:scale-95 shadow-sm"
              >
                <Plus className="h-3 w-3" />
                <span>原文書を追加</span>
              </label>
            </div>

            {/* List */}
            {originalFiles.length === 0 ? (
              <div className="text-center text-slate-400 text-[11px] py-12 border-2 border-dashed border-slate-100 rounded-xl">
                原文書がありません。「原文書を追加」からアップロードしてください。
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {originalFiles.map((ev) => (
                  <div key={ev.evidenceId} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-slate-50 transition space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 truncate min-w-0">
                        {getFileIcon(ev.type)}
                        <div className="truncate min-w-0">
                          <div className="font-bold text-slate-800 text-xs truncate" title={ev.name}>{ev.name}</div>
                          <div className="text-[9px] text-slate-400 font-mono">{(ev.size / 1024).toFixed(1)} KB</div>
                        </div>
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        <button onClick={() => setPreviewEvidence(ev)} className="p-1 text-slate-400 hover:text-indigo-900 hover:bg-white rounded border border-transparent hover:border-slate-100 transition"><Eye className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDownloadEvidence(ev)} className="p-1 text-slate-400 hover:text-indigo-900 hover:bg-white rounded border border-transparent hover:border-slate-100 transition"><Download className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDeleteEvidence(ev.evidenceId)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded border border-transparent hover:border-slate-100 transition"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>

                    {/* Pairing dropdown */}
                    <div className="pt-2 border-t border-slate-100/50 flex items-center justify-between gap-2">
                      <span className="text-[9px] font-bold text-slate-400 tracking-wider">訳文ペアリング:</span>
                      <select
                        value={ev.relatedFileId || ''}
                        onChange={(e) => handlePairFiles(ev.evidenceId, e.target.value)}
                        className="px-2 py-0.5 border border-slate-200 text-[10px] rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white max-w-[140px]"
                      >
                        <option value="">-- 未選択 --</option>
                        {translatedFiles.map(tf => (
                          <option key={tf.evidenceId} value={tf.evidenceId}>{tf.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* If paired, show connection info */}
                    {ev.relatedFileId && (() => {
                      const pairedFile = translatedFiles.find(tf => tf.evidenceId === ev.relatedFileId);
                      return pairedFile ? (
                        <div className="flex items-center gap-1 text-[9px] text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg">
                          <CheckCircle2 className="h-3 w-3 shrink-0" />
                          <span className="truncate">➔ 訳文: {pairedFile.name}</span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Translation Progress */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-6">
            <div className="border-b border-slate-50 pb-2">
              <h3 className="text-xs font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                <Clipboard className="h-4 w-4 text-indigo-900" />
                <span>翻訳進捗管理</span>
              </h3>
            </div>

            {/* Language pair layout */}
            {kase.translationLanguageFrom && (
              <div className="flex items-center justify-between bg-slate-50/50 p-4 border border-slate-100 rounded-2xl text-center">
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">原文</div>
                  <div className="text-sm font-black text-indigo-950">{kase.translationLanguageFrom}</div>
                </div>
                <div className="text-slate-300 font-black text-base shrink-0 mx-2">➔</div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">訳文</div>
                  <div className="text-sm font-black text-indigo-950">{kase.translationLanguageTo}</div>
                </div>
              </div>
            )}

            {/* Progress controller */}
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <span>翻訳作業進捗率</span>
                  <span className="text-indigo-900 font-black text-sm">{(kase.translationProgress !== undefined ? kase.translationProgress : kase.progress)}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-indigo-900 rounded-full transition-all duration-300"
                    style={{ width: `${(kase.translationProgress !== undefined ? kase.translationProgress : kase.progress)}%` }}
                  />
                </div>
              </div>

              {/* Interactive slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={kase.translationProgress !== undefined ? kase.translationProgress : kase.progress}
                  onChange={(e) => handleProgressChange(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-150 rounded-lg appearance-none cursor-pointer accent-indigo-900"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold px-0.5">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Incremental progress controls */}
              <div className="grid grid-cols-5 gap-1">
                {[0, 25, 50, 75, 100].map(val => (
                  <button
                    key={val}
                    onClick={() => handleProgressChange(val)}
                    className={`py-1 text-[10px] font-bold rounded-lg border transition ${
                      (kase.translationProgress !== undefined ? kase.translationProgress : kase.progress) === val
                        ? 'bg-indigo-900 text-white border-indigo-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Structured details (notes & background) */}
            <div className="space-y-3 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">作業メモ・備考</span>
              <textarea
                value={consultationContent || ''}
                onChange={async (e) => {
                  setConsultationContent(e.target.value);
                  if (kase) {
                    await db.cases.update(kase.caseId, { consultationContent: e.target.value });
                  }
                }}
                placeholder="翻訳作業中の注意点や用語辞書、指示内容等を記入してください..."
                className="w-full px-3 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl min-h-[140px] text-xs bg-slate-50/20"
              />
            </div>
          </div>

          {/* Column 3: Translated Documents */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2">
              <h3 className="text-xs font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>訳文書リスト ({translatedFiles.length})</span>
              </h3>
              
              {/* Invisible file input */}
              <input
                id="translated-file-input"
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files) prepareUpload(Array.from(e.target.files), '訳文書');
                }}
                className="hidden"
              />
              <label
                htmlFor="translated-file-input"
                className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition active:scale-95 shadow-sm"
              >
                <Plus className="h-3 w-3" />
                <span>訳文書を追加</span>
              </label>
            </div>

            {/* List */}
            {translatedFiles.length === 0 ? (
              <div className="text-center text-slate-400 text-[11px] py-12 border-2 border-dashed border-slate-100 rounded-xl">
                訳文書がありません。「訳文書を追加」からアップロードしてください。
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {translatedFiles.map((ev) => (
                  <div key={ev.evidenceId} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-slate-50 transition space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 truncate min-w-0">
                        {getFileIcon(ev.type)}
                        <div className="truncate min-w-0">
                          <div className="font-bold text-slate-800 text-xs truncate" title={ev.name}>{ev.name}</div>
                          <div className="text-[9px] text-slate-400 font-mono">{(ev.size / 1024).toFixed(1)} KB</div>
                        </div>
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        <button onClick={() => setPreviewEvidence(ev)} className="p-1 text-slate-400 hover:text-indigo-900 hover:bg-white rounded border border-transparent hover:border-slate-100 transition"><Eye className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDownloadEvidence(ev)} className="p-1 text-slate-400 hover:text-indigo-900 hover:bg-white rounded border border-transparent hover:border-slate-100 transition"><Download className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDeleteEvidence(ev.evidenceId)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded border border-transparent hover:border-slate-100 transition"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>

                    {/* Show pairing links if this translated file is related to any original file */}
                    {(() => {
                      const relatedOriginals = originalFiles.filter(of => of.relatedFileId === ev.evidenceId);
                      return relatedOriginals.length > 0 ? (
                        <div className="space-y-1">
                          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">ペアリング原文:</div>
                          {relatedOriginals.map(ro => (
                            <div key={ro.evidenceId} className="text-[9px] text-slate-500 font-medium truncate flex items-center gap-1 bg-slate-100/50 p-1 rounded">
                              <span>⬅ {ro.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : null;
                    })()}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Consultation Timeline */}
        {sortedConsultations.length > 0 && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-900" />
              <span>相談・連絡履歴タイムライン ({sortedConsultations.length})</span>
            </h3>

            <div className="space-y-6">
              {sortedConsultations.map((con) => (
                <div key={con.consultationId} className="relative pl-6 border-l-2 border-indigo-900/10 py-1">
                  <div className="absolute left-[-6px] top-2.5 h-3.5 w-3.5 rounded-full bg-indigo-900 flex items-center justify-center border-2 border-white">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-slate-400 mb-1">
                    <span className="font-mono">{con.date}</span>
                    <div className="flex items-center gap-2">
                      {getMethodBadge(con.method)}
                      {con.consultant && (
                        <span className="bg-indigo-50 text-indigo-750 text-indigo-700 px-2 py-0.5 rounded font-bold text-[9px]">
                          担当: {con.consultant}
                        </span>
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
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (kase.category === '翻訳') {
    return renderTranslationCase();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header breadcrumb & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate('/cases')}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-900 transition self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>案件一覧に戻る</span>
        </button>

        <button
          onClick={openEditModal}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-950 transition active:scale-95 shadow-sm self-start"
        >
          <Edit2 className="h-3.5 w-3.5" />
          <span>案件情報の編集</span>
        </button>
      </div>

      {/* Main Grid: Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Basic Info & Consultation Timeline */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Case Profile Information card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex gap-1.5">
                  {getStatusBadge(kase.status)}
                  {getPaymentBadge(kase.paymentStatus)}
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-705 text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                  <BookOpen className="h-3 w-3 text-indigo-900" />
                  <span>{kase.category || '未設定'}</span>
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight leading-tight">
                {kase.title}
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                ID: {kase.caseId}
              </p>
            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Linked Customer */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  関連顧客
                </span>
                {customer === undefined ? (
                  <span className="text-xs text-slate-400">読み込み中...</span>
                ) : customer === null ? (
                  <span className="text-xs font-bold text-slate-500">不明な顧客</span>
                ) : (
                  <div className="space-y-1">
                    <Link to={`/customers/${customer.customerId}`} className="font-black text-indigo-900 hover:underline text-sm block">
                      {customer.name}
                    </Link>
                    <div className="text-[10px] text-slate-500 font-semibold">{customer.phone}</div>
                  </div>
                )}
              </div>

              {/* Progress and Fee */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-100/50 flex flex-col justify-between">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>料金 (契約額):</span>
                  <span className="text-sm font-black text-indigo-950">
                    {kase.fee > 0 ? `¥${kase.fee.toLocaleString()}` : '¥0 (未設定)'}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>進捗状況</span>
                    <span className="text-indigo-900 font-bold">{kase.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-900 rounded-full transition-all duration-500"
                      style={{ width: `${kase.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Structured details */}
            <div className="space-y-4 pt-2">
              {kase.consultationContent && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">相談内容</span>
                  <p className="text-xs text-slate-700 bg-slate-50/50 border rounded-xl p-4 leading-relaxed">
                    {kase.consultationContent}
                  </p>
                </div>
              )}

              {kase.background && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">経緯・詳細背景</span>
                  <p className="text-xs text-slate-700 bg-slate-50/50 border rounded-xl p-4 leading-relaxed">
                    {kase.background}
                  </p>
                </div>
              )}

              {kase.actionTaken && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">対応内容・ステップ</span>
                  <p className="text-xs text-slate-700 bg-slate-50/50 border rounded-xl p-4 leading-relaxed">
                    {kase.actionTaken}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Associated Consultations Timeline */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-900" />
                <span>相談履歴（時系列タイムライン）</span>
              </h3>
              
              <button
                onClick={() => {
                  setConsultationDate(new Date().toISOString().split('T')[0]);
                  setConsultant('');
                  setConsultationMethod('line');
                  setConsultationSummary('');
                  setConsultationNotes('');
                  setIsAddConsultationOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-indigo-900 text-indigo-900 hover:bg-indigo-50 text-xs font-bold rounded-lg transition active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>相談記録を追加</span>
              </button>
            </div>

            <div className="space-y-6">
              {sortedConsultations.length === 0 ? (
                <div className="text-center text-slate-400 text-xs py-8 border-2 border-dashed rounded-xl border-slate-100 font-semibold">
                  相談履歴はまだありません。上のボタンから最初の相談記録を追加してください。
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
                        {con.consultant && (
                          <span className="bg-indigo-50 text-indigo-750 text-indigo-700 px-2 py-0.5 rounded font-bold text-[9px]">
                            相談者: {con.consultant}
                          </span>
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

        {/* Right Column: Evidence Storage */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-indigo-900" />
              <span>証拠ファイル一覧 ({associatedEvidence.length})</span>
            </h3>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition relative flex flex-col items-center justify-center min-h-[140px] ${
                isDragActive
                  ? 'border-indigo-900 bg-indigo-50/40'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                id="case-detail-file-input"
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
              
              <Upload className={`h-6 w-6 mb-2 transition ${isDragActive ? 'text-indigo-900 animate-bounce' : 'text-slate-400'}`} />
              
              <label
                htmlFor="case-detail-file-input"
                className="text-xs font-bold text-indigo-900 hover:text-indigo-950 cursor-pointer"
              >
                ここにドラッグ＆ドロップするか、ファイルを選択
              </label>
              <p className="text-[9px] text-slate-400 mt-1 font-medium">
                対応形式: PDF, JPEG, PNG, MP3, MP4 など
              </p>
            </div>

            {uploadSuccess && (
              <div className="flex items-center gap-1.5 p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-[10px] text-emerald-800 font-bold justify-center">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>ファイルをローカル保存しました</span>
              </div>
            )}

            <hr className="border-slate-100" />

            {/* Tab navigation */}
            <div className="flex border-b border-slate-100 mb-4">
              {(['all', 'image', 'audio', 'video', 'pdf'] as const).map((tab) => {
                let label = 'すべて';
                if (tab === 'image') label = '写真';
                if (tab === 'audio') label = '音声';
                if (tab === 'video') label = '動画';
                if (tab === 'pdf') label = '書類PDF';

                const count = associatedEvidence.filter(ev => {
                  if (tab === 'all') return true;
                  if (tab === 'image') return ev.type.startsWith('image/');
                  if (tab === 'audio') return ev.type.startsWith('audio/');
                  if (tab === 'video') return ev.type.startsWith('video/');
                  return ev.type === 'application/pdf' || (!ev.type.startsWith('image/') && !ev.type.startsWith('audio/') && !ev.type.startsWith('video/'));
                }).length;

                return (
                  <button
                    key={tab}
                    onClick={() => setEvidenceTab(tab)}
                    className={`flex-1 pb-2 text-[9px] font-bold border-b-2 text-center transition ${
                      evidenceTab === tab
                        ? 'border-indigo-900 text-indigo-900'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Filtered evidence items */}
            {(() => {
              const filteredList = associatedEvidence.filter((ev) => {
                if (evidenceTab === 'all') return true;
                if (evidenceTab === 'image') return ev.type.startsWith('image/');
                if (evidenceTab === 'audio') return ev.type.startsWith('audio/');
                if (evidenceTab === 'video') return ev.type.startsWith('video/');
                return ev.type === 'application/pdf' || (!ev.type.startsWith('image/') && !ev.type.startsWith('audio/') && !ev.type.startsWith('video/'));
              });

              if (filteredList.length === 0) {
                return (
                  <div className="text-center text-slate-400 text-xs py-8">
                    該当するファイルはありません。
                  </div>
                );
              }

              if (evidenceTab === 'image') {
                // Photo Gallery grid
                return (
                  <div className="grid grid-cols-3 gap-2 max-h-[350px] overflow-y-auto pr-1">
                    {filteredList.map((ev) => (
                      <ImageThumbnail
                        key={ev.evidenceId}
                        evidence={ev}
                        onPreview={() => setPreviewEvidence(ev)}
                        onDelete={() => handleDeleteEvidence(ev.evidenceId)}
                        onDownload={() => handleDownloadEvidence(ev)}
                      />
                    ))}
                  </div>
                );
              }

              // List view for other types
              return (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {filteredList.map((ev) => (
                    <div key={ev.evidenceId} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs gap-2 hover:bg-slate-100/50 transition">
                      <div className="truncate min-w-0 flex-1">
                        <div className="font-bold text-slate-800 truncate" title={ev.name}>{ev.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-slate-400 font-mono">
                            {(ev.size / 1024).toFixed(1)} KB
                          </span>
                          <span className={`inline-flex items-center text-[8px] font-bold ${
                            ev.syncStatus === 'synced' ? 'text-emerald-600' : 'text-amber-500'
                          }`}>
                            {ev.syncStatus === 'synced' ? '● 同期済' : '● 未同期'}
                          </span>
                          {ev.fileCategory && ev.fileCategory !== 'その他' && (
                            <span className={`inline-flex items-center text-[8px] font-bold px-1.5 py-0.5 rounded ${
                              ev.fileCategory === '原文書' || ev.fileCategory === 'original'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {ev.fileCategory === 'original' ? '原文書' : ev.fileCategory === 'translated' ? '訳文書' : ev.fileCategory}
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
                          onClick={() => handleDownloadEvidence(ev)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition"
                          title="ダウンロード"
                        >
                          <Download className="h-3.5 w-3.5" />
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
                  ))}
                </div>
              );
            })()}
            
            <div className="text-[9px] text-slate-400 leading-relaxed font-semibold bg-slate-50/50 p-2.5 border rounded-lg">
              ⚠️ ローカルのIndexedDBに安全に保管され、オンライン接続時にクラウドに自動同期されます。
            </div>
          </div>
        </div>
      </div>

      {/* Edit Case Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-slate-800 tracking-tight mb-4">
              案件情報の編集
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">案件名</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ステータス</label>
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
                        <option value="pending">未着手</option>
                        <option value="in_progress">進行中</option>
                        <option value="completed">完了</option>
                        <option value="suspended">保留</option>
                      </>
                    )}
                  </select>
                </div>
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

      {/* Add Consultation Modal */}
      {isAddConsultationOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-slate-800 tracking-tight mb-4">
              相談記録の追加
            </h3>

            <form onSubmit={handleAddConsultationSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">実施日</label>
                  <input
                    type="date"
                    required
                    value={consultationDate}
                    onChange={(e) => setConsultationDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">連絡方法</label>
                  <select
                    value={consultationMethod}
                    onChange={(e) => setConsultationMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="line">LINE</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="phone">電話</option>
                    <option value="email">メール</option>
                    <option value="in_person">対面</option>
                    <option value="online">オンライン</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">相談の概要</label>
                  <input
                    type="text"
                    required
                    value={consultationSummary}
                    onChange={(e) => setConsultationSummary(e.target.value)}
                    placeholder="例: 要件ヒアリング、書類の確認など"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">相談者</label>
                  <input
                    type="text"
                    required
                    value={consultant}
                    onChange={(e) => setConsultant(e.target.value)}
                    placeholder="例: 顧客本人 / 代理人など"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">詳細内容・ヒアリングメモ</label>
                <textarea
                  required
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  placeholder="面接メモ・相談内容・課題点など"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[140px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">証拠ファイルの添付（任意）</label>
                <input
                  type="file"
                  multiple
                  onChange={handleConsultationFileChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                <p className="text-[9px] text-slate-400 mt-1 font-medium">
                  対応形式: PDF, 画像, 音声, 動画。複数選択可能。ここで追加されたファイルは案件の証拠一覧にも自動的に登録されます。
                </p>
              </div>

              {/* Consultation merging option */}
              {consultationFiles && Array.from(consultationFiles).filter(f => f.type.startsWith('image/')).length >= 2 && (
                <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shouldMergeConsultationImages}
                      onChange={(e) => setShouldMergeConsultationImages(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-900 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-indigo-900">
                      添付された写真（{Array.from(consultationFiles).filter(f => f.type.startsWith('image/')).length}枚）を1つのPDFに結合して保存する
                    </span>
                  </label>
                  
                  {shouldMergeConsultationImages && (
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-indigo-950 uppercase tracking-wider block">結合後のPDFファイル名</label>
                      <input
                        type="text"
                        required
                        value={consultationMergedPdfName}
                        onChange={(e) => setConsultationMergedPdfName(e.target.value)}
                        placeholder="例: 面接写真結合.pdf"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddConsultationOpen(false)}
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

      {/* Upload Confirmation Modal */}
      {isUploadConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-slate-800 tracking-tight mb-4">
              アップロードファイルの確認・編集
            </h3>
            
            <form onSubmit={handleConfirmUploadSubmit} className="space-y-4">
              {/* Checkbox for merging images to PDF */}
              {pendingUploadFiles.filter(f => f.type.startsWith('image/')).length >= 2 && (
                <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shouldMergeImages}
                      onChange={(e) => setShouldMergeImages(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-900 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-indigo-900">
                      複数の写真（{pendingUploadFiles.filter(f => f.type.startsWith('image/')).length}枚）を1つのPDFに結合して保存する
                    </span>
                  </label>
                  
                  {shouldMergeImages && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-indigo-950 uppercase tracking-wider block">結合後のPDFファイル名</label>
                        <input
                          type="text"
                          required
                          value={mergedPdfName}
                          onChange={(e) => setMergedPdfName(e.target.value)}
                          placeholder="例: グアテマラ面接写真.pdf"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-indigo-950 uppercase tracking-wider block">ファイルカテゴリー</label>
                        <select
                          value={uploadCategory}
                          onChange={(e) => setUploadCategory(e.target.value as '原文書' | '訳文書' | 'その他')}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                          <option value="原文書">原文書</option>
                          <option value="訳文書">訳文書</option>
                          <option value="その他">その他</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Edit file names individually */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">アップロードするファイル</label>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {pendingUploadFiles.map((file, idx) => {
                    const isImage = file.type.startsWith('image/');
                    const showInput = !shouldMergeImages || !isImage;
                    
                    if (!showInput) return null;

                    return (
                      <div key={idx} className="p-2.5 bg-slate-50 border rounded-xl flex flex-col gap-1.5 text-xs">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                          <span className="truncate max-w-[200px]">{file.name}</span>
                          <span>{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">ファイル名</label>
                            <input
                              type="text"
                              required
                              value={uploadFileNames[idx] || ''}
                              onChange={(e) => {
                                const newNames = [...uploadFileNames];
                                newNames[idx] = e.target.value;
                                setUploadFileNames(newNames);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">カテゴリー</label>
                            <select
                              value={uploadFileCategories[idx] || 'その他'}
                              onChange={(e) => {
                                const newCategories = [...uploadFileCategories];
                                newCategories[idx] = e.target.value as '原文書' | '訳文書' | 'その他';
                                setUploadFileCategories(newCategories);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                              <option value="原文書">原文書</option>
                              <option value="訳文書">訳文書</option>
                              <option value="その他">その他</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {shouldMergeImages && pendingUploadFiles.filter(f => !f.type.startsWith('image/')).length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-4 font-medium">
                      写真はすべて1つのPDFに結合され、個別のファイルとしてはアップロードされません。
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadConfirmOpen(false);
                    setPendingUploadFiles([]);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition active:scale-95"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-950 transition active:scale-95"
                >
                  保存して追加
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

// Thumbnail subcomponent for managing image ObjectURLs memory leaks
const ImageThumbnail: React.FC<{
  evidence: Evidence;
  onPreview: () => void;
  onDelete: () => void;
  onDownload: () => void;
}> = ({ evidence, onPreview, onDelete, onDownload }) => {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    const objectUrl = URL.createObjectURL(evidence.fileData);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [evidence]);

  return (
    <div className="relative group aspect-square rounded-xl overflow-hidden border border-slate-100 bg-slate-100 shadow-sm flex items-center justify-center">
      {url ? (
        <img src={url} alt={evidence.name} className="w-full h-full object-cover" />
      ) : (
        <div className="animate-pulse w-full h-full bg-slate-200" />
      )}
      
      {/* Hover overlay with actions */}
      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col justify-between p-2">
        <div className="text-[8px] text-white font-bold truncate" title={evidence.name}>
          {evidence.name}
        </div>
        
        <div className="flex justify-center gap-1 mt-auto">
          <button
            onClick={onPreview}
            className="p-1 bg-white/20 hover:bg-white/40 text-white rounded-lg transition"
            title="プレビュー"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDownload}
            className="p-1 bg-white/20 hover:bg-white/40 text-white rounded-lg transition"
            title="ダウンロード"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg transition"
            title="削除"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// PDF generation and helpers
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const getImageDimensions = (base64: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
  });
};

const mergeImagesToPdf = async (files: File[], pdfName: string): Promise<Blob> => {
  const doc = new jsPDF();
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const base64 = await fileToBase64(file);
      const dims = await getImageDimensions(base64);
      
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();
      
      let width = dims.width;
      let height = dims.height;
      const ratio = Math.min(pdfWidth / width, pdfHeight / height);
      width = width * ratio;
      height = height * ratio;
      
      const x = (pdfWidth - width) / 2;
      const y = (pdfHeight - height) / 2;
      
      if (i > 0) {
        doc.addPage();
      }
      
      let format = 'JPEG';
      const typeLower = file.type.toLowerCase();
      if (typeLower === 'image/png') format = 'PNG';
      else if (typeLower === 'image/webp') format = 'WEBP';
      
      doc.addImage(base64, format, x, y, width, height);
    } catch (err) {
      console.error("Failed adding image to PDF page", err);
    }
  }
  return doc.output('blob');
};
