import React, { useState, useRef, useEffect } from 'react';

interface DraggableButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    id: string; // Used for persisting position
    initialBottom?: number;
    initialRight?: number;
}

const DraggableButton: React.FC<DraggableButtonProps> = ({
    children,
    onClick,
    className,
    id,
    initialBottom = 96,
    initialRight = 16,
}) => {
    // Sanitize and load position from localStorage
    const [position, setPosition] = useState(() => {
        try {
            const saved = localStorage.getItem(`draggable_pos_${id}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (typeof parsed.x === 'number' && typeof parsed.y === 'number' && !isNaN(parsed.x) && !isNaN(parsed.y)) {
                    // Sanity check: if it's way outside common screen bounds, reset it
                    if (Math.abs(parsed.x) > 5000 || Math.abs(parsed.y) > 5000) return { x: 0, y: 0 };
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('Failed to load draggable position', e);
        }
        return { x: 0, y: 0 };
    });

    const [isDragging, setIsDragging] = useState(false);
    const offset = useRef({ x: 0, y: 0 });
    const startClientPos = useRef({ x: 0, y: 0 });
    const hasMoved = useRef(false);
    const dragThreshold = 5;

    useEffect(() => {
        if (!isNaN(position.x) && !isNaN(position.y)) {
            localStorage.setItem(`draggable_pos_${id}`, JSON.stringify(position));
        }
    }, [position, id]);

    const handlePointerDown = (e: React.PointerEvent) => {
        // Record starting position relative to the element's top-left
        offset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
        startClientPos.current = { x: e.clientX, y: e.clientY };

        setIsDragging(true);
        hasMoved.current = false;

        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;

        const newX = e.clientX - offset.current.x;
        const newY = e.clientY - offset.current.y;

        const dist = Math.sqrt(
            Math.pow(e.clientX - startClientPos.current.x, 2) +
            Math.pow(e.clientY - startClientPos.current.y, 2)
        );

        if (dist > dragThreshold) {
            hasMoved.current = true;
        }

        setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging) return;

        setIsDragging(false);
        const target = e.currentTarget as HTMLElement;
        target.releasePointerCapture(e.pointerId);

        // If it was a short tap without significant movement, it's a click
        if (!hasMoved.current) {
            onClick?.();
        }
    };

    // Style for the container which handles positioning and drag logic
    const containerStyle: React.CSSProperties = {
        position: 'fixed',
        bottom: `${initialBottom}px`,
        right: `${initialRight}px`,
        transform: `translate(${position.x}px, ${position.y}px)`,
        touchAction: 'none',
        zIndex: 9999, // Force it to be on top of everything
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto'
    };

    return (
        <div
            style={containerStyle}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            <button
                type="button"
                className={className}
                style={{
                    position: 'relative', // Context for absolute children like the "NEW" badge
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    pointerEvents: 'none' // The wrapper handles input for better stability
                }}
            >
                {children}
            </button>
        </div>
    );
};

export default DraggableButton;
