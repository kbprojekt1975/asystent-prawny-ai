import React, { useState, useRef, useEffect } from 'react';
import { MenuIcon, ProfileIcon } from './Icons';

interface HamburgerMenuProps {
    onProfileClick: () => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ onProfileClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuRef]);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors"
                aria-label="Otwórz menu"
                aria-expanded={isOpen}
            >
                <MenuIcon />
            </button>
            {isOpen && (
                <div 
                    className="absolute right-0 mt-2 w-56 origin-top-right bg-slate-800 border border-slate-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                >
                    <div className="py-1" role="none">
                        <button
                            onClick={() => {
                                onProfileClick();
                                setIsOpen(false);
                            }}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/50"
                            role="menuitem"
                        >
                            <ProfileIcon className="h-5 w-5" />
                            <span>Panel Użytkownika</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HamburgerMenu;
