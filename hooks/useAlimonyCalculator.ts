import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LawArea, InteractionMode } from '../types';

export interface ChildCosts {
    food: number | '';
    housing: number | '';
    health: number | '';
    education: number | '';
    development: number | '';
    fun: number | '';
}

export interface ParentParams {
    income: number | '';
    potential: number | '';
    livingCosts: number | '';
    education: string;
}

export const useAlimonyCalculator = () => {
    const { t, i18n } = useTranslation();
    const [activeTab, setActiveTab] = useState<'costs' | 'finance' | 'care'>('costs');

    // 1. Costs
    const [costs, setCosts] = useState<ChildCosts>({
        food: '', housing: '', health: '', education: '', development: '', fun: ''
    });

    // 2. Parents' Situation
    const [parentMe, setParentMe] = useState<ParentParams>({ income: '', potential: '', livingCosts: '', education: '' });
    const [parentOther, setParentOther] = useState<ParentParams>({ income: '', potential: '', livingCosts: '', education: '' });

    // 3. Care & Extras
    const [daysWithOther, setDaysWithOther] = useState<number>(0);
    const [isSharedCustody, setIsSharedCustody] = useState(false);
    const [otherDependents, setOtherDependents] = useState<number>(0);
    const [result, setResult] = useState<{ totalNeeds: number, shareMe: number, shareOther: number, suggestedAlimony: number } | null>(null);

    // --- Chat State ---
    const [showChat, setShowChat] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', content: string }[]>([
        { role: 'model', content: t('alimonyCalculator.chat.welcome') }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [calcSessionId] = useState(`alimony-calc-${Date.now()}`);

    const handleCostChange = (field: keyof ChildCosts, value: string) => {
        setCosts(prev => ({ ...prev, [field]: value === '' ? '' : Number(value) }));
    };

    const handleParentChange = (who: 'me' | 'other', field: keyof ParentParams, value: string) => {
        const updater = who === 'me' ? setParentMe : setParentOther;
        updater(prev => ({ ...prev, [field]: field === 'education' ? value : (value === '' ? '' : Number(value)) }));
    };

    const calculate = () => {
        const totalNeeds = (Number(costs.food) || 0) + (Number(costs.housing) || 0) +
            (Number(costs.health) || 0) + (Number(costs.education) || 0) +
            (Number(costs.development) || 0) + (Number(costs.fun) || 0);

        if (totalNeeds === 0) {
            setResult(null);
            return;
        }

        const capMeRaw = Math.max(Number(parentMe.income) || 0, Number(parentMe.potential) || 0);
        const capOtherRaw = Math.max(Number(parentOther.income) || 0, Number(parentOther.potential) || 0);

        const livingMe = Number(parentMe.livingCosts) || 0;
        const livingOther = Number(parentOther.livingCosts) || 0;

        let capMe = Math.max(0, capMeRaw - livingMe);
        let capOther = Math.max(0, capOtherRaw - livingOther);

        if (otherDependents > 0) {
            capOther = capOther * (1 - (0.15 * otherDependents));
        }

        const totalCapacity = capMe + capOther;
        let shareMePct = 0.5;
        let shareOtherPct = 0.5;

        if (totalCapacity > 0) {
            shareMePct = capMe / totalCapacity;
            shareOtherPct = capOther / totalCapacity;
        }

        let suggestedAlimony = totalNeeds * shareOtherPct;

        if (isSharedCustody) {
            suggestedAlimony = (totalNeeds * shareOtherPct) - (totalNeeds * 0.5);
        } else {
            const variablePortion = totalNeeds * 0.4;
            const dailyVariable = variablePortion / 30;
            const directCareCredit = dailyVariable * daysWithOther;
            suggestedAlimony -= directCareCredit;
        }

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
            { role: 'model', content: t('alimonyCalculator.chat.welcome') }
        ]);
        setChatInput('');
        setIsTyping(false);
    };

    const handleSendChat = async () => {
        if (!chatInput.trim()) return;

        const userMsg = chatInput.trim();
        setChatInput('');
        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsTyping(true);

        try {
            const { getLegalAdvice } = await import('../services/geminiService');

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
                calcSessionId,
                i18n.language
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
                    setChatHistory(prev => [...prev, { role: 'model', content: cleanText || t('alimonyCalculator.chat.updated') }]);
                } catch (e) {
                    console.error("Failed to parse AI JSON", e);
                    setChatHistory(prev => [...prev, { role: 'model', content: aiText }]);
                }
            } else {
                setChatHistory(prev => [...prev, { role: 'model', content: aiText }]);
            }
        } catch (error) {
            console.error(error);
            setChatHistory(prev => [...prev, { role: 'model', content: t('alimonyCalculator.chat.error') }]);
        } finally {
            setIsTyping(false);
        }
    };

    return {
        activeTab, setActiveTab,
        costs, setCosts,
        parentMe, setParentMe,
        parentOther, setParentOther,
        daysWithOther, setDaysWithOther,
        isSharedCustody, setIsSharedCustody,
        otherDependents, setOtherDependents,
        result, calculate,
        showChat, setShowChat,
        chatInput, setChatInput,
        chatHistory, isTyping,
        resetChat, handleSendChat,
        handleCostChange, handleParentChange
    };
};
