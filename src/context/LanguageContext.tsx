import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ja' | 'es';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  ja: {
    // General / UI
    appName: 'M-A Work JP 業務管理システム',
    dashboard: 'ダッシュボード',
    customers: '顧客管理',
    cases: '案件管理',
    consultations: '相談記録',
    evidence: '証拠保管',
    sync: 'データ同期',
    online: 'オンライン',
    offline: 'オフライン',
    syncStatus: '同期ステータス',
    lastSynced: '最終同期日時',
    syncing: '同期中...',
    synced: '同期完了',
    search: '検索...',
    add: '追加',
    edit: '編集',
    delete: '削除',
    save: '保存',
    cancel: 'キャンセル',
    close: '閉じる',
    status: 'ステータス',
    actions: '操作',
    loading: '読み込み中...',
    noData: 'データはありません',
    
    // Auth
    login: 'ログイン',
    logout: 'ログアウト',
    email: 'メールアドレス',
    password: 'パスワード',
    loginError: 'ログインに失敗しました。メールアドレスとパスワードを確認してください。',
    loginOffline: 'オフラインモードで起動しています（ローカルDBのみ利用可）',
    offlineBypass: 'オフラインで利用を開始',
    realFirebaseActive: '本番サーバーに接続中',
    mockFirebaseActive: 'デモ（ローカル）モードで動作中',
    
    // Customers
    customerName: '顧客名',
    customerEmail: 'メール',
    customerPhone: '電話番号',
    customerCategory: 'カテゴリー・資格',
    customerNotes: '備考・メモ',
    addCustomer: '新規顧客登録',
    editCustomer: '顧客情報の編集',
    translator: '翻訳者',
    interpreter: '通訳者',
    lawyer: '弁護士',
    adminScrivener: '行政書士',
    laborConsultant: '社労士',
    other: 'その他',
    active: '有効',
    inactive: '無効',
    inquiry: '問い合わせ',
    waiting_payment: '入金待ち',
    waiting_documents: '追加資料待ち',
    translating: '翻訳中',
    
    // Cases
    caseTitle: '案件名',
    caseCustomer: '関連顧客',
    caseDeadline: '期限',
    caseProgress: '進捗率',
    addCase: '新規案件登録',
    editCase: '案件情報の編集',
    pending: '未着手',
    in_progress: '進行中',
    completed: '完了',
    suspended: '保留',
    delivered: '納品済み',
    translationCase: '翻訳案件',
    languagePair: '言語ペア',
    deadline: '納期',
    originalDocument: '原文書',
    translatedDocument: '訳文書',
    uploadOriginal: '原文書をアップロード',
    uploadTranslated: '訳文書をアップロード',
    fileCategory: 'ファイル種別',
    receivedDate: '依頼日',
    clientName: 'クライアント名',
    languageFrom: '原文言語',
    languageTo: '訳文言語',
    statusDelivered: '納品済み',
    statusTranslating: '翻訳中',
    statusReceived: '受付中',
    pairing: '訳文ペアリング',
    
    // Consultations
    consultationDate: '相談実施日',
    consultationSummary: '相談の概要',
    consultationNotes: '詳細内容・ヒアリングメモ',
    addConsultation: '相談記録の追加',
    editConsultation: '相談記録の編集',
    timeline: '相談履歴（時系列）',
    
    // Evidence
    evidenceUpload: '証拠ファイルのアップロード',
    dropFiles: 'ここにファイルをドラッグ＆ドロップするか、クリックして選択',
    evidenceName: 'ファイル名',
    evidenceType: '種類',
    evidenceSize: 'サイズ',
    evidenceView: 'プレビュー',
    fileLimitWarning: 'ローカルIndexedDBに保存され、オンライン復帰時にクラウドに自動同期されます。',
  },
  es: {
    // General / UI
    appName: 'M-A Work JP Gestión de Casos',
    dashboard: 'Tablero',
    customers: 'Clientes',
    cases: 'Casos',
    consultations: 'Consultas',
    evidence: 'Evidencias',
    sync: 'Sincronizar',
    online: 'En Línea',
    offline: 'Sin Conexión',
    syncStatus: 'Estado de Sincronización',
    lastSynced: 'Última Sincronización',
    syncing: 'Sincronizando...',
    synced: 'Sincronizado',
    search: 'Buscar...',
    add: 'Agregar',
    edit: 'Editar',
    delete: 'Eliminar',
    save: 'Guardar',
    cancel: 'Cancelar',
    close: 'Cerrar',
    status: 'Estado',
    actions: 'Acciones',
    loading: 'Cargando...',
    noData: 'No hay datos disponibles',
    
    // Auth
    login: 'Iniciar Sesión',
    logout: 'Cerrar Sesión',
    email: 'Correo Electrónico',
    password: 'Contraseña',
    loginError: 'Error al iniciar sesión. Por favor verifique sus credenciales.',
    loginOffline: 'Ejecutando en modo sin conexión (solo DB local)',
    offlineBypass: 'Iniciar sin conexión',
    realFirebaseActive: 'Conectado al servidor de producción',
    mockFirebaseActive: 'Ejecutando en modo demostración (local)',
    
    // Customers
    customerName: 'Nombre del Cliente',
    customerEmail: 'Correo',
    customerPhone: 'Teléfono',
    customerCategory: 'Categoría / Título',
    customerNotes: 'Notas / Detalles',
    addCustomer: 'Registrar Nuevo Cliente',
    editCustomer: 'Editar Cliente',
    translator: 'Traductor(a)',
    interpreter: 'Intérprete',
    lawyer: 'Abogado/a',
    adminScrivener: 'Gestor(a) Administrativo(a)',
    laborConsultant: 'Asesor(a) Laboral',
    other: 'Otro',
    active: 'Activo',
    inactive: 'Inactivo',
    inquiry: 'Consulta',
    waiting_payment: 'Esperando Pago',
    waiting_documents: 'Esperando Documentos',
    translating: 'Traduciendo',
    
    // Cases
    caseTitle: 'Título del Caso',
    caseCustomer: 'Cliente Relacionado',
    caseDeadline: 'Fecha Límite',
    caseProgress: 'Progreso',
    addCase: 'Crear Nuevo Caso',
    editCase: 'Editar Caso',
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    completed: 'Completado',
    suspended: 'Suspendido',
    delivered: 'Entregado',
    translationCase: 'Caso de Traducción',
    languagePair: 'Par de Idiomas',
    deadline: 'Plazo de Entrega',
    originalDocument: 'Documento Original',
    translatedDocument: 'Documento Traducido',
    uploadOriginal: 'Subir Original',
    uploadTranslated: 'Subir Traducido',
    fileCategory: 'Categoría de Archivo',
    receivedDate: 'Fecha de Encargo',
    clientName: 'Cliente',
    languageFrom: 'Idioma de Origen',
    languageTo: 'Idioma de Destino',
    statusDelivered: 'Entregado',
    statusTranslating: 'Traduciendo',
    statusReceived: 'Recibido',
    pairing: 'Emparejamiento',
    
    // Consultations
    consultationDate: 'Fecha de Consulta',
    consultationSummary: 'Resumen de Consulta',
    consultationNotes: 'Detalles / Notas de Entrevista',
    addConsultation: 'Agregar Registro de Consulta',
    editConsultation: 'Editar Consulta',
    timeline: 'Historial de Consultas (Cronología)',
    
    // Evidence
    evidenceUpload: 'Subir Archivo de Evidencia',
    dropFiles: 'Arrastre y suelte archivos aquí o haga clic para seleccionar',
    evidenceName: 'Nombre del Archivo',
    evidenceType: 'Tipo',
    evidenceSize: 'Tamaño',
    evidenceView: 'Vista previa',
    fileLimitWarning: 'Los archivos se guardarán localmente en IndexedDB y se sincronizarán con la nube al restablecer la conexión.',
  }
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('appLanguage');
    return (saved === 'ja' || saved === 'es') ? saved : 'ja';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('appLanguage', lang);
  };

  const t = (key: string): string => {
    const dict = translations[language];
    return (dict as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
