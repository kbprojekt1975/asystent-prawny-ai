import React, { useState, useEffect } from 'react';
import { useUserCalendar } from '../hooks/useUserCalendar';
import { User } from 'firebase/auth';
import { BellIcon } from './Icons';

interface RemindersWidgetProps {
    user: User | null;
}

const RemindersWidget: React.FC<RemindersWidgetProps> = ({ user }) => {
    const {
        allEvents
    } = useUserCalendar(user);

    const today = new Date().toISOString().split('T')[0];

    // Global Notification Logic
    useEffect(() => {
        if (!allEvents.length) return;

        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        const todayEvents = allEvents.filter(e => !e.completed && e.date === today);

        if (todayEvents.length > 0 && Notification.permission === "granted") {
            todayEvents.forEach(ev => {
                const notifiedKey = `notified_${ev.id}`;
                if (!sessionStorage.getItem(notifiedKey)) {
                    new Notification(ev.type === 'deadline' ? "⚠️ WAŻNY TERMIN SĄDOWY!" : "🔔 Przypomnienie", {
                        body: `${ev.title}\n${ev.description || ''}`,
                        tag: ev.id // Prevent duplicate notifications on some systems
                    });
                    sessionStorage.setItem(notifiedKey, "true");
                }
            });
        }
    }, [allEvents, today]);

    return null; // Headless component
};

export default RemindersWidget;
