import React from 'react';
import { DownloadIcon, SparklesIcon } from './Icons';

interface LegalHandoverProps {
    questions: string[];
    caseTitle: string;
}

const LegalHandover: React.FC<LegalHandoverProps> = ({ questions, caseTitle }) => {
    const handleExportPDF = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const questionsHtml = questions.map((q, i) => `<li><strong>Pytanie ${i + 1}:</strong> ${q}</li>`).join('');

        printWindow.document.write(`
      <html>
        <head>
          <title>Przygotowanie do rozmowy - ${caseTitle}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            h1 { color: #0891b2; border-bottom: 2px solid #0891b2; padding-bottom: 10px; }
            .meta { color: #666; font-size: 0.9em; margin-bottom: 30px; }
            ul { list-style-type: none; padding: 0; }
            li { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
            strong { color: #0f172a; display: block; margin-bottom: 5px; }
            .footer { margin-top: 50px; font-size: 0.8em; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Przygotowanie do rozmowy: ${caseTitle}</h1>
          <p class="meta">Wygenerowano przez e-Asystenta Prawnego AI</p>
          <p>Zadaj te pytania swojemu prawnikowi lub urzędnikowi, aby upewnić się, że Twoja sprawa jest prowadzona rzetelnie:</p>
          <ul>${questionsHtml}</ul>
          <div class="footer">Niniejszy dokument ma charakter pomocniczy i nie stanowi porady prawnej.</div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
        printWindow.document.close();
    };

    return (
        <div className="bg-gradient-to-br from-cyan-900/40 to-slate-900/60 rounded-2xl p-6 border border-cyan-500/30 backdrop-blur-md shadow-lg shadow-cyan-500/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-cyan-400" />
                        Przygotuj mnie do rozmowy
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">5 kluczowych pytań, które warto zadać ekspertowi</p>
                </div>

                <button
                    onClick={handleExportPDF}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-cyan-600/20 whitespace-nowrap"
                >
                    <DownloadIcon className="w-5 h-5" />
                    Eksportuj do PDF
                </button>
            </div>

            <div className="space-y-3">
                {questions.map((q, index) => (
                    <div key={index} className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-cyan-500/20 transition-all hover:bg-white/10 group">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                            {index + 1}
                        </div>
                        <p className="text-slate-200 text-sm md:text-base leading-relaxed">
                            {q}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-xs text-amber-200/70 italic text-center">
                    Wskazówka: Zadając te pytania, pokazujesz, że rozumiesz proces i oczekujesz merytorycznego podejścia.
                </p>
            </div>
        </div>
    );
};

export default LegalHandover;
