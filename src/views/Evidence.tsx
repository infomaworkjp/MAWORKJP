import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateUUID, Evidence } from '../db';
import { useLanguage } from '../context/LanguageContext';
import { Upload, Paperclip, Trash2, Eye, FileText, ImageIcon, Music, Video, HelpCircle, Layers, CheckCircle } from 'lucide-react';

export const EvidencePage: React.FC = () => {
  const { t } = useLanguage();

  // Queries
  const evidenceList = useLiveQuery(() => db.evidenceFiles.toArray()) || [];
  const cases = useLiveQuery(() => db.cases.toArray()) || [];

  // Filter states
  const [selectedCaseId, setSelectedCaseId] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');

  // Upload state
  const [uploadCaseId, setUploadCaseId] = useState<string>('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Preview Modal state
  const [previewEvidence, setPreviewEvidence] = useState<Evidence | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (!uploadCaseId) {
      alert('アップロード先の案件を選択してください。');
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFilesUpload(e.dataTransfer.files);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!uploadCaseId) {
      alert('アップロード先の案件を選択してください。');
      return;
    }

    if (e.target.files && e.target.files[0]) {
      await handleFilesUpload(e.target.files);
    }
  };

  const handleFilesUpload = async (fileList: FileList) => {
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const newEvidence: Evidence = {
        evidenceId: generateUUID(),
        caseId: uploadCaseId,
        name: file.name,
        type: file.type,
        size: file.size,
        fileData: file, // Store File Blob directly in Dexie
        createdAt: Date.now(),
        syncStatus: 'pending',
      };
      await db.evidenceFiles.put(newEvidence);
    }
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const handleDelete = async (evidenceId: string) => {
    if (window.confirm('この証拠ファイルを削除してもよろしいですか？')) {
      await db.evidenceFiles.delete(evidenceId);
      if (previewEvidence?.evidenceId === evidenceId) setPreviewEvidence(null);
    }
  };

  // Filter evidence list
  const filteredEvidence = evidenceList.filter((ev) => {
    const matchesCase = selectedCaseId === 'All' || ev.caseId === selectedCaseId;
    const matchesType = (() => {
      if (selectedType === 'All') return true;
      if (selectedType === 'image') return ev.type.startsWith('image/');
      if (selectedType === 'pdf') return ev.type === 'application/pdf';
      if (selectedType === 'audio') return ev.type.startsWith('audio/');
      if (selectedType === 'video') return ev.type.startsWith('video/');
      return false;
    })();
    return matchesCase && matchesType;
  });

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-emerald-500" />;
    if (type === 'application/pdf') return <FileText className="h-5 w-5 text-rose-500" />;
    if (type.startsWith('audio/')) return <Music className="h-5 w-5 text-amber-500" />;
    if (type.startsWith('video/')) return <Video className="h-5 w-5 text-indigo-500" />;
    return <Paperclip className="h-5 w-5 text-slate-400" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">{t('evidence')}</h1>
        <p className="text-xs text-slate-400 mt-1">
          PDF資料、身分証画像、尋問・相談録音・録画などのデジタル証拠・参考ファイルの安全保管
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Upload Zone */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
              <Upload className="h-4 w-4 text-indigo-900" />
              <span>{t('evidenceUpload')}</span>
            </h2>

            {/* Select Associated Case */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                アップロード先案件
              </label>
              <select
                required
                value={uploadCaseId}
                onChange={(e) => setUploadCaseId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">-- 案件を選択 --</option>
                {cases.map((c) => (
                  <option key={c.caseId} value={c.caseId}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition relative flex flex-col items-center justify-center min-h-[180px] ${
                isDragActive
                  ? 'border-indigo-950 bg-indigo-50/40'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                id="file-upload-input"
                type="file"
                multiple
                disabled={!uploadCaseId}
                onChange={handleFileInput}
                className="hidden"
              />
              
              <Upload className={`h-8 w-8 mb-3 transition ${isDragActive ? 'text-indigo-900 animate-bounce' : 'text-slate-400'}`} />
              
              <label
                htmlFor="file-upload-input"
                className={`text-xs font-bold text-indigo-900 hover:text-indigo-950 cursor-pointer ${
                  !uploadCaseId ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
                }`}
              >
                {t('dropFiles')}
              </label>
              <p className="text-[9px] text-slate-400 mt-2 font-medium">
                対応形式: PDF, JPEG, PNG, MP3, MP4 など
              </p>
            </div>

            {uploadSuccess && (
              <div className="flex items-center gap-1.5 p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-800 font-bold justify-center">
                <CheckCircle className="h-4 w-4" />
                <span>ファイルをローカル保存しました</span>
              </div>
            )}

            <div className="text-[10px] text-slate-400 leading-relaxed font-semibold">
              ⚠️ {t('fileLimitWarning')}
            </div>
          </div>
        </div>

        {/* Right Side: Filters & File Grid */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters Bar */}
          <div className="grid grid-cols-2 gap-4 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Layers className="h-3 w-3" />
                <span>案件でフィルタ</span>
              </label>
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="All">すべての案件</option>
                {cases.map((c) => (
                  <option key={c.caseId} value={c.caseId}>{c.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                <span>ファイル種別</span>
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="All">すべての形式</option>
                <option value="pdf">PDF文書</option>
                <option value="image">画像ファイル</option>
                <option value="audio">音声ファイル</option>
                <option value="video">動画ファイル</option>
              </select>
            </div>
          </div>

          {/* Files List */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4">{t('evidenceName')}</th>
                    <th className="p-4">関連案件</th>
                    <th className="p-4">{t('syncStatus')}</th>
                    <th className="p-4 text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {filteredEvidence.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 font-semibold">
                        {t('noData')}
                      </td>
                    </tr>
                  ) : (
                    filteredEvidence.map((ev) => {
                      const kase = cases.find(c => c.caseId === ev.caseId);
                      return (
                        <tr key={ev.evidenceId} className="hover:bg-slate-50/40 transition">
                          <td className="p-4 flex items-center gap-3">
                            {getFileIcon(ev.type)}
                            <div className="truncate max-w-[200px]">
                              <div className="font-bold text-slate-800 truncate" title={ev.name}>
                                {ev.name}
                              </div>
                              <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                                {(ev.size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                          </td>
                          <td className="p-4 truncate max-w-[150px] font-bold text-slate-600">
                            {kase?.title || 'Unknown Case'}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              ev.syncStatus === 'synced'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {ev.syncStatus === 'synced' ? t('synced') : '未同期'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setPreviewEvidence(ev)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                                title={t('evidenceView')}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(ev.evidenceId)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                                title={t('delete')}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

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
                {t('close')}
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
