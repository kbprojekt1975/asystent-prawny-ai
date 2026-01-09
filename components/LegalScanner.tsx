import React, { useState, useRef } from 'react';
import { SparklesIcon, FileTextIcon, ClockIcon, ArrowRightIcon, UploadIcon, XIcon, CompassIcon } from './Icons';
import { scanLegalDocument } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { InfoIcon } from './InfoIcon';
import HelpModal from './HelpModal';

interface LegalScannerProps {
    onScanComplete: (chatId: string) => void;
    onBack: () => void;
}

const LegalScanner: React.FC<LegalScannerProps> = ({ onScanComplete, onBack }) => {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError("Plik jest za duży. Maksymalny rozmiar to 10MB.");
                return;
            }
            setFile(selectedFile);
            setError(null);

            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (prev) => setPreviewUrl(prev.target?.result as string);
                reader.readAsDataURL(selectedFile);
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1];
                resolve(base64String);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleScan = async () => {
        if (!file) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            const base64 = await convertToBase64(file);
            const response = await scanLegalDocument(base64, file.type);

            if (response && response.chatId) {
                onScanComplete(response.chatId);
            } else {
                setError("Nie udało się przeanalizować dokumentu. Spróbuj ponownie.");
            }
        } catch (err: any) {
            console.error("Scan error:", err);
            setError("Wystąpił błąd podczas komunikacji z AI.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
                >
                    <XIcon className="w-6 h-6" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <CompassIcon className="w-6 h-6 text-cyan-400" />
                        Skaner "Z Prawniczego na Nasze"
                    </h2>
                    <p className="text-slate-400">Prześlij zdjęcie lub PDF pisma, którego nie rozumiesz.</p>
                </div>
                <div className="ml-auto">
                    <InfoIcon onClick={() => setIsHelpOpen(true)} />
                </div>
            </div>

            <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-2xl p-8 mb-8 text-center transition-all hover:border-cyan-500/50">
                {!file ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer group"
                    >
                        <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-all">
                            <UploadIcon className="w-8 h-8" />
                        </div>
                        <p className="text-lg font-semibold text-white mb-2">Kliknij, aby wybrać dokument</p>
                        <p className="text-slate-400 text-sm">Zdjęcie (JPG, PNG) lub PDF do 10MB</p>
                    </div>
                ) : (
                    <div className="relative">
                        {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg mb-4" />
                        ) : (
                            <div className="w-32 h-32 bg-slate-700/50 rounded-xl flex flex-col items-center justify-center mx-auto mb-4">
                                <FileTextIcon className="w-12 h-12 text-slate-400" />
                                <span className="text-xs text-slate-400 mt-2">PDF</span>
                            </div>
                        )}
                        <p className="text-white font-medium mb-1 truncate px-4">{file.name}</p>
                        <button
                            onClick={() => { setFile(null); setPreviewUrl(null); }}
                            className="text-red-400 hover:text-red-300 text-sm font-semibold"
                        >
                            Usuń i wybierz inny
                        </button>
                    </div>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf"
                    className="hidden"
                />
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm">
                    {error}
                </div>
            )}

            <button
                onClick={handleScan}
                disabled={!file || isAnalyzing}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${!file || isAnalyzing
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20'
                    }`}
            >
                {isAnalyzing ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" />
                        Analizuję dokument (to może potrwać chwilę)...
                    </>
                ) : (
                    <>
                        <SparklesIcon className="w-5 h-5" />
                        Rozpocznij analizę Gemini
                    </>
                )}
            </button>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
                <div className="text-center">
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2 text-cyan-400">
                        <span className="font-bold">1</span>
                    </div>
                    <p className="text-xs text-slate-300 font-semibold">Tłumaczenie</p>
                    <p className="text-[10px] text-slate-500">Maksymalnie 3 proste zdania wyjaśnienia.</p>
                </div>
                <div className="text-center">
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2 text-cyan-400">
                        <span className="font-bold">2</span>
                    </div>
                    <p className="text-xs text-slate-300 font-semibold">Terminy</p>
                    <p className="text-[10px] text-slate-500">Wyłapanie najważniejszych deadline'ów.</p>
                </div>
                <div className="text-center">
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2 text-cyan-400">
                        <span className="font-bold">3</span>
                    </div>
                    <p className="text-xs text-slate-300 font-semibold">Działanie</p>
                    <p className="text-[10px] text-slate-500">Trzy konkretne kroki co zrobić dalej.</p>
                </div>
            </div>

            <HelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                title='Skaner "Z Prawniczego na Nasze"'
            >
                <div className="space-y-4 text-sm">
                    <p>
                        Otrzymałeś pismo z sądu lub urzędu i nic z niego nie rozumiesz? To narzędzie jest dla Ciebie.
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>
                            <strong>Tłumaczenie:</strong> AI przeanalizuje skomplikowany prawniczy żargon i streści pismo w 3-4 prostych zdaniach.
                        </li>
                        <li>
                            <strong>Terminy:</strong> System wykryje wszystkie kluczowe daty (np. "7 dni na odpowiedź") i wyróżni je.
                        </li>
                        <li>
                            <strong>Plan Działania:</strong> Otrzymasz jasną instrukcję "krok po kroku", co musisz teraz zrobić.
                        </li>
                    </ul>
                    <p className="italic text-slate-500 mt-2">
                        Obsługujemy pliki PDF oraz zdjęcia (JPG, PNG). Maksymalny rozmiar pliku to 10MB.
                    </p>
                </div>
            </HelpModal>
        </div>
    );
};

export default LegalScanner;
