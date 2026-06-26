import Dexie, { type Table } from 'dexie';

export interface Customer {
  customerId: string; // UUID 主キー
  name: string; // 氏名
  nationality: string; // 国籍
  birthdate: string; // 生年月日
  phone: string; // 電話
  email: string; // メール
  address: string; // 住所
  referrer: string; // 紹介者
  notes: string; // メメモ
  status: 'active' | 'inactive' | 'inquiry' | 'waiting_payment' | 'in_progress' | 'waiting_documents' | 'translating' | 'completed';
  mainCategory?: string; // 主な目的・カテゴリー
  createdAt: number;
  updatedAt: number;
  syncStatus: 'pending' | 'synced';
}

export interface Case {
  caseId: string; // UUID 主キー
  customerId: string;
  title: string; // 案件名
  category: string; // カテゴリー
  consultationContent: string; // 相談内容
  background: string; // 経緯
  actionTaken: string; // 対応内容
  fee: number; // 料金
  paymentStatus: 'unpaid' | 'paid' | 'partially_paid'; // 支払状況
  status: 'pending' | 'in_progress' | 'completed' | 'suspended' | 'delivered'; // 進捗状況 (delivered追加)
  progress: number; // 進捗率 (0-100)
  translationLanguageFrom?: string; // 原文言語 (翻訳用)
  translationLanguageTo?: string; // 訳文言語 (翻訳用)
  deadline?: string; // 納期 (翻訳用)
  translationProgress?: number; // 翻訳進捗率 (翻訳用)
  createdAt: number;
  updatedAt: number;
  syncStatus: 'pending' | 'synced';
}

export interface Consultation {
  consultationId: string; // UUID 主キー
  caseId: string;
  customerId: string;
  date: string; // 日時 (YYYY-MM-DD)
  consultant: string; // 相談者
  summary: string; // 相談の概要・相談内容
  notes: string; // 詳細内容・対応内容
  method: 'phone' | 'line' | 'whatsapp' | 'email' | 'in_person' | 'online'; // 連絡方法
  createdAt: number;
  syncStatus: 'pending' | 'synced';
}

export interface Evidence {
  evidenceId: string; // UUID 主キー
  caseId: string;
  name: string; // ファイル名
  type: string; // ファイルタイプ
  size: number; // ファイルサイズ
  fileData?: Blob; // ファイルデータ (BLOB)
  cloudStorageUrl?: string;
  fileCategory?: '原文書' | '訳文書' | 'その他'; // ファイルカテゴリー (原文書/訳文書/その他)
  relatedFileId?: string; // 関連するファイルID (原文書に対して訳文書をペアリング)
  createdAt: number;
  syncStatus: 'pending' | 'synced';
}

class CaseManagementDB extends Dexie {
  customers!: Table<Customer, string>;
  cases!: Table<Case, string>;
  consultations!: Table<Consultation, string>;
  evidenceFiles!: Table<Evidence, string>;

  constructor() {
    super('CaseManagementDB');
    this.version(2).stores({
      customers: 'customerId, name, nationality, referrer, createdAt, updatedAt, syncStatus',
      cases: 'caseId, customerId, title, category, status, paymentStatus, createdAt, updatedAt, syncStatus',
      consultations: 'consultationId, caseId, customerId, date, method, createdAt, syncStatus',
      evidenceFiles: 'evidenceId, caseId, name, type, createdAt, syncStatus',
    });
  }
}

export const db = new CaseManagementDB();

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
