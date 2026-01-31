import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ChecklistItem } from '../types';
import { CheckIcon, TrashIcon, PlusIcon, ListIcon } from './Icons';

interface ChecklistManagerProps {
    userId: string;
    caseId: string;
    isLocalOnly?: boolean;
}

const ChecklistManager: React.FC<ChecklistManagerProps> = ({ userId, caseId, isLocalOnly = false }) => {
    const [tasks, setTasks] = useState<ChecklistItem[]>([]);
    const [newTask, setNewTask] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId || !caseId || isLocalOnly) {
            setTasks([]);
            setIsLoading(false);
            return;
        }

        const checklistRef = collection(db, 'users', userId, 'chats', caseId, 'checklist');
        const q = query(checklistRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const checklistData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ChecklistItem));
            setTasks(checklistData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userId, caseId, isLocalOnly]);

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.trim() || !userId || !caseId || isLocalOnly) return;

        const checklistRef = collection(db, 'users', userId, 'chats', caseId, 'checklist');
        const newItemRef = doc(checklistRef);

        try {
            await setDoc(newItemRef, {
                text: newTask.trim(),
                completed: false,
                createdAt: serverTimestamp()
            });
            setNewTask('');
        } catch (error) {
            console.error("Error adding task:", error);
        }
    };

    const toggleTask = async (taskId: string, currentStatus: boolean) => {
        if (isLocalOnly) return;
        try {
            const taskRef = doc(db, 'users', userId, 'chats', caseId, 'checklist', taskId);
            await updateDoc(taskRef, {
                completed: !currentStatus
            });
        } catch (error) {
            console.error("Error toggling task:", error);
        }
    };

    const deleteTask = async (taskId: string) => {
        if (isLocalOnly) return;
        if (!confirm("Czy na pewno chcesz usunąć to zadanie?")) return;
        try {
            await deleteDoc(doc(db, 'users', userId, 'chats', caseId, 'checklist', taskId));
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    };

    if (isLoading) return <div className="animate-pulse h-32 bg-slate-800/50 rounded-xl"></div>;

    return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 shadow-xl mb-6">
            <div className="flex items-center gap-2 mb-4">
                <ListIcon className="h-4 w-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Lista Kontrolna (Checklist)</h3>
            </div>

            <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Dodaj nowe zadanie..."
                    className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <button
                    type="submit"
                    className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg transition-colors"
                >
                    <PlusIcon className="h-4 w-4" />
                </button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {tasks.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic text-center py-2">Brak zadań na liście.</p>
                ) : (
                    tasks.map(task => (
                        <div
                            key={task.id}
                            className="flex items-center justify-between gap-3 p-2 bg-slate-900/30 rounded-lg border border-slate-700/50 group hover:border-slate-600 transition-all"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <button
                                    onClick={() => toggleTask(task.id, task.completed)}
                                    className={`flex-shrink-0 w-5 h-5 rounded-md border transition-all flex items-center justify-center
                                        ${task.completed
                                            ? 'bg-cyan-600 border-cyan-600 text-white'
                                            : 'border-slate-600 hover:border-cyan-500 text-transparent hover:text-cyan-500/30'}`}
                                >
                                    <CheckIcon className="h-3 w-3" />
                                </button>
                                <span className={`text-xs truncate transition-all ${task.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                    {task.text}
                                </span>
                            </div>
                            <button
                                onClick={() => deleteTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"
                            >
                                <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ChecklistManager;
