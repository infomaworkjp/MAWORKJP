"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, RefreshCw, AlertCircle, Sparkles, FileImage, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { scanResidenceCard, ResidenceCardData } from "@/app/actions/scan-residence-card";

interface ScannerCardProps {
  onScanComplete: (data: ResidenceCardData) => void;
  onScanStart?: () => void;
  onScanError?: (error: string) => void;
}

export function ResidenceCardScanner({ onScanComplete, onScanStart, onScanError }: ScannerCardProps) {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Convert File to Base64 Data URL
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "不正なファイル形式",
        description: "画像ファイル（JPEG, PNG, WEBPなど）を選択してください。",
        variant: "destructive",
      });
      return;
    }

    try {
      setFileName(file.name);
      const base64 = await convertToBase64(file);
      setImage(base64);
    } catch (error) {
      console.error("Image loading error:", error);
      toast({
        title: "画像の読み込み失敗",
        description: "画像の読み込み中にエラーが発生しました。",
        variant: "destructive",
      });
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileChange(e.target.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleScan = async () => {
    if (!image) return;

    setIsScanning(true);
    setScanProgress(15);
    if (onScanStart) onScanStart();

    // Fake progress simulation to give a high-quality interactive feel
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 85) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 400);

    try {
      const response = await scanResidenceCard(image);
      clearInterval(interval);
      setScanProgress(100);

      if (response.success && response.data) {
        toast({
          title: "AIスキャン成功",
          description: "在留カードの情報を正しく抽出しました。",
        });
        onScanComplete(response.data);
      } else {
        const errorMsg = response.error || "データの抽出に失敗しました。";
        toast({
          title: "スキャン失敗",
          description: errorMsg,
          variant: "destructive",
        });
        if (onScanError) onScanError(errorMsg);
      }
    } catch (error: any) {
      clearInterval(interval);
      const errorMsg = error.message || "予期せぬエラーが発生しました。";
      toast({
        title: "エラーが発生しました",
        description: errorMsg,
        variant: "destructive",
      });
      if (onScanError) onScanError(errorMsg);
    } finally {
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setFileName(null);
    setScanProgress(0);
    setIsScanning(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="overflow-hidden border border-border/80 shadow-md">
      <style>{`
        @keyframes laser-scan {
          0% { top: 0%; opacity: 0.7; }
          50% { top: 100%; opacity: 1; }
          100% { top: 0%; opacity: 0.7; }
        }
        .laser-line {
          position: absolute;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, transparent, #22c55e, transparent);
          box-shadow: 0 0 15px 4px rgba(34, 197, 94, 0.9);
          animation: laser-scan 2.2s infinite ease-in-out;
          pointer-events: none;
        }
        .scanner-overlay {
          background: linear-gradient(to bottom, rgba(34, 197, 94, 0.01), rgba(34, 197, 94, 0.06), rgba(34, 197, 94, 0.01));
          backdrop-filter: saturate(1.1);
        }
      `}</style>
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
              AI 在留カードスキャナー
            </CardTitle>
            <CardDescription>
              画像をアップロードすると、AIが自動で氏名・在留資格・満了日を読み取ります。
            </CardDescription>
          </div>
          <ShieldCheck className="h-8 w-8 text-emerald-500 opacity-80" />
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileInputChange}
          accept="image/*"
          className="hidden"
          disabled={isScanning}
        />

        {!image ? (
          // Drag & Drop Area
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={triggerFileInput}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-4 ${
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-muted-foreground/35 hover:border-primary/80 hover:bg-muted/40"
            }`}
          >
            <div className="p-4 bg-primary/5 rounded-full text-primary/85 group-hover:scale-110 transition-transform">
              <UploadCloud className="h-10 w-10 text-indigo-500" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                クリックして画像をアップロード、またはドラッグ＆ドロップ
              </p>
              <p className="text-xs text-muted-foreground">
                対応フォーマット: PNG, JPEG, WEBP (最大 10MB)
              </p>
            </div>
          </div>
        ) : (
          // Preview & Scan Control Area
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-border max-h-[300px] flex items-center justify-center bg-zinc-950/5">
              {/* Image Preview */}
              <img
                src={image}
                alt="Residence Card Preview"
                className="max-h-[300px] w-auto object-contain transition-all duration-300"
              />

              {/* Scanning Animations */}
              {isScanning && (
                <>
                  <div className="absolute inset-0 scanner-overlay transition-opacity duration-300" />
                  <div className="laser-line" />
                </>
              )}
            </div>

            {/* File Info & Action Buttons */}
            <div className="flex items-center justify-between gap-4 p-3 bg-muted/30 rounded-lg border border-border/50 text-xs">
              <span className="font-medium text-muted-foreground flex items-center gap-1.5 truncate">
                <FileImage className="h-4 w-4 text-primary shrink-0" />
                {fileName || "uploaded_image.png"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={isScanning}
                className="h-8 text-destructive hover:bg-destructive/10"
              >
                画像を解除
              </Button>
            </div>

            {/* Progress Bar during Scanning */}
            {isScanning && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                    AI解析中...
                  </span>
                  <span>{scanProgress}%</span>
                </div>
                <Progress value={scanProgress} className="h-2 bg-muted-foreground/10" />
              </div>
            )}

            {/* Action Trigger */}
            {!isScanning && (
              <Button
                onClick={handleScan}
                className="w-full h-11 text-sm font-semibold shadow-md bg-gradient-to-r from-indigo-600 to-primary hover:from-indigo-500 hover:to-primary/95 transition-all text-white flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                AIで在留カードをスキャンして自動入力
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
