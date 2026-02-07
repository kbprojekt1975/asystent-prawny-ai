import React, { useEffect, useRef } from 'react';

const LegalPatternBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            const rect = canvas.parentElement?.getBoundingClientRect();
            if (rect) {
                canvas.width = rect.width;
                canvas.height = rect.height;
            }
        };
        resize();
        window.addEventListener('resize', resize);

        let animationFrameId: number;
        let time = 0;

        const draw = () => {
            time += 0.005;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Set drawing styles
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)'; // Very subtle cyan
            ctx.lineWidth = 1;

            // Draw a geometric pattern (delicate grid with nodes)
            const spacing = 40;
            const rows = Math.ceil(canvas.height / spacing) + 1;
            const cols = Math.ceil(canvas.width / spacing) + 1;

            ctx.beginPath();
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const x = i * spacing;
                    const y = j * spacing;
                    
                    // Subtle movement based on time
                    const offsetX = Math.sin(time + i * 0.5) * 5;
                    const offsetY = Math.cos(time + j * 0.5) * 5;

                    // Draw dots/nodes
                    ctx.fillStyle = `rgba(6, 182, 212, ${0.1 + Math.sin(time + i + j) * 0.05})`;
                    ctx.beginPath();
                    ctx.arc(x + offsetX, y + offsetY, 1, 0, Math.PI * 2);
                    ctx.fill();

                    // Occasionally draw connecting lines
                    if (Math.sin(time * 0.5 + i) > 0.8) {
                        ctx.moveTo(x + offsetX, y + offsetY);
                        ctx.lineTo((i + 1) * spacing + Math.sin(time + (i+1) * 0.5) * 5, y + offsetY);
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full opacity-60 pointer-events-none"
        />
    );
};

export default LegalPatternBackground;
