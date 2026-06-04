export interface VideoLinks {
  ja: string;
  en: string;
  vi: string;
  es: string;
  pt: string;
  id: string;
}

export interface ScriptSegment {
  start: number; // seconds
  end: number;   // seconds
  text: string;
}

export interface SafetyVideo {
  id: string; // ログ保存・比較用のID
  title: string;
  desc: string;
  duration: string;
  level: "必須" | "推奨" | "任意";
  videos?: VideoLinks; // 多言語のYouTube埋め込みURL
  scripts?: Record<string, ScriptSegment[]>; // 多言語のビデオスクリプト（タイムコード付き）
}

export interface DocTemplate {
  name: string;
  desc: string;
  type: string;
  format: "Word" | "Excel" | "PDF";
}

export interface IndustryContent {
  safetyLibrary: SafetyVideo[];
  templates: DocTemplate[];
}

export const industryConfig: Record<string, IndustryContent> = {
  "建設・土木": {
    safetyLibrary: [
      {
        id: "heatstroke",
        title: "熱中症予防対策ガイド",
        desc: "屋外建設現場における水分補給、休憩の基準、初期対応フロー。",
        duration: "15分",
        level: "必須",
        videos: {
          ja: "https://www.youtube.com/embed/a14RfUQS1DI", // 厚労省「熱中症を正しく知ろう 作業者編」
          en: "https://www.youtube.com/embed/o3ULhPd0KQg", // OSHA "Remembering Tim: Heat illness at work"
          vi: "https://www.youtube.com/embed/wSK3ETzSD7g", // 厚労省「熱中症を正しく知ろう 作業者編（ベトナム語字幕）」
          es: "https://www.youtube.com/embed/ipWmbc0d_Lc", // OSHA "Mensaje de 60 segundos sobre la prevención del calor" (Spanish)
          pt: "https://www.youtube.com/embed/a14RfUQS1DI", // 厚労省動画（YouTube翻訳機能を利用可能）
          id: "https://www.youtube.com/embed/a14RfUQS1DI"  // 厚労省動画（YouTube翻訳機能を利用可能）
        },
        scripts: {
          ja: [
            { start: 0, end: 6, text: "皆さん、こんにちは。これより職場における熱中症の予防対策について説明します。" },
            { start: 6, end: 12, text: "第1章は、熱中症を正しく知ろう、です。" },
            { start: 12, end: 20, text: "熱中症になる人は、梅雨から夏に非常に多くなっています。" },
            { start: 20, end: 30, text: "【熱中症予防ガイド - スロット ( 00:20-00:30 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 30, end: 40, text: "【熱中症予防ガイド - スロット ( 00:30-00:40 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 40, end: 50, text: "【熱中症予防ガイド - スロット ( 00:40-00:50 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 50, end: 60, text: "【熱中症予防ガイド - スロット ( 00:50-01:00 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 60, end: 70, text: "【熱中症予防ガイド - スロット ( 01:00-01:10 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 70, end: 80, text: "【熱中症予防ガイド - スロット ( 01:10-01:20 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 80, end: 90, text: "【熱中症予防ガイド - スロット ( 01:20-01:30 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 90, end: 100, text: "【熱中症予防ガイド - スロット ( 01:30-01:40 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 100, end: 110, text: "【熱中症予防ガイド - スロット ( 01:40-01:50 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 110, end: 120, text: "【熱中症予防ガイド - スロット ( 01:50-02:00 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 120, end: 130, text: "【熱中症予防ガイド - スロット ( 02:00-02:10 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 130, end: 140, text: "【熱中症予防ガイド - スロット ( 02:10-02:20 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 140, end: 150, text: "【熱中症予防ガイド - スロット ( 02:20-02:30 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 150, end: 160, text: "【熱中症予防ガイド - スロット ( 02:30-02:40 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 160, end: 170, text: "【熱中症予防ガイド - スロット ( 02:40-02:50 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 170, end: 180, text: "【熱中症予防ガイド - スロット ( 02:50-03:00 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 180, end: 190, text: "【熱中症予防ガイド - スロット ( 03:00-03:10 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 190, end: 200, text: "【熱中症予防ガイド - スロット ( 03:10-03:20 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 200, end: 210, text: "【熱中症予防ガイド - スロット ( 03:20-03:30 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 210, end: 220, text: "【熱中症予防ガイド - スロット ( 03:30-03:40 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 220, end: 230, text: "【熱中症予防ガイド - スロット ( 03:40-03:50 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 230, end: 240, text: "【熱中症予防ガイド - スロット ( 03:50-04:00 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 240, end: 250, text: "【熱中症予防ガイド - スロット ( 04:00-04:10 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 250, end: 260, text: "【熱中症予防ガイド - スロット ( 04:10-04:20 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 260, end: 270, text: "【熱中症予防ガイド - スロット ( 04:20-04:30 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 270, end: 280, text: "【熱中症予防ガイド - スロット ( 04:30-04:40 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 280, end: 290, text: "【熱中症予防ガイド - スロット ( 04:40-04:50 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 290, end: 300, text: "【熱中症予防ガイド - スロット ( 04:50-05:00 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 300, end: 310, text: "【熱中症予防ガイド - スロット ( 05:00-05:10 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 310, end: 320, text: "【熱中症予防ガイド - スロット ( 05:10-05:20 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 320, end: 330, text: "【熱中症予防ガイド - スロット ( 05:20-05:30 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 330, end: 340, text: "【熱中症予防ガイド - スロット ( 05:30-05:40 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 340, end: 350, text: "【熱中症予防ガイド - スロット ( 05:40-05:50 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 350, end: 360, text: "【熱中症予防ガイド - スロット ( 05:50-06:00 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 360, end: 370, text: "【熱中症予防ガイド - スロット ( 06:00-06:10 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 370, end: 380, text: "【熱中症予防ガイド - スロット ( 06:10-06:20 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 380, end: 390, text: "【熱中症予防ガイド - スロット ( 06:20-06:30 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 390, end: 400, text: "【熱中症予防ガイド - スロット ( 06:30-06:40 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 400, end: 410, text: "【熱中症予防ガイド - スロット ( 06:40-06:50 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 410, end: 420, text: "【熱中症予防ガイド - スロット ( 06:50-07:00 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 420, end: 430, text: "【熱中症予防ガイド - スロット ( 07:00-07:10 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 430, end: 440, text: "【熱中症予防ガイド - スロット ( 07:10-07:20 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 440, end: 450, text: "【熱中症予防ガイド - スロット ( 07:20-07:30 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 450, end: 460, text: "【熱中症予防ガイド - スロット ( 07:30-07:40 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 460, end: 470, text: "【熱中症予防ガイド - スロット ( 07:40-07:50 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 470, end: 480, text: "【熱中症予防ガイド - スロット ( 07:50-08:00 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 480, end: 490, text: "【熱中症予防ガイド - スロット ( 08:00-08:10 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 490, end: 500, text: "【熱中症予防ガイド - スロット ( 08:10-08:20 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 500, end: 510, text: "【熱中症予防ガイド - スロット ( 08:20-08:30 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 510, end: 520, text: "【熱中症予防ガイド - スロット ( 08:30-08:40 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 520, end: 530, text: "【熱中症予防ガイド - スロット ( 08:40-08:50 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 530, end: 540, text: "【熱中症予防ガイド - スロット ( 08:50-09:00 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 540, end: 550, text: "【熱中症予防ガイド - スロット ( 09:00-09:10 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 550, end: 560, text: "【熱中症予防ガイド - スロット ( 09:10-09:20 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 560, end: 570, text: "【熱中症予防ガイド - スロット ( 09:20-09:30 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 570, end: 580, text: "【熱中症予防ガイド - スロット ( 09:30-09:40 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 580, end: 590, text: "【熱中症予防ガイド - スロット ( 09:40-09:50 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 590, end: 600, text: "【熱中症予防ガイド - スロット ( 09:50-10:00 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 600, end: 610, text: "【熱中症予防ガイド - スロット ( 10:00-10:10 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 610, end: 620, text: "【熱中症予防ガイド - スロット ( 10:10-10:20 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 620, end: 630, text: "【熱中症予防ガイド - スロット ( 10:20-10:30 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 630, end: 640, text: "【熱中症予防ガイド - スロット ( 10:30-10:40 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 640, end: 650, text: "【熱中症予防ガイド - スロット ( 10:40-10:50 )】ここには実際の文字起こしテキストが入ります。" },
            { start: 650, end: 660, text: "【熱中症予防ガイド - スロット ( 10:50-11:00 )】ここには実際の文字起こしテキストが入ります。" }
          ],
          en: [
            { start: 0, end: 6, text: "Hello everyone. We will now explain heatstroke prevention measures in the workplace." },
            { start: 6, end: 12, text: "Chapter 1: Let's understand heatstroke correctly." },
            { start: 12, end: 20, text: "The number of people who get heatstroke increases significantly from the rainy season to summer." },
            { start: 20, end: 30, text: "[Heatstroke Prevention Guide - Slot ( 00:20-00:30 )] Please paste the English transcription here." },
            { start: 30, end: 40, text: "[Heatstroke Prevention Guide - Slot ( 00:30-00:40 )] Please paste the English transcription here." },
            { start: 40, end: 50, text: "[Heatstroke Prevention Guide - Slot ( 00:40-00:50 )] Please paste the English transcription here." },
            { start: 50, end: 60, text: "[Heatstroke Prevention Guide - Slot ( 00:50-01:00 )] Please paste the English transcription here." },
            { start: 60, end: 70, text: "[Heatstroke Prevention Guide - Slot ( 01:00-01:10 )] Please paste the English transcription here." },
            { start: 70, end: 80, text: "[Heatstroke Prevention Guide - Slot ( 01:10-01:20 )] Please paste the English transcription here." },
            { start: 80, end: 90, text: "[Heatstroke Prevention Guide - Slot ( 01:20-01:30 )] Please paste the English transcription here." },
            { start: 90, end: 100, text: "[Heatstroke Prevention Guide - Slot ( 01:30-01:40 )] Please paste the English transcription here." },
            { start: 100, end: 110, text: "[Heatstroke Prevention Guide - Slot ( 01:40-01:50 )] Please paste the English transcription here." },
            { start: 110, end: 120, text: "[Heatstroke Prevention Guide - Slot ( 01:50-02:00 )] Please paste the English transcription here." },
            { start: 120, end: 130, text: "[Heatstroke Prevention Guide - Slot ( 02:00-02:10 )] Please paste the English transcription here." },
            { start: 130, end: 140, text: "[Heatstroke Prevention Guide - Slot ( 02:10-02:20 )] Please paste the English transcription here." },
            { start: 140, end: 150, text: "[Heatstroke Prevention Guide - Slot ( 02:20-02:30 )] Please paste the English transcription here." },
            { start: 150, end: 160, text: "[Heatstroke Prevention Guide - Slot ( 02:30-02:40 )] Please paste the English transcription here." },
            { start: 160, end: 170, text: "[Heatstroke Prevention Guide - Slot ( 02:40-02:50 )] Please paste the English transcription here." },
            { start: 170, end: 180, text: "[Heatstroke Prevention Guide - Slot ( 02:50-03:00 )] Please paste the English transcription here." },
            { start: 180, end: 190, text: "[Heatstroke Prevention Guide - Slot ( 03:00-03:10 )] Please paste the English transcription here." },
            { start: 190, end: 200, text: "[Heatstroke Prevention Guide - Slot ( 03:10-03:20 )] Please paste the English transcription here." },
            { start: 200, end: 210, text: "[Heatstroke Prevention Guide - Slot ( 03:20-03:30 )] Please paste the English transcription here." },
            { start: 210, end: 220, text: "[Heatstroke Prevention Guide - Slot ( 03:30-03:40 )] Please paste the English transcription here." },
            { start: 220, end: 230, text: "[Heatstroke Prevention Guide - Slot ( 03:40-03:50 )] Please paste the English transcription here." },
            { start: 230, end: 240, text: "[Heatstroke Prevention Guide - Slot ( 03:50-04:00 )] Please paste the English transcription here." },
            { start: 240, end: 250, text: "[Heatstroke Prevention Guide - Slot ( 04:00-04:10 )] Please paste the English transcription here." },
            { start: 250, end: 260, text: "[Heatstroke Prevention Guide - Slot ( 04:10-04:20 )] Please paste the English transcription here." },
            { start: 260, end: 270, text: "[Heatstroke Prevention Guide - Slot ( 04:20-04:30 )] Please paste the English transcription here." },
            { start: 270, end: 280, text: "[Heatstroke Prevention Guide - Slot ( 04:30-04:40 )] Please paste the English transcription here." },
            { start: 280, end: 290, text: "[Heatstroke Prevention Guide - Slot ( 04:40-04:50 )] Please paste the English transcription here." },
            { start: 290, end: 300, text: "[Heatstroke Prevention Guide - Slot ( 04:50-05:00 )] Please paste the English transcription here." },
            { start: 300, end: 310, text: "[Heatstroke Prevention Guide - Slot ( 05:00-05:10 )] Please paste the English transcription here." },
            { start: 310, end: 320, text: "[Heatstroke Prevention Guide - Slot ( 05:10-05:20 )] Please paste the English transcription here." },
            { start: 320, end: 330, text: "[Heatstroke Prevention Guide - Slot ( 05:20-05:30 )] Please paste the English transcription here." },
            { start: 330, end: 340, text: "[Heatstroke Prevention Guide - Slot ( 05:30-05:40 )] Please paste the English transcription here." },
            { start: 340, end: 350, text: "[Heatstroke Prevention Guide - Slot ( 05:40-05:50 )] Please paste the English transcription here." },
            { start: 350, end: 360, text: "[Heatstroke Prevention Guide - Slot ( 05:50-06:00 )] Please paste the English transcription here." },
            { start: 360, end: 370, text: "[Heatstroke Prevention Guide - Slot ( 06:00-06:10 )] Please paste the English transcription here." },
            { start: 370, end: 380, text: "[Heatstroke Prevention Guide - Slot ( 06:10-06:20 )] Please paste the English transcription here." },
            { start: 380, end: 390, text: "[Heatstroke Prevention Guide - Slot ( 06:20-06:30 )] Please paste the English transcription here." },
            { start: 390, end: 400, text: "[Heatstroke Prevention Guide - Slot ( 06:30-06:40 )] Please paste the English transcription here." },
            { start: 400, end: 410, text: "[Heatstroke Prevention Guide - Slot ( 06:40-06:50 )] Please paste the English transcription here." },
            { start: 410, end: 420, text: "[Heatstroke Prevention Guide - Slot ( 06:50-07:00 )] Please paste the English transcription here." },
            { start: 420, end: 430, text: "[Heatstroke Prevention Guide - Slot ( 07:00-07:10 )] Please paste the English transcription here." },
            { start: 430, end: 440, text: "[Heatstroke Prevention Guide - Slot ( 07:10-07:20 )] Please paste the English transcription here." },
            { start: 440, end: 450, text: "[Heatstroke Prevention Guide - Slot ( 07:20-07:30 )] Please paste the English transcription here." },
            { start: 450, end: 460, text: "[Heatstroke Prevention Guide - Slot ( 07:30-07:40 )] Please paste the English transcription here." },
            { start: 460, end: 470, text: "[Heatstroke Prevention Guide - Slot ( 07:40-07:50 )] Please paste the English transcription here." },
            { start: 470, end: 480, text: "[Heatstroke Prevention Guide - Slot ( 07:50-08:00 )] Please paste the English transcription here." },
            { start: 480, end: 490, text: "[Heatstroke Prevention Guide - Slot ( 08:00-08:10 )] Please paste the English transcription here." },
            { start: 490, end: 500, text: "[Heatstroke Prevention Guide - Slot ( 08:10-08:20 )] Please paste the English transcription here." },
            { start: 500, end: 510, text: "[Heatstroke Prevention Guide - Slot ( 08:20-08:30 )] Please paste the English transcription here." },
            { start: 510, end: 520, text: "[Heatstroke Prevention Guide - Slot ( 08:30-08:40 )] Please paste the English transcription here." },
            { start: 520, end: 530, text: "[Heatstroke Prevention Guide - Slot ( 08:40-08:50 )] Please paste the English transcription here." },
            { start: 530, end: 540, text: "[Heatstroke Prevention Guide - Slot ( 08:50-09:00 )] Please paste the English transcription here." },
            { start: 540, end: 550, text: "[Heatstroke Prevention Guide - Slot ( 09:00-09:10 )] Please paste the English transcription here." },
            { start: 550, end: 560, text: "[Heatstroke Prevention Guide - Slot ( 09:10-09:20 )] Please paste the English transcription here." },
            { start: 560, end: 570, text: "[Heatstroke Prevention Guide - Slot ( 09:20-09:30 )] Please paste the English transcription here." },
            { start: 570, end: 580, text: "[Heatstroke Prevention Guide - Slot ( 09:30-09:40 )] Please paste the English transcription here." },
            { start: 580, end: 590, text: "[Heatstroke Prevention Guide - Slot ( 09:40-09:50 )] Please paste the English transcription here." },
            { start: 590, end: 600, text: "[Heatstroke Prevention Guide - Slot ( 09:50-10:00 )] Please paste the English transcription here." },
            { start: 600, end: 610, text: "[Heatstroke Prevention Guide - Slot ( 10:00-10:10 )] Please paste the English transcription here." },
            { start: 610, end: 620, text: "[Heatstroke Prevention Guide - Slot ( 10:10-10:20 )] Please paste the English transcription here." },
            { start: 620, end: 630, text: "[Heatstroke Prevention Guide - Slot ( 10:20-10:30 )] Please paste the English transcription here." },
            { start: 630, end: 640, text: "[Heatstroke Prevention Guide - Slot ( 10:30-10:40 )] Please paste the English transcription here." },
            { start: 640, end: 650, text: "[Heatstroke Prevention Guide - Slot ( 10:40-10:50 )] Please paste the English transcription here." },
            { start: 650, end: 660, text: "[Heatstroke Prevention Guide - Slot ( 10:50-11:00 )] Please paste the English transcription here." }
          ],
          vi: [
            { start: 0, end: 6, text: "Xin chào mọi người. Sau đây chúng tôi sẽ hướng dẫn các biện pháp phòng chống say nắng tại nơi làm việc." },
            { start: 6, end: 12, text: "Chương 1: Hãy tìm hiểu đúng về say nắng." },
            { start: 12, end: 20, text: "Số người bị say nắng tăng lên rất nhiều từ mùa mưa đến mùa hè." },
            { start: 20, end: 30, text: "[Hướng dẫn phòng chống say nắng - Slot ( 00:20-00:30 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 30, end: 40, text: "[Hướng dẫn phòng chống say nắng - Slot ( 00:30-00:40 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 40, end: 50, text: "[Hướng dẫn phòng chống say nắng - Slot ( 00:40-00:50 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 50, end: 60, text: "[Hướng dẫn phòng chống say nắng - Slot ( 00:50-01:00 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 60, end: 70, text: "[Hướng dẫn phòng chống say nắng - Slot ( 01:00-01:10 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 70, end: 80, text: "[Hướng dẫn phòng chống say nắng - Slot ( 01:10-01:20 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 80, end: 90, text: "[Hướng dẫn phòng chống say nắng - Slot ( 01:20-01:30 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 90, end: 100, text: "[Hướng dẫn phòng chống say nắng - Slot ( 01:30-01:40 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 100, end: 110, text: "[Hướng dẫn phòng chống say nắng - Slot ( 01:40-01:50 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 110, end: 120, text: "[Hướng dẫn phòng chống say nắng - Slot ( 01:50-02:00 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 120, end: 130, text: "[Hướng dẫn phòng chống say nắng - Slot ( 02:00-02:10 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 130, end: 140, text: "[Hướng dẫn phòng chống say nắng - Slot ( 02:10-02:20 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 140, end: 150, text: "[Hướng dẫn phòng chống say nắng - Slot ( 02:20-02:30 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 150, end: 160, text: "[Hướng dẫn phòng chống say nắng - Slot ( 02:30-02:40 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 160, end: 170, text: "[Hướng dẫn phòng chống say nắng - Slot ( 02:40-02:50 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 170, end: 180, text: "[Hướng dẫn phòng chống say nắng - Slot ( 02:50-03:00 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 180, end: 190, text: "[Hướng dẫn phòng chống say nắng - Slot ( 03:00-03:10 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 190, end: 200, text: "[Hướng dẫn phòng chống say nắng - Slot ( 03:10-03:20 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 200, end: 210, text: "[Hướng dẫn phòng chống say nắng - Slot ( 03:20-03:30 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 210, end: 220, text: "[Hướng dẫn phòng chống say nắng - Slot ( 03:30-03:40 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 220, end: 230, text: "[Hướng dẫn phòng chống say nắng - Slot ( 03:40-03:50 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 230, end: 240, text: "[Hướng dẫn phòng chống say nắng - Slot ( 03:50-04:00 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 240, end: 250, text: "[Hướng dẫn phòng chống say nắng - Slot ( 04:00-04:10 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 250, end: 260, text: "[Hướng dẫn phòng chống say nắng - Slot ( 04:10-04:20 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 260, end: 270, text: "[Hướng dẫn phòng chống say nắng - Slot ( 04:20-04:30 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 270, end: 280, text: "[Hướng dẫn phòng chống say nắng - Slot ( 04:30-04:40 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 280, end: 290, text: "[Hướng dẫn phòng chống say nắng - Slot ( 04:40-04:50 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 290, end: 300, text: "[Hướng dẫn phòng chống say nắng - Slot ( 04:50-05:00 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 300, end: 310, text: "[Hướng dẫn phòng chống say nắng - Slot ( 05:00-05:10 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 310, end: 320, text: "[Hướng dẫn phòng chống say nắng - Slot ( 05:10-05:20 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 320, end: 330, text: "[Hướng dẫn phòng chống say nắng - Slot ( 05:20-05:30 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 330, end: 340, text: "[Hướng dẫn phòng chống say nắng - Slot ( 05:30-05:40 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 340, end: 350, text: "[Hướng dẫn phòng chống say nắng - Slot ( 05:40-05:50 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 350, end: 360, text: "[Hướng dẫn phòng chống say nắng - Slot ( 05:50-06:00 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 360, end: 370, text: "[Hướng dẫn phòng chống say nắng - Slot ( 06:00-06:10 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 370, end: 380, text: "[Hướng dẫn phòng chống say nắng - Slot ( 06:10-06:20 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 380, end: 390, text: "[Hướng dẫn phòng chống say nắng - Slot ( 06:20-06:30 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 390, end: 400, text: "[Hướng dẫn phòng chống say nắng - Slot ( 06:30-06:40 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 400, end: 410, text: "[Hướng dẫn phòng chống say nắng - Slot ( 06:40-06:50 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 410, end: 420, text: "[Hướng dẫn phòng chống say nắng - Slot ( 06:50-07:00 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 420, end: 430, text: "[Hướng dẫn phòng chống say nắng - Slot ( 07:00-07:10 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 430, end: 440, text: "[Hướng dẫn phòng chống say nắng - Slot ( 07:10-07:20 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 440, end: 450, text: "[Hướng dẫn phòng chống say nắng - Slot ( 07:20-07:30 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 450, end: 460, text: "[Hướng dẫn phòng chống say nắng - Slot ( 07:30-07:40 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 460, end: 470, text: "[Hướng dẫn phòng chống say nắng - Slot ( 07:40-07:50 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 470, end: 480, text: "[Hướng dẫn phòng chống say nắng - Slot ( 07:50-08:00 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 480, end: 490, text: "[Hướng dẫn phòng chống say nắng - Slot ( 08:00-08:10 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 490, end: 500, text: "[Hướng dẫn phòng chống say nắng - Slot ( 08:10-08:20 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 500, end: 510, text: "[Hướng dẫn phòng chống say nắng - Slot ( 08:20-08:30 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 510, end: 520, text: "[Hướng dẫn phòng chống say nắng - Slot ( 08:30-08:40 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 520, end: 530, text: "[Hướng dẫn phòng chống say nắng - Slot ( 08:40-08:50 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 530, end: 540, text: "[Hướng dẫn phòng chống say nắng - Slot ( 08:50-09:00 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 540, end: 550, text: "[Hướng dẫn phòng chống say nắng - Slot ( 09:00-09:10 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 550, end: 560, text: "[Hướng dẫn phòng chống say nắng - Slot ( 09:10-09:20 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 560, end: 570, text: "[Hướng dẫn phòng chống say nắng - Slot ( 09:20-09:30 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 570, end: 580, text: "[Hướng dẫn phòng chống say nắng - Slot ( 09:30-09:40 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 580, end: 590, text: "[Hướng dẫn phòng chống say nắng - Slot ( 09:40-09:50 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 590, end: 600, text: "[Hướng dẫn phòng chống say nắng - Slot ( 09:50-10:00 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 600, end: 610, text: "[Hướng dẫn phòng chống say nắng - Slot ( 10:00-10:10 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 610, end: 620, text: "[Hướng dẫn phòng chống say nắng - Slot ( 10:10-10:20 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 620, end: 630, text: "[Hướng dẫn phòng chống say nắng - Slot ( 10:20-10:30 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 630, end: 640, text: "[Hướng dẫn phòng chống say nắng - Slot ( 10:30-10:40 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 640, end: 650, text: "[Hướng dẫn phòng chống say nắng - Slot ( 10:40-10:50 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." },
            { start: 650, end: 660, text: "[Hướng dẫn phòng chống say nắng - Slot ( 10:50-11:00 )] Vui lòng dán bản dịch tiếng Việt thực tế vào đây." }
          ],
          es: [
            { start: 0, end: 6, text: "Hola a todos. Ahora explicaremos las medidas de prevención del golpe de calor en el lugar de trabajo." },
            { start: 6, end: 12, text: "Capítulo 1: Entendamos correctamente el golpe de calor." },
            { start: 12, end: 20, text: "El número de personas que sufren golpes de calor aumenta significativamente desde la temporada de lluvias hasta el verano." },
            { start: 20, end: 30, text: "[Guía de prevención de golpes de calor - Slot ( 00:20-00:30 )] Pegue la transcripción en español aquí." },
            { start: 30, end: 40, text: "[Guía de prevención de golpes de calor - Slot ( 00:30-00:40 )] Pegue la transcripción en español aquí." },
            { start: 40, end: 50, text: "[Guía de prevención de golpes de calor - Slot ( 00:40-00:50 )] Pegue la transcripción en español aquí." },
            { start: 50, end: 60, text: "[Guía de prevención de golpes de calor - Slot ( 00:50-01:00 )] Pegue la transcripción en español aquí." },
            { start: 60, end: 70, text: "[Guía de prevención de golpes de calor - Slot ( 01:00-01:10 )] Pegue la transcripción en español aquí." },
            { start: 70, end: 80, text: "[Guía de prevención de golpes de calor - Slot ( 01:10-01:20 )] Pegue la transcripción en español aquí." },
            { start: 80, end: 90, text: "[Guía de prevención de golpes de calor - Slot ( 01:20-01:30 )] Pegue la transcripción en español aquí." },
            { start: 90, end: 100, text: "[Guía de prevención de golpes de calor - Slot ( 01:30-01:40 )] Pegue la transcripción en español aquí." },
            { start: 100, end: 110, text: "[Guía de prevención de golpes de calor - Slot ( 01:40-01:50 )] Pegue la transcripción en español aquí." },
            { start: 110, end: 120, text: "[Guía de prevención de golpes de calor - Slot ( 01:50-02:00 )] Pegue la transcripción en español aquí." },
            { start: 120, end: 130, text: "[Guía de prevención de golpes de calor - Slot ( 02:00-02:10 )] Pegue la transcripción en español aquí." },
            { start: 130, end: 140, text: "[Guía de prevención de golpes de calor - Slot ( 02:10-02:20 )] Pegue la transcripción en español aquí." },
            { start: 140, end: 150, text: "[Guía de prevención de golpes de calor - Slot ( 02:20-02:30 )] Pegue la transcripción en español aquí." },
            { start: 150, end: 160, text: "[Guía de prevención de golpes de calor - Slot ( 02:30-02:40 )] Pegue la transcripción en español aquí." },
            { start: 160, end: 170, text: "[Guía de prevención de golpes de calor - Slot ( 02:40-02:50 )] Pegue la transcripción en español aquí." },
            { start: 170, end: 180, text: "[Guía de prevención de golpes de calor - Slot ( 02:50-03:00 )] Pegue la transcripción en español aquí." },
            { start: 180, end: 190, text: "[Guía de prevención de golpes de calor - Slot ( 03:00-03:10 )] Pegue la transcripción en español aquí." },
            { start: 190, end: 200, text: "[Guía de prevención de golpes de calor - Slot ( 03:10-03:20 )] Pegue la transcripción en español aquí." },
            { start: 200, end: 210, text: "[Guía de prevención de golpes de calor - Slot ( 03:20-03:30 )] Pegue la transcripción en español aquí." },
            { start: 210, end: 220, text: "[Guía de prevención de golpes de calor - Slot ( 03:30-03:40 )] Pegue la transcripción en español aquí." },
            { start: 220, end: 230, text: "[Guía de prevención de golpes de calor - Slot ( 03:40-03:50 )] Pegue la transcripción en español aquí." },
            { start: 230, end: 240, text: "[Guía de prevención de golpes de calor - Slot ( 03:50-04:00 )] Pegue la transcripción en español aquí." },
            { start: 240, end: 250, text: "[Guía de prevención de golpes de calor - Slot ( 04:00-04:10 )] Pegue la transcripción en español aquí." },
            { start: 250, end: 260, text: "[Guía de prevención de golpes de calor - Slot ( 04:10-04:20 )] Pegue la transcripción en español aquí." },
            { start: 260, end: 270, text: "[Guía de prevención de golpes de calor - Slot ( 04:20-04:30 )] Pegue la transcripción en español aquí." },
            { start: 270, end: 280, text: "[Guía de prevención de golpes de calor - Slot ( 04:30-04:40 )] Pegue la transcripción en español aquí." },
            { start: 280, end: 290, text: "[Guía de prevención de golpes de calor - Slot ( 04:40-04:50 )] Pegue la transcripción en español aquí." },
            { start: 290, end: 300, text: "[Guía de prevención de golpes de calor - Slot ( 04:50-05:00 )] Pegue la transcripción en español aquí." },
            { start: 300, end: 310, text: "[Guía de prevención de golpes de calor - Slot ( 05:00-05:10 )] Pegue la transcripción en español aquí." },
            { start: 310, end: 320, text: "[Guía de prevención de golpes de calor - Slot ( 05:10-05:20 )] Pegue la transcripción en español aquí." },
            { start: 320, end: 330, text: "[Guía de prevención de golpes de calor - Slot ( 05:20-05:30 )] Pegue la transcripción en español aquí." },
            { start: 330, end: 340, text: "[Guía de prevención de golpes de calor - Slot ( 05:30-05:40 )] Pegue la transcripción en español aquí." },
            { start: 340, end: 350, text: "[Guía de prevención de golpes de calor - Slot ( 05:40-05:50 )] Pegue la transcripción en español aquí." },
            { start: 350, end: 360, text: "[Guía de prevención de golpes de calor - Slot ( 05:50-06:00 )] Pegue la transcripción en español aquí." },
            { start: 360, end: 370, text: "[Guía de prevención de golpes de calor - Slot ( 06:00-06:10 )] Pegue la transcripción en español aquí." },
            { start: 370, end: 380, text: "[Guía de prevención de golpes de calor - Slot ( 06:10-06:20 )] Pegue la transcripción en español aquí." },
            { start: 380, end: 390, text: "[Guía de prevención de golpes de calor - Slot ( 06:20-06:30 )] Pegue la transcripción en español aquí." },
            { start: 390, end: 400, text: "[Guía de prevención de golpes de calor - Slot ( 06:30-06:40 )] Pegue la transcripción en español aquí." },
            { start: 400, end: 410, text: "[Guía de prevención de golpes de calor - Slot ( 06:40-06:50 )] Pegue la transcripción en español aquí." },
            { start: 410, end: 420, text: "[Guía de prevención de golpes de calor - Slot ( 06:50-07:00 )] Pegue la transcripción en español aquí." },
            { start: 420, end: 430, text: "[Guía de prevención de golpes de calor - Slot ( 07:00-07:10 )] Pegue la transcripción en español aquí." },
            { start: 430, end: 440, text: "[Guía de prevención de golpes de calor - Slot ( 07:10-07:20 )] Pegue la transcripción en español aquí." },
            { start: 440, end: 450, text: "[Guía de prevención de golpes de calor - Slot ( 07:20-07:30 )] Pegue la transcripción en español aquí." },
            { start: 450, end: 460, text: "[Guía de prevención de golpes de calor - Slot ( 07:30-07:40 )] Pegue la transcripción en español aquí." },
            { start: 460, end: 470, text: "[Guía de prevención de golpes de calor - Slot ( 07:40-07:50 )] Pegue la transcripción en español aquí." },
            { start: 470, end: 480, text: "[Guía de prevención de golpes de calor - Slot ( 07:50-08:00 )] Pegue la transcripción en español aquí." },
            { start: 480, end: 490, text: "[Guía de prevención de golpes de calor - Slot ( 08:00-08:10 )] Pegue la transcripción en español aquí." },
            { start: 490, end: 500, text: "[Guía de prevención de golpes de calor - Slot ( 08:10-08:20 )] Pegue la transcripción en español aquí." },
            { start: 500, end: 510, text: "[Guía de prevención de golpes de calor - Slot ( 08:20-08:30 )] Pegue la transcripción en español aquí." },
            { start: 510, end: 520, text: "[Guía de prevención de golpes de calor - Slot ( 08:30-08:40 )] Pegue la transcripción en español aquí." },
            { start: 520, end: 530, text: "[Guía de prevención de golpes de calor - Slot ( 08:40-08:50 )] Pegue la transcripción en español aquí." },
            { start: 530, end: 540, text: "[Guía de prevención de golpes de calor - Slot ( 08:50-09:00 )] Pegue la transcripción en español aquí." },
            { start: 540, end: 550, text: "[Guía de prevención de golpes de calor - Slot ( 09:00-09:10 )] Pegue la transcripción en español aquí." },
            { start: 550, end: 560, text: "[Guía de prevención de golpes de calor - Slot ( 09:10-09:20 )] Pegue la transcripción en español aquí." },
            { start: 560, end: 570, text: "[Guía de prevención de golpes de calor - Slot ( 09:20-09:30 )] Pegue la transcripción en español aquí." },
            { start: 570, end: 580, text: "[Guía de prevención de golpes de calor - Slot ( 09:30-09:40 )] Pegue la transcripción en español aquí." },
            { start: 580, end: 590, text: "[Guía de prevención de golpes de calor - Slot ( 09:40-09:50 )] Pegue la transcripción en español aquí." },
            { start: 590, end: 600, text: "[Guía de prevención de golpes de calor - Slot ( 09:50-10:00 )] Pegue la transcripción en español aquí." },
            { start: 600, end: 610, text: "[Guía de prevención de golpes de calor - Slot ( 10:00-10:10 )] Pegue la transcripción en español aquí." },
            { start: 610, end: 620, text: "[Guía de prevención de golpes de calor - Slot ( 10:10-10:20 )] Pegue la transcripción en español aquí." },
            { start: 620, end: 630, text: "[Guía de prevención de golpes de calor - Slot ( 10:20-10:30 )] Pegue la transcripción en español aquí." },
            { start: 630, end: 640, text: "[Guía de prevención de golpes de calor - Slot ( 10:30-10:40 )] Pegue la transcripción en español aquí." },
            { start: 640, end: 650, text: "[Guía de prevención de golpes de calor - Slot ( 10:40-10:50 )] Pegue la transcripción en español aquí." },
            { start: 650, end: 660, text: "[Guía de prevención de golpes de calor - Slot ( 10:50-11:00 )] Pegue la transcripción en español aquí." }
          ],
          pt: [
            { start: 0, end: 6, text: "Olá a todos. Vamos agora explicar as medidas de prevenção da insolação no local de trabalho." },
            { start: 6, end: 12, text: "Capítulo 1: Vamos compreender corretamente a insolação." },
            { start: 12, end: 20, text: "O número de pessoas que sofrem de insolação aumenta significativamente da estação chuvosa para o verão." },
            { start: 20, end: 30, text: "[Guia de prevenção de insolação - Slot ( 00:20-00:30 )] Cole a transcrição em português aqui." },
            { start: 30, end: 40, text: "[Guia de prevenção de insolação - Slot ( 00:30-00:40 )] Cole a transcrição em português aqui." },
            { start: 40, end: 50, text: "[Guia de prevenção de insolação - Slot ( 00:40-00:50 )] Cole a transcrição em português aqui." },
            { start: 50, end: 60, text: "[Guia de prevenção de insolação - Slot ( 00:50-01:00 )] Cole a transcrição em português aqui." },
            { start: 60, end: 70, text: "[Guia de prevenção de insolação - Slot ( 01:00-01:10 )] Cole a transcrição em português aqui." },
            { start: 70, end: 80, text: "[Guia de prevenção de insolação - Slot ( 01:10-01:20 )] Cole a transcrição em português aqui." },
            { start: 80, end: 90, text: "[Guia de prevenção de insolação - Slot ( 01:20-01:30 )] Cole a transcrição em português aqui." },
            { start: 90, end: 100, text: "[Guia de prevenção de insolação - Slot ( 01:30-01:40 )] Cole a transcrição em português aqui." },
            { start: 100, end: 110, text: "[Guia de prevenção de insolação - Slot ( 01:40-01:50 )] Cole a transcrição em português aqui." },
            { start: 110, end: 120, text: "[Guia de prevenção de insolação - Slot ( 01:50-02:00 )] Cole a transcrição em português aqui." },
            { start: 120, end: 130, text: "[Guia de prevenção de insolação - Slot ( 02:00-02:10 )] Cole a transcrição em português aqui." },
            { start: 130, end: 140, text: "[Guia de prevenção de insolação - Slot ( 02:10-02:20 )] Cole a transcrição em português aqui." },
            { start: 140, end: 150, text: "[Guia de prevenção de insolação - Slot ( 02:20-02:30 )] Cole a transcrição em português aqui." },
            { start: 150, end: 160, text: "[Guia de prevenção de insolação - Slot ( 02:30-02:40 )] Cole a transcrição em português aqui." },
            { start: 160, end: 170, text: "[Guia de prevenção de insolação - Slot ( 02:40-02:50 )] Cole a transcrição em português aqui." },
            { start: 170, end: 180, text: "[Guia de prevenção de insolação - Slot ( 02:50-03:00 )] Cole a transcrição em português aqui." },
            { start: 180, end: 190, text: "[Guia de prevenção de insolação - Slot ( 03:00-03:10 )] Cole a transcrição em português aqui." },
            { start: 190, end: 200, text: "[Guia de prevenção de insolação - Slot ( 03:10-03:20 )] Cole a transcrição em português aqui." },
            { start: 200, end: 210, text: "[Guia de prevenção de insolação - Slot ( 03:20-03:30 )] Cole a transcrição em português aqui." },
            { start: 210, end: 220, text: "[Guia de prevenção de insolação - Slot ( 03:30-03:40 )] Cole a transcrição em português aqui." },
            { start: 220, end: 230, text: "[Guia de prevenção de insolação - Slot ( 03:40-03:50 )] Cole a transcrição em português aqui." },
            { start: 230, end: 240, text: "[Guia de prevenção de insolação - Slot ( 03:50-04:00 )] Cole a transcrição em português aqui." },
            { start: 240, end: 250, text: "[Guia de prevenção de insolação - Slot ( 04:00-04:10 )] Cole a transcrição em português aqui." },
            { start: 250, end: 260, text: "[Guia de prevenção de insolação - Slot ( 04:10-04:20 )] Cole a transcrição em português aqui." },
            { start: 260, end: 270, text: "[Guia de prevenção de insolação - Slot ( 04:20-04:30 )] Cole a transcrição em português aqui." },
            { start: 270, end: 280, text: "[Guia de prevenção de insolação - Slot ( 04:30-04:40 )] Cole a transcrição em português aqui." },
            { start: 280, end: 290, text: "[Guia de prevenção de insolação - Slot ( 04:40-04:50 )] Cole a transcrição em português aqui." },
            { start: 290, end: 300, text: "[Guia de prevenção de insolação - Slot ( 04:50-05:00 )] Cole a transcrição em português aqui." },
            { start: 300, end: 310, text: "[Guia de prevenção de insolação - Slot ( 05:00-05:10 )] Cole a transcrição em português aqui." },
            { start: 310, end: 320, text: "[Guia de prevenção de insolação - Slot ( 05:10-05:20 )] Cole a transcrição em português aqui." },
            { start: 320, end: 330, text: "[Guia de prevenção de insolação - Slot ( 05:20-05:30 )] Cole a transcrição em português aqui." },
            { start: 330, end: 340, text: "[Guia de prevenção de insolação - Slot ( 05:30-05:40 )] Cole a transcrição em português aqui." },
            { start: 340, end: 350, text: "[Guia de prevenção de insolação - Slot ( 05:40-05:50 )] Cole a transcrição em português aqui." },
            { start: 350, end: 360, text: "[Guia de prevenção de insolação - Slot ( 05:50-06:00 )] Cole a transcrição em português aqui." },
            { start: 360, end: 370, text: "[Guia de prevenção de insolação - Slot ( 06:00-06:10 )] Cole a transcrição em português aqui." },
            { start: 370, end: 380, text: "[Guia de prevenção de insolação - Slot ( 06:10-06:20 )] Cole a transcrição em português aqui." },
            { start: 380, end: 390, text: "[Guia de prevenção de insolação - Slot ( 06:20-06:30 )] Cole a transcrição em português aqui." },
            { start: 390, end: 400, text: "[Guia de prevenção de insolação - Slot ( 06:30-06:40 )] Cole a transcrição em português aqui." },
            { start: 400, end: 410, text: "[Guia de prevenção de insolação - Slot ( 06:40-06:50 )] Cole a transcrição em português aqui." },
            { start: 410, end: 420, text: "[Guia de prevenção de insolação - Slot ( 06:50-07:00 )] Cole a transcrição em português aqui." },
            { start: 420, end: 430, text: "[Guia de prevenção de insolação - Slot ( 07:00-07:10 )] Cole a transcrição em português aqui." },
            { start: 430, end: 440, text: "[Guia de prevenção de insolação - Slot ( 07:10-07:20 )] Cole a transcrição em português aqui." },
            { start: 440, end: 450, text: "[Guia de prevenção de insolação - Slot ( 07:20-07:30 )] Cole a transcrição em português aqui." },
            { start: 450, end: 460, text: "[Guia de prevenção de insolação - Slot ( 07:30-07:40 )] Cole a transcrição em português aqui." },
            { start: 460, end: 470, text: "[Guia de prevenção de insolação - Slot ( 07:40-07:50 )] Cole a transcrição em português aqui." },
            { start: 470, end: 480, text: "[Guia de prevenção de insolação - Slot ( 07:50-08:00 )] Cole a transcrição em português aqui." },
            { start: 480, end: 490, text: "[Guia de prevenção de insolação - Slot ( 08:00-08:10 )] Cole a transcrição em português aqui." },
            { start: 490, end: 500, text: "[Guia de prevenção de insolação - Slot ( 08:10-08:20 )] Cole a transcrição em português aqui." },
            { start: 500, end: 510, text: "[Guia de prevenção de insolação - Slot ( 08:20-08:30 )] Cole a transcrição em português aqui." },
            { start: 510, end: 520, text: "[Guia de prevenção de insolação - Slot ( 08:30-08:40 )] Cole a transcrição em português aqui." },
            { start: 520, end: 530, text: "[Guia de prevenção de insolação - Slot ( 08:40-08:50 )] Cole a transcrição em português aqui." },
            { start: 530, end: 540, text: "[Guia de prevenção de insolação - Slot ( 08:50-09:00 )] Cole a transcrição em português aqui." },
            { start: 540, end: 550, text: "[Guia de prevenção de insolação - Slot ( 09:00-09:10 )] Cole a transcrição em português aqui." },
            { start: 550, end: 560, text: "[Guia de prevenção de insolação - Slot ( 09:10-09:20 )] Cole a transcrição em português aqui." },
            { start: 560, end: 570, text: "[Guia de prevenção de insolação - Slot ( 09:20-09:30 )] Cole a transcrição em português aqui." },
            { start: 570, end: 580, text: "[Guia de prevenção de insolação - Slot ( 09:30-09:40 )] Cole a transcrição em português aqui." },
            { start: 580, end: 590, text: "[Guia de prevenção de insolação - Slot ( 09:40-09:50 )] Cole a transcrição em português aqui." },
            { start: 590, end: 600, text: "[Guia de prevenção de insolação - Slot ( 09:50-10:00 )] Cole a transcrição em português aqui." },
            { start: 600, end: 610, text: "[Guia de prevenção de insolação - Slot ( 10:00-10:10 )] Cole a transcrição em português aqui." },
            { start: 610, end: 620, text: "[Guia de prevenção de insolação - Slot ( 10:10-10:20 )] Cole a transcrição em português aqui." },
            { start: 620, end: 630, text: "[Guia de prevenção de insolação - Slot ( 10:20-10:30 )] Cole a transcrição em português aqui." },
            { start: 630, end: 640, text: "[Guia de prevenção de insolação - Slot ( 10:30-10:40 )] Cole a transcrição em português aqui." },
            { start: 640, end: 650, text: "[Guia de prevenção de insolação - Slot ( 10:40-10:50 )] Cole a transcrição em português aqui." },
            { start: 650, end: 660, text: "[Guia de prevenção de insolação - Slot ( 10:50-11:00 )] Cole a transcrição em português aqui." }
          ],
          id: [
            { start: 0, end: 6, text: "Halo semuanya. Kami akan menjelaskan langkah-langkah pencegahan heatstroke di tempat kerja sekarang." },
            { start: 6, end: 12, text: "Bab 1: Mari kita pahami heatstroke dengan benar." },
            { start: 12, end: 20, text: "Jumlah orang yang terkena heatstroke meningkat sangat banyak dari musim hujan hingga musim panas." },
            { start: 20, end: 30, text: "[Panduan Pencegahan Heatstroke - Slot ( 00:20-00:30 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 30, end: 40, text: "[Panduan Pencegahan Heatstroke - Slot ( 00:30-00:40 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 40, end: 50, text: "[Panduan Pencegahan Heatstroke - Slot ( 00:40-00:50 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 50, end: 60, text: "[Panduan Pencegahan Heatstroke - Slot ( 00:50-01:00 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 60, end: 70, text: "[Panduan Pencegahan Heatstroke - Slot ( 01:00-01:10 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 70, end: 80, text: "[Panduan Pencegahan Heatstroke - Slot ( 01:10-01:20 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 80, end: 90, text: "[Panduan Pencegahan Heatstroke - Slot ( 01:20-01:30 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 90, end: 100, text: "[Panduan Pencegahan Heatstroke - Slot ( 01:30-01:40 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 100, end: 110, text: "[Panduan Pencegahan Heatstroke - Slot ( 01:40-01:50 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 110, end: 120, text: "[Panduan Pencegahan Heatstroke - Slot ( 01:50-02:00 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 120, end: 130, text: "[Panduan Pencegahan Heatstroke - Slot ( 02:00-02:10 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 130, end: 140, text: "[Panduan Pencegahan Heatstroke - Slot ( 02:10-02:20 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 140, end: 150, text: "[Panduan Pencegahan Heatstroke - Slot ( 02:20-02:30 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 150, end: 160, text: "[Panduan Pencegahan Heatstroke - Slot ( 02:30-02:40 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 160, end: 170, text: "[Panduan Pencegahan Heatstroke - Slot ( 02:40-02:50 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 170, end: 180, text: "[Panduan Pencegahan Heatstroke - Slot ( 02:50-03:00 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 180, end: 190, text: "[Panduan Pencegahan Heatstroke - Slot ( 03:00-03:10 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 190, end: 200, text: "[Panduan Pencegahan Heatstroke - Slot ( 03:10-03:20 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 200, end: 210, text: "[Panduan Pencegahan Heatstroke - Slot ( 03:20-03:30 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 210, end: 220, text: "[Panduan Pencegahan Heatstroke - Slot ( 03:30-03:40 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 220, end: 230, text: "[Panduan Pencegahan Heatstroke - Slot ( 03:40-03:50 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 230, end: 240, text: "[Panduan Pencegahan Heatstroke - Slot ( 03:50-04:00 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 240, end: 250, text: "[Panduan Pencegahan Heatstroke - Slot ( 04:00-04:10 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 250, end: 260, text: "[Panduan Pencegahan Heatstroke - Slot ( 04:10-04:20 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 260, end: 270, text: "[Panduan Pencegahan Heatstroke - Slot ( 04:20-04:30 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 270, end: 280, text: "[Panduan Pencegahan Heatstroke - Slot ( 04:30-04:40 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 280, end: 290, text: "[Panduan Pencegahan Heatstroke - Slot ( 04:40-04:50 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 290, end: 300, text: "[Panduan Pencegahan Heatstroke - Slot ( 04:50-05:00 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 300, end: 310, text: "[Panduan Pencegahan Heatstroke - Slot ( 05:00-05:10 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 310, end: 320, text: "[Panduan Pencegahan Heatstroke - Slot ( 05:10-05:20 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 320, end: 330, text: "[Panduan Pencegahan Heatstroke - Slot ( 05:20-05:30 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 330, end: 340, text: "[Panduan Pencegahan Heatstroke - Slot ( 05:30-05:40 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 340, end: 350, text: "[Panduan Pencegahan Heatstroke - Slot ( 05:40-05:50 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 350, end: 360, text: "[Panduan Pencegahan Heatstroke - Slot ( 05:50-06:00 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 360, end: 370, text: "[Panduan Pencegahan Heatstroke - Slot ( 06:00-06:10 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 370, end: 380, text: "[Panduan Pencegahan Heatstroke - Slot ( 06:10-06:20 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 380, end: 390, text: "[Panduan Pencegahan Heatstroke - Slot ( 06:20-06:30 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 390, end: 400, text: "[Panduan Pencegahan Heatstroke - Slot ( 06:30-06:40 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 400, end: 410, text: "[Panduan Pencegahan Heatstroke - Slot ( 06:40-06:50 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 410, end: 420, text: "[Panduan Pencegahan Heatstroke - Slot ( 06:50-07:00 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 420, end: 430, text: "[Panduan Pencegahan Heatstroke - Slot ( 07:00-07:10 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 430, end: 440, text: "[Panduan Pencegahan Heatstroke - Slot ( 07:10-07:20 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 440, end: 450, text: "[Panduan Pencegahan Heatstroke - Slot ( 07:20-07:30 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 450, end: 460, text: "[Panduan Pencegahan Heatstroke - Slot ( 07:30-07:40 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 460, end: 470, text: "[Panduan Pencegahan Heatstroke - Slot ( 07:40-07:50 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 470, end: 480, text: "[Panduan Pencegahan Heatstroke - Slot ( 07:50-08:00 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 480, end: 490, text: "[Panduan Pencegahan Heatstroke - Slot ( 08:00-08:10 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 490, end: 500, text: "[Panduan Pencegahan Heatstroke - Slot ( 08:10-08:20 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 500, end: 510, text: "[Panduan Pencegahan Heatstroke - Slot ( 08:20-08:30 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 510, end: 520, text: "[Panduan Pencegahan Heatstroke - Slot ( 08:30-08:40 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 520, end: 530, text: "[Panduan Pencegahan Heatstroke - Slot ( 08:40-08:50 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 530, end: 540, text: "[Panduan Pencegahan Heatstroke - Slot ( 08:50-09:00 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 540, end: 550, text: "[Panduan Pencegahan Heatstroke - Slot ( 09:00-09:10 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 550, end: 560, text: "[Panduan Pencegahan Heatstroke - Slot ( 09:10-09:20 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 560, end: 570, text: "[Panduan Pencegahan Heatstroke - Slot ( 09:20-09:30 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 570, end: 580, text: "[Panduan Pencegahan Heatstroke - Slot ( 09:30-09:40 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 580, end: 590, text: "[Panduan Pencegahan Heatstroke - Slot ( 09:40-09:50 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 590, end: 600, text: "[Panduan Pencegahan Heatstroke - Slot ( 09:50-10:00 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 600, end: 610, text: "[Panduan Pencegahan Heatstroke - Slot ( 10:00-10:10 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 610, end: 620, text: "[Panduan Pencegahan Heatstroke - Slot ( 10:10-10:20 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 620, end: 630, text: "[Panduan Pencegahan Heatstroke - Slot ( 10:20-10:30 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 630, end: 640, text: "[Panduan Pencegahan Heatstroke - Slot ( 10:30-10:40 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 640, end: 650, text: "[Panduan Pencegahan Heatstroke - Slot ( 10:40-10:50 )] Silakan tempel transkripsi bahasa Indonesia di sini." },
            { start: 650, end: 660, text: "[Panduan Pencegahan Heatstroke - Slot ( 10:50-11:00 )] Silakan tempel transkripsi bahasa Indonesia di sini." }
          ]
        }
      },
      {
        id: "height-safety",
        title: "高所作業の安全基準",
        desc: "足場の点検、フルハーネス型安全帯の使用方法と墜落防止措置。",
        duration: "25分",
        level: "必須",
        videos: {
          ja: "https://www.youtube.com/embed/kYJjZf5VvFk", // 建災防「墜落・転落災害防止の基本ルール14」
          en: "https://www.youtube.com/embed/W134-VnL3Zk", // 建災防「フルハーネス型安全帯について」
          vi: "https://www.youtube.com/embed/kYJjZf5VvFk", // 建災防動画
          es: "https://www.youtube.com/embed/kYJjZf5VvFk", // 建災防動画
          pt: "https://www.youtube.com/embed/kYJjZf5VvFk", // 建災防動画
          id: "https://www.youtube.com/embed/kYJjZf5VvFk"  // 建災防動画
        },
        scripts: {
          ja: [
            { start: 0, end: 10, text: "これから高所作業における安全ルールについて説明します。墜落防止の基本を学びましょう。" },
            { start: 10, end: 20, text: "高さ2メートル以上の高所では、フルハーネス型墜落制止用器具を正しく着用することが義務付けられています。" },
            { start: 20, end: 30, text: "作業を開始する前に、足場や手すりに異常がないか、必ず点検を行ってください。" },
            { start: 30, end: 40, text: "安全帯のフックは、頭上の高い位置にある頑丈な構造物に確実に掛けてください。" },
            { start: 40, end: 50, text: "ルールを徹底して守り、お互いに声を掛け合いながら、安全第一で作業を進めましょう。" }
          ],
          en: [
            { start: 0, end: 10, text: "We will now explain the safety rules for working at heights. Let's learn the basics of fall prevention." },
            { start: 10, end: 20, text: "At heights of 2 meters or more, wearing a full-body harness fall arrest system correctly is mandatory." },
            { start: 20, end: 30, text: "Before starting work, make sure to inspect the scaffolding and handrails for any abnormalities." },
            { start: 30, end: 40, text: "Ensure the safety belt hook is securely attached to a sturdy structure above head height." },
            { start: 40, end: 50, text: "Thoroughly follow the rules, call out to each other, and proceed with work prioritizing safety first." }
          ],
          vi: [
            { start: 0, end: 10, text: "Sau đây chúng tôi sẽ giải thích các quy tắc an toàn khi làm việc trên cao. Hãy cùng học những kiến thức cơ bản về chống rơi ngã." },
            { start: 10, end: 20, text: "Tại độ cao từ 2 mét trở lên, việc đeo đúng cách hệ thống chống rơi ngã toàn thân là bắt buộc." },
            { start: 20, end: 30, text: "Trước khi bắt đầu công việc, hãy chắc chắn kiểm tra giàn giáo và lan can để xem có bất thường nào không." },
            { start: 30, end: 40, text: "Hãy đảm bảo móc dây đai an toàn được gắn chắc chắn vào một cấu trúc vững chắc ở vị trí cao hơn đầu của bạn." },
            { start: 40, end: 50, text: "Hãy tuân thủ nghiêm ngặt các quy tắc, nhắc nhở lẫn nhau và tiến hành công việc với ưu tiên an toàn là trên hết." }
          ],
          es: [
            { start: 0, end: 10, text: "Ahora explicaremos las reglas de seguridad para trabajos en alturas. Aprendamos los conceptos básicos de prevención de caídas." },
            { start: 10, end: 20, text: "A alturas de 2 metros o más, es obligatorio usar correctamente un sistema de detención de caídas con arnés de cuerpo completo." },
            { start: 20, end: 30, text: "Antes de comenzar a trabajar, asegúrese de inspeccionar el andamio y los pasamanos en busca de anomalías." },
            { start: 30, end: 40, text: "Asegúrese de que el gancho del cinturón de seguridad esté bien sujeto a una estructura resistente por encima de la altura de la cabeza." },
            { start: 40, end: 50, text: "Siga estrictamente las reglas, avísense mutuamente y continúe con el trabajo priorizando la seguridad ante todo." }
          ],
          pt: [
            { start: 0, end: 10, text: "Vamos agora explicar as regras de segurança para trabalhar em alturas. Vamos aprender as bases da prevenção de quedas." },
            { start: 10, end: 20, text: "A alturas de 2 metros ou mais, é obrigatório usar corretamente um sistema antiqueda com arnês de corpo inteiro." },
            { start: 20, end: 30, text: "Antes de iniciar o trabalho, certifique-se de que inspeciona o andaime e os corrimãos para detetar qualquer anomalia." },
            { start: 30, end: 40, text: "Certifique-se de que o gancho do cinto de segurança está bem preso a uma estrutura resistente acima da altura da cabeça." },
            { start: 40, end: 50, text: "Siga rigorosamente as regras, alertem-se mutuamente e prossigam com o trabalho priorizando sempre a segurança." }
          ],
          id: [
            { start: 0, end: 10, text: "Kami akan menjelaskan aturan keselamatan untuk bekerja di ketinggian sekarang. Mari pelajari dasar-dasar pencegahan jatuh." },
            { start: 10, end: 20, text: "Pada ketinggian 2 meter atau lebih, mengenakan sistem penahan jatuh full-body harness secara benar adalah wajib." },
            { start: 20, end: 30, text: "Sebelum mulai bekerja, pastikan untuk memeriksa perancah dan pagar pengaman dari ketidaknormalan apa pun." },
            { start: 30, end: 40, text: "Pastikan pengait sabuk pengaman terpasang dengan aman pada struktur yang kokoh di atas ketinggian kepala." },
            { start: 40, end: 50, text: "Patuhi aturan dengan saksama, saling mengingatkan, dan lanjutkan pekerjaan dengan mengutamakan keselamatan terlebih dahulu." }
          ]
        }
      },
      {
        id: "labor-law",
        title: "労働安全衛生法（建設版）",
        desc: "建設現場における事業者の義務、安全衛生責任者の役割について。",
        duration: "40分",
        level: "推奨"
      }
    ],
    templates: [
      {
        name: "新規入場者教育記録簿",
        desc: "建設現場へ新規入場する労働者向けの安全教育実施記録フォーマット。",
        type: "安全管理",
        format: "Excel"
      },
      {
        name: "作業前点検表（足場・高所用）",
        desc: "毎朝の作業開始前に足場や器具の安全性を自己チェックするシート。",
        type: "点検表",
        format: "PDF"
      },
      {
        name: "工事安全衛生計画書",
        desc: "元請・下請間で共有すべき安全衛生管理計画のひな形。",
        type: "計画書",
        format: "Word"
      }
    ]
  },
  "介護・福祉": {
    safetyLibrary: [
      {
        id: "infection-control",
        title: "施設内感染症対策講習",
        desc: "ノロウイルス、インフルエンザなどの集団感染を防ぐ標準予防策と消毒手順。",
        duration: "20分",
        level: "必須"
      },
      {
        id: "care-body",
        title: "身体介助の基本と腰痛予防",
        desc: "利用者に負担をかけず、介護者の腰部を守るボディメカニクスの基礎知識。",
        duration: "30分",
        level: "必須"
      },
      {
        id: "care-compliance",
        title: "コンプライアンス（介護保険法版）",
        desc: "身体的拘束の禁止、虐待防止法、介護報酬請求における遵法意識。",
        duration: "35分",
        level: "必須"
      }
    ],
    templates: [
      {
        name: "介護事故・ヒヤリハット報告書",
        desc: "施設内でのアクシデントや事故につながりそうになった事例の記録・分析シート。",
        type: "事故報告",
        format: "Word"
      },
      {
        name: "感染症発生時対応マニュアル",
        desc: "入所者が感染症を発症した際の隔離対応や連絡網のテンプレート。",
        type: "マニュアル",
        format: "PDF"
      },
      {
        name: "身体拘束廃止に関する同意書",
        desc: "入所者の安全確保のためにやむを得ず身体拘束を行う場合の事前同意書面。",
        type: "契約書類",
        format: "Word"
      }
    ]
  },
  "製造・エンジニアリング": {
    safetyLibrary: [
      {
        id: "factory-machine",
        title: "機械操作時の巻き込まれ防止対策",
        desc: "プレス機や回転体の操作における安全装置の動作確認と服装の注意点。",
        duration: "20分",
        level: "必須"
      },
      {
        id: "factory-kyt",
        title: "危険予知訓練（KYT）の手法",
        desc: "作業開始前にチームで危険箇所を話し合い、対策を共有する訓練マニュアル。",
        duration: "15分",
        level: "推奨"
      },
      {
        id: "factory-5s",
        title: "工場内5S活動（整理・整頓・清楽など）",
        desc: "足元の安全確保と業務効率化のための環境整備の重要性。",
        duration: "15分",
        level: "任意"
      }
    ],
    templates: [
      {
        name: "ヒヤリハット報告書（工場版）",
        desc: "製造ライン上での軽微なミスや危険要因を報告するためのフォーマット。",
        type: "事故報告",
        format: "Excel"
      },
      {
        name: "機械設備定期点検チェックリスト",
        desc: "月次または年次で設備の動作不良を検査するための管理シート。",
        type: "点検表",
        format: "PDF"
      },
      {
        name: "化学物質安全データシート（SDS）管理簿",
        desc: "現場で使用する化学製品の有害性と保管方法の記録フォーマット。",
        type: "管理簿",
        format: "Excel"
      }
    ]
  },
  "飲食・フードサービス": {
    safetyLibrary: [
      {
        id: "food-haccp",
        title: "食品衛生管理の基礎（HACCPに沿った管理）",
        desc: "交差汚染の防止、温度管理の徹底、手洗いの徹底指導。",
        duration: "20分",
        level: "必須"
      },
      {
        id: "food-kitchen",
        title: "厨房内における労働災害防止",
        desc: "床の油汚れによる転倒防止、刃物の取り扱い、火傷防止のための教育マニュアル。",
        duration: "15分",
        level: "必須"
      },
      {
        id: "food-cust-haras",
        title: "カスタマーハラスメント対応ガイド",
        desc: "不当なクレームや店舗スタッフへの嫌がらせに対する初期対応と報告手順。",
        duration: "25分",
        level: "推奨"
      }
    ],
    templates: [
      {
        name: "衛生管理記録簿（デイリーチェック）",
        desc: "冷蔵庫の温度、調理器具の消毒状況を毎日記録する管理簿。",
        type: "点検表",
        format: "Excel"
      },
      {
        name: "アレルギー物質表示管理シート",
        desc: "メニューごとの特定原材料使用状況を可視化・共有するためのフォーマット。",
        type: "管理簿",
        format: "Word"
      },
      {
        name: "新入アルバイト安全衛生教育実施表",
        desc: "ホール・厨房スタッフに実施すべき基本的な教育内容チェックリスト。",
        type: "教育管理",
        format: "PDF"
      }
    ]
  },
  "その他": {
    safetyLibrary: [
      {
        id: "office-disaster",
        title: "オフィスにおける安全衛生と防災対策",
        desc: "避難経路の確認、デスク環境のエルゴノミクス、地震発生時の初動。",
        duration: "15分",
        level: "推奨"
      },
      {
        id: "office-security",
        title: "情報セキュリティ基本講習",
        desc: "パスワード管理、フィッシング詐欺への注意、個人情報の取り扱いルール。",
        duration: "20分",
        level: "必須"
      }
    ],
    templates: [
      {
        name: "緊急連絡網ひな形",
        desc: "災害発生時等の社内エスカレーションルート作成用のフォーマット。",
        type: "連絡網",
        format: "Word"
      },
      {
        name: "個人情報取扱同意書",
        desc: "入社時等に従業員から取得する個人情報の取り扱いに関する同意書。",
        type: "契約書類",
        format: "Word"
      }
    ]
  }
};

export function getIndustryContent(industry: string): IndustryContent {
  return industryConfig[industry] || industryConfig["その他"];
}
