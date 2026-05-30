import React, { useRef, useEffect } from 'react';

interface GraphingCalculatorProps {
    functionStr: string;
}

const GraphingCalculator: React.FC<GraphingCalculatorProps> = ({ functionStr }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Resize canvas to fit container
        const { width, height } = container.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;

        const xMin = -10, xMax = 10;
        const yMin = -10, yMax = 10;

        // --- Transformation Functions ---
        const toCanvasX = (x: number) => (x - xMin) / (xMax - xMin) * width;
        const toCanvasY = (y: number) => height - (y - yMin) / (yMax - yMin) * height;

        // --- Drawing Functions ---
        const drawGrid = () => {
            ctx.strokeStyle = '#4b5563'; // gray-600
            ctx.lineWidth = 0.5;

            // Vertical lines
            for (let i = Math.ceil(xMin); i <= Math.floor(xMax); i++) {
                if (i === 0) continue;
                ctx.beginPath();
                ctx.moveTo(toCanvasX(i), 0);
                ctx.lineTo(toCanvasX(i), height);
                ctx.stroke();
            }
            // Horizontal lines
            for (let i = Math.ceil(yMin); i <= Math.floor(yMax); i++) {
                if (i === 0) continue;
                ctx.beginPath();
                ctx.moveTo(0, toCanvasY(i));
                ctx.lineTo(width, toCanvasY(i));
                ctx.stroke();
            }
        };

        const drawAxes = () => {
            ctx.strokeStyle = '#9ca3af'; // gray-400
            ctx.lineWidth = 1;
            ctx.fillStyle = '#9ca3af';
            ctx.font = '12px sans-serif';

            // X-Axis
            ctx.beginPath();
            ctx.moveTo(0, toCanvasY(0));
            ctx.lineTo(width, toCanvasY(0));
            ctx.stroke();

            // Y-Axis
            ctx.beginPath();
            ctx.moveTo(toCanvasX(0), 0);
            ctx.lineTo(toCanvasX(0), height);
            ctx.stroke();
            
            // Labels
            for (let i = Math.ceil(xMin); i <= Math.floor(xMax); i++) {
                 if (i !== 0) ctx.fillText(i.toString(), toCanvasX(i) + 2, toCanvasY(0) + 12);
            }
             for (let i = Math.ceil(yMin); i <= Math.floor(yMax); i++) {
                 if (i !== 0) ctx.fillText(i.toString(), toCanvasX(0) + 4, toCanvasY(i) + 4);
            }
        };

        const plotFunction = (fn: (x: number) => number) => {
            ctx.strokeStyle = '#818cf8'; // indigo-400
            ctx.lineWidth = 2;
            ctx.beginPath();

            let firstPoint = true;

            for (let px = 0; px < width; px++) {
                const x = xMin + (px / width) * (xMax - xMin);
                try {
                    const y = fn(x);
                    if (isFinite(y)) {
                        const canvasY = toCanvasY(y);
                         if (firstPoint) {
                            ctx.moveTo(px, canvasY);
                            firstPoint = false;
                        } else {
                            ctx.lineTo(px, canvasY);
                        }
                    } else {
                        // Handle discontinuities (like in tan(x)) by starting a new path
                        firstPoint = true; 
                    }
                } catch (e) {
                     // Invalid math operation, just skip this point
                     firstPoint = true;
                }
            }
            ctx.stroke();
        };

        // --- Execution ---
        ctx.clearRect(0, 0, width, height);
        drawGrid();
        drawAxes();
        
        try {
            // Sanitize and prepare function string
            // Replace ^ with ** for exponentiation
            // Add Math. prefix to functions like sin, cos, etc.
            const safeFuncStr = functionStr
                .replace(/\^/g, '**')
                .replace(/sin/g, 'Math.sin')
                .replace(/cos/g, 'Math.cos')
                .replace(/tan/g, 'Math.tan')
                .replace(/sqrt/g, 'Math.sqrt')
                .replace(/pi/g, 'Math.PI');
            
            // This is generally unsafe, but for a controlled environment it's the simplest way to evaluate a math string
            const func = new Function('x', `return ${safeFuncStr}`);
            plotFunction(func as (x: number) => number);
        } catch (e) {
            console.error("Error parsing or plotting function:", e);
            ctx.fillStyle = 'red';
            ctx.font = '16px sans-serif';
            ctx.fillText("Could not plot function. Check the syntax.", 20, 40);
        }

    }, [functionStr, containerRef]); // Rerun when function or container size changes

    return (
        <div ref={containerRef} className="w-full h-full min-h-[400px]">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default GraphingCalculator;