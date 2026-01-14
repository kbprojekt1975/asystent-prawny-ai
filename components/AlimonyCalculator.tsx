import React, { useState, useEffect } from 'react';
import { XIcon, CalculatorIcon, RefreshIcon, CoinsIcon, HomeIcon, HeartPulseIcon, GraduationCapIcon, TrophyIcon, PalmtreeIcon, UserGroupIcon, ScaleIcon, BotIcon, SendIcon } from './Icons';
import { InfoIcon } from './InfoIcon';
import { LawArea } from '../types';

interface AlimonyCalculatorProps {
    isOpen: boolean;
    onClose: () => void;
    lawArea: LawArea | null;
}

// Interfaces for structured state
interface ChildCosts {
    food: number | '';
    housing: number | '';
    health: number | '';
    education: number | '';
    development: number | '';
    fun: number | '';
}

interface ParentParams {
    income: number | '';
    potential: number | ''; // Earning potential
    livingCosts: number | ''; // Own maintenance
    education: string; // Text field for "Education/Experience"
}

const AlimonyCalculator: React.FC<AlimonyCalculatorProps> = ({ isOpen, onClose, lawArea }) => {
    // --- State ---
    const [activeTab, setActiveTab] = useState<'costs' | 'finance' | 'care'>('costs');

    // 1. Costs
    const [costs, setCosts] = useState<ChildCosts>({
        food: '', housing: '', health: '', education: '', development: '', fun: ''
    });

    // 2. Parents' Situation
    const [parentMe, setParentMe] = useState<ParentParams>({ income: '', potential: '', livingCosts: '', education: '' });
    const [parentOther, setParentOther] = useState<ParentParams>({ income: '', potential: '', livingCosts: '', education: '' });

    // 3. Care & Extras
    const [daysWithOther, setDaysWithOther] = useState<number>(0); // Days/month with the other parent (obligor)
    const [isSharedCustody, setIsSharedCustody] = useState(false);
    const [otherDependents, setOtherDependents] = useState<number>(0);
    const [result, setResult] = useState<{ totalNeeds: number, shareMe: number, shareOther: number, suggestedAlimony: number } | null>(null);

    // --- Chat State ---
    const [showChat, setShowChat] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', content: string }[]>([
        { role: 'model', content: "Cześć! Jestem asystentem alimentacyjnym. Pomogę Ci wypełnić ten kalkulator. Opowiedz mi o swojej sytuacji finansowej i kosztach utrzymania dziecka, a ja uzupełnię odpowiednie pola." }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [calcSessionId] = useState(`alimony-calc-${Date.now()}`);

    // Safety check
    useEffect(() => {
        if (lawArea !== LawArea.Family && isOpen) {
            onClose();
        }
    }, [lawArea, isOpen, onClose]);

    // Handlers
    const handleCostChange = (field: keyof ChildCosts, value: string) => {
        setCosts(prev => ({ ...prev, [field]: value === '' ? '' : Number(value) }));
    };

    const handleParentChange = (who: 'me' | 'other', field: keyof ParentParams, value: string) => {
        const updater = who === 'me' ? setParentMe : setParentOther;
        updater(prev => ({ ...prev, [field]: field === 'education' ? value : (value === '' ? '' : Number(value)) }));
    };

    const calculate = () => {
        // 1. Total Child Needs
        const totalNeeds = (Number(costs.food) || 0) + (Number(costs.housing) || 0) +
            (Number(costs.health) || 0) + (Number(costs.education) || 0) +
            (Number(costs.development) || 0) + (Number(costs.fun) || 0);

        if (totalNeeds === 0) {
            setResult(null);
            return;
        }

        // 2. Financial Capacity
        // Use Potential if strictly higher than Income (common court logic: "możliwości zarobkowe"), 
        // but for safety in this calc we'll use Max(Income, Potential) or just Income if Potential not set.
        const capMeRaw = Math.max(Number(parentMe.income) || 0, Number(parentMe.potential) || 0);
        const capOtherRaw = Math.max(Number(parentOther.income) || 0, Number(parentOther.potential) || 0);

        // Adjust capacity for own living costs & other dependents
        // Simple heuristic: Capacity = (Income - LivingCosts) / (1 + 0.3 * OtherDependents)
        // Note: Courts calculate this more holistically, but this is an MVP heuristic.
        const livingMe = Number(parentMe.livingCosts) || 0;
        const livingOther = Number(parentOther.livingCosts) || 0;

        let capMe = Math.max(0, capMeRaw - livingMe);
        let capOther = Math.max(0, capOtherRaw - livingOther);

        // Other dependents adjustment (reduces capacity)
        if (otherDependents > 0) {
            capOther = capOther * (1 - (0.15 * otherDependents)); // Reduces capacity by ~15% per extra child
        }

        const totalCapacity = capMe + capOther;

        let shareMePct = 0.5;
        let shareOtherPct = 0.5;

        if (totalCapacity > 0) {
            shareMePct = capMe / totalCapacity;
            shareOtherPct = capOther / totalCapacity;
        }

        // 3. Care Scope Adjustment
        // Logic: Total Alimony = (TotalNeeds * ShareOtherPct) - (DirectCareCost during contact)
        // If shared custody (approx 15 days), alimony might be minimal or 0.

        let suggestedAlimony = totalNeeds * shareOtherPct;

        if (isSharedCustody) {
            // In pure shared custody, often no alimony if incomes similar.
            // If incomes differ, richer parent pays difference.
            // Simplification:
            suggestedAlimony = (totalNeeds * shareOtherPct) - (totalNeeds * 0.5);
            // If Other earns 70%, they pay (70% needs) - (50% needs covered directly because 50% time) = 20% needs transfer.
        } else {
            // Standard deduction for days spent
            // We assume ~40% of costs are variable (food, fun) and scale with days. 
            // Fixed costs (housing, school) generally stay with primary parent.
            const variablePortion = totalNeeds * 0.4;
            const dailyVariable = variablePortion / 30;
            const directCareCredit = dailyVariable * daysWithOther;

            suggestedAlimony -= directCareCredit;
        }

        // Cap alimony at Other's capacity (cannot exceed 60% of their net disposable typically)
        const absoluteMax = (Number(parentOther.income) || 0) * 0.6;
        if (suggestedAlimony > absoluteMax) suggestedAlimony = absoluteMax;
        if (suggestedAlimony < 0) suggestedAlimony = 0;

        setResult({
            totalNeeds,
            shareMe: shareMePct * 100,
            shareOther: shareOtherPct * 100,
            suggestedAlimony
        });
    };



    const resetChat = () => {
        setChatHistory([
            { role: 'model', content: "Cześć! Jestem asystentem alimentacyjnym. Pomogę Ci wypełnić ten kalkulator. Opowiedz mi o swojej sytuacji finansowej i kosztach utrzymania dziecka, a ja uzupełnię odpowiednie pola." }
        ]);
        setChatInput('');
        setIsTyping(false);
    };

    // --- Chat Logic ---
    const handleSendChat = async () => {
        if (!chatInput.trim()) return;

        const userMsg = chatInput.trim();
        setChatInput('');
        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsTyping(true);

        try {
            const { getLegalAdvice } = await import('../services/geminiService');
            const { InteractionMode, LawArea } = await import('../types');

            const currentFormState = JSON.stringify({
                costs,
                parentMe,
                parentOther,
                care: { daysWithOther, isSharedCustody, otherDependents }
            }, null, 2);

            const systemPrompt = `
Jesteś inteligentnym asystentem pomagającym wypełnić Kalkulator Alimentów.
Twoim zadaniem jest rozmowa z użytkownikiem, dopytanie o szczegóły finansowe i życiowe, a następnie zwrócenie danych w formacie JSON, który automatycznie uzupełni formularz.

AKTUALNIE WYPEŁNIONE DANE W FORMULARZU:
\`\`\`json
${currentFormState}
\`\`\`

Oto struktura danych, którą możesz zwrócić (JSON):
\`\`\`json
{
  "costs": {
    "food": number (wyżywienie),
    "housing": number (mieszkanie),
    "health": number (zdrowie),
    "education": number (edukacja),
    "development": number (rozwój/hobby),
    "fun": number (rozrywka)
  },
  "parentMe": {
    "income": number (dochód netto),
    "potential": number (możliwości zarobkowe),
    "livingCosts": number (koszty własne rodzica)
  },
  "parentOther": {
    "income": number,
    "potential": number,
    "livingCosts": number
  },
  "care": {
    "daysWithOther": number (dni w miesiącu u drugiego rodzica),
    "isSharedCustody": boolean,
    "otherDependents": number (inne dzieci)
  }
}
\`\`\`

ZASADY:
1. Bądź empatyczny i profesjonalny.
2. Jeśli użytkownik poda kwotę ogólną (np. "wydaję 3000 na dziecko"), dopytaj o szczegóły lub spróbuj oszacować podział, ale oznacz to w rozmowie.
3. Jeśli uzyskasz jakiekolwiek konkretne liczby, ZAWSZE dołącz blok JSON z tymi danymi do swojej odpowiedzi.
4. Możesz zwracać częściowy JSON (tylko to, co wiesz).
5. Nie nadpisuj pól, o których nie rozmawialiście (ale frontend to obsłuży).
6. Jeśli aktualne dane są już wypełnione, odnoś się do nich (np. "Widzę, że wyżywienie to już 500 zł. Czy to się zmieniło?").
`;

            const apiHistory: any[] = [
                { role: 'user', content: systemPrompt },
                ...chatHistory.map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: userMsg }
            ];

            const response = await getLegalAdvice(
                apiHistory,
                LawArea.Family,
                InteractionMode.Advice,
                "Kalkulator Alimentów - Asystent",
                false,
                undefined,
                calcSessionId
            );

            const aiText = response.text;

            const jsonMatch = aiText.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                try {
                    const data = JSON.parse(jsonMatch[1]);

                    if (data.costs) setCosts(prev => ({ ...prev, ...data.costs }));
                    if (data.parentMe) setParentMe(prev => ({ ...prev, ...data.parentMe }));
                    if (data.parentOther) setParentOther(prev => ({ ...prev, ...data.parentOther }));
                    if (data.care) {
                        if (data.care.daysWithOther !== undefined) setDaysWithOther(data.care.daysWithOther);
                        if (data.care.isSharedCustody !== undefined) setIsSharedCustody(data.care.isSharedCustody);
                        if (data.care.otherDependents !== undefined) setOtherDependents(data.care.otherDependents);
                    }

                    const cleanText = aiText.replace(/```json[\s\S]*?```/, '').trim();
                    setChatHistory(prev => [...prev, { role: 'model', content: cleanText || "Zaktualizowałem dane w kalkulatorze." }]);
                } catch (e) {
                    console.error("Failed to parse AI JSON", e);
                    setChatHistory(prev => [...prev, { role: 'model', content: aiText }]);
                }
            } else {
                setChatHistory(prev => [...prev, { role: 'model', content: aiText }]);
            }

        } catch (error) {
            console.error(error);
            setChatHistory(prev => [...prev, { role: 'model', content: "Przepraszam, wystąpił błąd połączenia z Asystentem." }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className={`bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full flex flex-col h-[90vh] overflow-hidden animate-slide-up transition-all duration-500 ${showChat ? 'max-w-6xl' : 'max-w-2xl'}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-700 bg-slate-800/50">
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex-shrink-0 flex items-center justify-center text-pink-400">
                            <CalculatorIcon className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg md:text-xl font-bold text-white truncate">Kalkulator Alimentów</h2>
                            <p className="text-[10px] md:text-xs text-pink-400 font-medium tracking-wide uppercase truncate">Symulacja wg art. 135 k.r.o.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 ml-2">
                        <button
                            onClick={() => setShowChat(!showChat)}
                            className={`flex items-center gap-2 px-3 py-2 md:px-4 rounded-lg transition-all ${showChat ? 'bg-violet-600 text-white' : 'bg-slate-800 text-violet-400 hover:bg-slate-700'}`}
                            title={showChat ? 'Ukryj Asystenta' : 'Zapytaj Asystenta'}
                        >
                            <BotIcon className="w-5 h-5 flex-shrink-0" />
                            <span className="hidden sm:inline">{showChat ? 'Ukryj' : 'Zapytaj'}<span className="hidden md:inline"> Asystenta</span></span>
                        </button>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
                    {/* Main Calculator Content */}
                    <div className={`flex flex-col overflow-hidden transition-all duration-300 ${showChat ? 'flex-[0.4] md:flex-1 border-b md:border-b-0 md:border-r border-slate-700' : 'flex-1'}`}>
                        {/* Tabs */}
                        <div className="flex border-b border-slate-700 bg-slate-800/30">
                            <button
                                onClick={() => setActiveTab('costs')}
                                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'costs' ? 'border-pink-500 text-pink-400 bg-pink-500/5' : 'border-transparent text-slate-400 hover:text-white'}`}
                            >
                                1. Koszty Dziecka
                            </button>
                            <button
                                onClick={() => setActiveTab('finance')}
                                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'finance' ? 'border-pink-500 text-pink-400 bg-pink-500/5' : 'border-transparent text-slate-400 hover:text-white'}`}
                            >
                                2. Finanse Rodziców
                            </button>
                            <button
                                onClick={() => setActiveTab('care')}
                                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'care' ? 'border-pink-500 text-pink-400 bg-pink-500/5' : 'border-transparent text-slate-400 hover:text-white'}`}
                            >
                                3. Opieka i Inne
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">

                            {/* SECTION 1: COSTS */}
                            {activeTab === 'costs' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                            <CoinsIcon className="w-5 h-5 text-yellow-400" />
                                            Miesięczne Koszty Utrzymania
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <CostInput
                                                label="Wyżywienie i chemia"
                                                sublabel="Jedzenie, środki higieny, kosmetyki"
                                                value={costs.food}
                                                onChange={(v) => handleCostChange('food', v)}
                                                icon={<HeartPulseIcon className="w-4 h-4" />}
                                            />
                                            <CostInput
                                                label="Mieszkanie (udział)"
                                                sublabel="Czynsz, prąd, woda (dzielone na osoby)"
                                                value={costs.housing}
                                                onChange={(v) => handleCostChange('housing', v)}
                                                icon={<HomeIcon className="w-4 h-4" />}
                                            />
                                            <CostInput
                                                label="Zdrowie"
                                                sublabel="Leki, wizyty, dentysta, okulary"
                                                value={costs.health}
                                                onChange={(v) => handleCostChange('health', v)}
                                                icon={<HeartPulseIcon className="w-4 h-4 text-red-400" />}
                                            />
                                            <CostInput
                                                label="Edukacja"
                                                sublabel="Szkoła, podręczniki, komitet"
                                                value={costs.education}
                                                onChange={(v) => handleCostChange('education', v)}
                                                icon={<GraduationCapIcon className="w-4 h-4" />}
                                            />
                                            <CostInput
                                                label="Rozwój"
                                                sublabel="Zajęcia dodatkowe, hobby, języki"
                                                value={costs.development}
                                                onChange={(v) => handleCostChange('development', v)}
                                                icon={<TrophyIcon className="w-4 h-4" />}
                                            />
                                            <CostInput
                                                label="Rozrywka"
                                                sublabel="Wakacje (podziel na 12), kino, zabawki"
                                                value={costs.fun}
                                                onChange={(v) => handleCostChange('fun', v)}
                                                icon={<PalmtreeIcon className="w-4 h-4" />}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setActiveTab('finance')}
                                            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
                                        >
                                            Dalej: Finanse &rarr;
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* SECTION 2: PARENTS */}
                            {activeTab === 'finance' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Parent Me */}
                                        <ParentSection
                                            title="Rodzic 1 (Ty)"
                                            vals={parentMe}
                                            onChange={(f, v) => handleParentChange('me', f, v)}
                                            color="text-emerald-400"
                                        />
                                        {/* Parent Other */}
                                        <ParentSection
                                            title="Rodzic 2 (Pozwany)"
                                            vals={parentOther}
                                            onChange={(f, v) => handleParentChange('other', f, v)}
                                            color="text-blue-400"
                                            isOther
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => setActiveTab('costs')}
                                            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium transition-colors"
                                        >
                                            &larr; Wróć
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('care')}
                                            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
                                        >
                                            Dalej: Opieka &rarr;
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* SECTION 3: CARE & EXTRAS */}
                            {activeTab === 'care' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 space-y-6">
                                        <h3 className="font-bold text-white flex items-center gap-2">
                                            <UserGroupIcon className="w-5 h-5 text-indigo-400" />
                                            Zakres Opieki i Kontakty
                                        </h3>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSharedCustody}
                                                    onChange={(e) => setIsSharedCustody(e.target.checked)}
                                                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-pink-600 focus:ring-pink-500"
                                                />
                                                <div>
                                                    <span className="text-white font-medium">Opieka Naprzemienna (Piecza Równoważna)</span>
                                                    <p className="text-xs text-slate-500">Zaznacz, jeśli dziecko spędza tyle samo czasu z każdym z rodziców.</p>
                                                </div>
                                            </div>

                                            {!isSharedCustody && (
                                                <div className="pl-8">
                                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                                        Liczba dni w miesiącu u drugiego rodzica (z noclegiem)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0" max="30"
                                                        value={daysWithOther}
                                                        onChange={(e) => setDaysWithOther(Number(e.target.value))}
                                                        className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                    <p className="text-xs text-slate-500 mt-1">Im więcej czasu dziecko spędza u rodzica, tym więcej kosztów bieżących on pokrywa bezpośrednio.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 space-y-4">
                                        <h3 className="font-bold text-white flex items-center gap-2">
                                            <ScaleIcon className="w-5 h-5 text-orange-400" />
                                            Dodatkowe Zmienne
                                        </h3>

                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="flex items-start gap-3 bg-slate-700/30 p-3 rounded-lg">
                                                <InfoIcon className="w-5 h-5 text-blue-400 mt-0.5" />
                                                <div>
                                                    <span className="text-sm font-bold text-white">Świadczenie 800+</span>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Zgodnie z prawem, świadczenie to <strong>nie pomniejsza</strong> obowiązku alimentacyjnego. Jest to dodatek ekstra dla dziecka, nie dla rodzica. Nasz kalkulator nie odejmuje tej kwoty od potrzeb.
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                                    Inne dzieci na utrzymaniu Rodzica 2 (zobowiązanego)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={otherDependents}
                                                    onChange={(e) => setOtherDependents(Number(e.target.value))}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none"
                                                    placeholder="np. 1"
                                                />
                                                <p className="text-xs text-slate-500 mt-1">Jeśli rodzic ma inne dzieci, jego możliwości zarobkowe są dzielone na więcej osób.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={calculate}
                                        className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <CalculatorIcon className="w-5 h-5" />
                                        OBLICZ ALIMENTY
                                    </button>
                                </div>
                            )}

                            {/* RESULTS AREA */}
                            {result && (
                                <div className="mt-8 p-6 bg-slate-800 border border-violet-500/30 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-500">
                                    <h3 className="text-lg font-bold text-white mb-6 text-center border-b border-slate-700 pb-4">Wynik Symulacji</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-center">
                                        <div>
                                            <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Potrzeby Dziecka</div>
                                            <div className="text-2xl font-black text-white">{Math.round(result.totalNeeds)} PLN</div>
                                        </div>
                                        <div>
                                            <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Udział Finansowy</div>
                                            <div className="font-bold text-emerald-400">{Math.round(result.shareMe)}% Ty</div>
                                            <div className="font-bold text-blue-400">{Math.round(result.shareOther)}% Druga Strona</div>
                                        </div>
                                        <div>
                                            <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Sugerowane Alimenty</div>
                                            <div className="text-3xl font-black text-pink-500">{Math.round(result.suggestedAlimony)} PLN</div>
                                        </div>
                                    </div>

                                    <div className="text-xs text-slate-500 italic text-center bg-slate-900/50 p-3 rounded-lg">
                                        Kwota uwzględnia potencjał zarobkowy obu stron oraz zakres osobistej opieki nad dzieckiem. Pamiętaj, że sąd bierze pod uwagę "stan faktyczny", który może różnić się od deklaracji.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Panel */}
                    {showChat && (
                        <div className="flex-[0.6] md:flex-1 bg-slate-950/50 flex flex-col border-t md:border-t-0 md:border-l border-slate-700 animate-in slide-in-from-bottom md:slide-in-from-right duration-300">
                            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                                <span className="text-sm font-bold text-violet-400 uppercase tracking-wider">Asystent Prawny AI</span>
                                <button
                                    onClick={resetChat}
                                    className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Wyczyść historię"
                                >
                                    <RefreshIcon className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                {chatHistory.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></div>
                                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-slate-900/50 border-t border-slate-800">
                                <form
                                    onSubmit={(e) => { e.preventDefault(); handleSendChat(); }}
                                    className="relative"
                                >
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Np. Zarabiam 4000 zł, a na jedzenie dla dziecka wydaję 600 zł..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:border-violet-500 outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!chatInput.trim() || isTyping}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-lg transition-colors text-white"
                                    >
                                        <SendIcon className="w-4 h-4" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Subcomponents for cleaner code ---

const CostInput = ({ label, sublabel, value, onChange, icon }: { label: string, sublabel?: string, value: number | '', onChange: (v: string) => void, icon?: React.ReactNode }) => (
    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/30 hover:border-slate-600 transition-colors group">
        <label className="block text-sm font-medium text-slate-200 mb-1 flex items-center gap-2">
            {icon && <span className="opacity-70 group-hover:opacity-100 transition-opacity">{icon}</span>}
            {label}
        </label>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-all outline-none"
            placeholder="0 PLN"
        />
        {sublabel && <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">{sublabel}</p>}
    </div>
);

const ParentSection = ({ title, vals, onChange, color, isOther }: { title: string, vals: ParentParams, onChange: (f: keyof ParentParams, v: string) => void, color: string, isOther?: boolean }) => (
    <div className="space-y-4">
        <h3 className={`font-bold ${color} text-lg border-b border-slate-700/50 pb-2`}>{title}</h3>

        <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Dochód Netto (na rękę)</label>
            <input
                type="number"
                value={vals.income}
                onChange={(e) => onChange('income', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-pink-500 outline-none"
                placeholder="np. 5000"
            />
        </div>

        <div>
            <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase text-slate-500">Możliwości Zarobkowe</label>
                <span className="text-[10px] text-slate-400 italic">Ile mógłby zarobić?</span>
            </div>
            <input
                type="number"
                value={vals.potential}
                onChange={(e) => onChange('potential', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-pink-500 outline-none"
                placeholder="np. 7000 (jeśli ukrywa dochód)"
            />
        </div>

        <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Wykształcenie / Umiejętności</label>
            <textarea
                value={vals.education}
                onChange={(e) => onChange('education', e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-pink-500 outline-none resize-none"
                placeholder="np. Wyższe techniczne, angielski C1, prawo jazdy..."
            />
        </div>

        <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Koszty własne rodzica</label>
            <input
                type="number"
                value={vals.livingCosts}
                onChange={(e) => onChange('livingCosts', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-pink-500 outline-none"
                placeholder="np. 2500 (mieszkanie, leki)"
            />
        </div>
    </div>
);

export default AlimonyCalculator;
