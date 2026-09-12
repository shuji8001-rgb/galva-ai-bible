'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Key, Cpu, CheckCircle2, ExternalLink, Shield } from 'lucide-react';

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiSettingsModal: React.FC<AiSettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-pro');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('galva_gemini_api_key') || '';
      const storedModel = localStorage.getItem('galva_gemini_model') || 'gemini-1.5-pro';
      setApiKey(storedKey);
      setSelectedModel(storedModel);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('galva_gemini_api_key', apiKey.trim());
      localStorage.setItem('galva_gemini_model', selectedModel);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 800);
    }
  };

  const handleClear = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('galva_gemini_api_key');
      setApiKey('');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-cyan-500/70 rounded-3xl max-w-lg w-full shadow-2xl shadow-cyan-500/20 overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Cpu className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>⚙️ AI知能モデル＆API設定</span>
              </h3>
              <p className="text-xs text-cyan-300/80">最上位Geminiモデルによる深層技術推論</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 本文 */}
        <div className="p-4 sm:p-6 space-y-4 text-xs text-slate-200 overflow-y-auto max-h-[75vh]">
          {/* モデル選択 */}
          <div className="space-y-2">
            <label className="font-bold text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>利用するAIモデルを選択</span>
            </label>
            <div className="space-y-2">
              <div
                onClick={() => setSelectedModel('gemini-1.5-pro')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                  selectedModel === 'gemini-1.5-pro'
                    ? 'bg-cyan-950/60 border-cyan-400 ring-1 ring-cyan-400/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">🧠 Gemini 1.5 Pro</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                      最高峰・最深思考
                    </span>
                  </div>
                  {selectedModel === 'gemini-1.5-pro' && (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  冶金学・化学反応（Fe-Zn相互拡散）・JIS規格の厳密な工学的分析に最も適した最上位知能モデル。
                </p>
              </div>

              <div
                onClick={() => setSelectedModel('gemini-2.0-flash')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                  selectedModel === 'gemini-2.0-flash'
                    ? 'bg-cyan-950/60 border-cyan-400 ring-1 ring-cyan-400/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">⚡ Gemini 2.0 Flash</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                      次世代・超高速
                    </span>
                  </div>
                  {selectedModel === 'gemini-2.0-flash' && (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  最新世代のフロンティアモデル。極めて高速な応答と高い言語理解力を両立。
                </p>
              </div>
            </div>
          </div>

          {/* Gemini API Key */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-100 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-cyan-400" />
                <span>Google AI Studio APIキー（任意）</span>
              </label>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[10px] text-rose-400 hover:underline"
                >
                  キーを削除
                </button>
              )}
            </div>

            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy... （未入力時は内蔵AIエンジンが自動稼働）"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 font-mono"
            />

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                APIキーはお使いのブラウザ内（LocalStorage）にのみ安全に保存されます。キーをお持ちでない場合も、内蔵のJISめっき推論エンジンが全問フル稼働します。
              </div>
            </div>

            <div className="text-right">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-cyan-400 hover:underline inline-flex items-center gap-1 font-semibold"
              >
                <span>無料のGemini APIキーを取得する（Google AI Studio）</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
          >
            閉じる
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>保存しました！</span>
              </>
            ) : (
              <span>設定を保存する</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
