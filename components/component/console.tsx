import React, { useState, useRef, useEffect } from "react";

interface ConsoleProps {
    logs: string[];
    onClear: () => void;
}

const MIN_HEIGHT = 75;
const MAX_HEIGHT = 500;

export const Console: React.FC<ConsoleProps> = ({ logs, onClear }) => {
    const [height, setHeight] = useState(150);
    const [isDragging, setIsDragging] = useState(false);
    const consoleRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging && consoleRef.current) {
                const newHeight = window.innerHeight - e.clientY;
                setHeight(
                    Math.max(MIN_HEIGHT, Math.min(newHeight, MAX_HEIGHT))
                );
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging]);

    if (logs.length === 0) {
        return null;
    }

    return (
        <div
            ref={consoleRef}
            className="bg-gray-900 text-gray-200 font-mono text-sm"
            style={{ height: `${height}px` }}
        >
            <div
                className="h-2 bg-gray-800 cursor-ns-resize"
                onMouseDown={handleMouseDown}
            >
                <div className="w-8 h-1 mx-auto bg-gray-600 rounded-full" />
            </div>
            <div
                className="p-4 overflow-y-auto"
                style={{ height: `${height - 8}px` }}
            >
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                        <span className="mr-2 text-gray-400">
                            Console Messages
                        </span>
                        <span className="px-2 py-1 text-xs bg-gray-700 rounded-full">
                            {logs.length}
                        </span>
                    </div>
                    <button
                        onClick={onClear}
                        className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg"
                    >
                        Clear
                    </button>
                </div>
                {logs.map((log, index) => (
                    <div key={index} className="py-1">
                        <span className="text-blue-400">{">"}</span> {log}
                    </div>
                ))}
            </div>
        </div>
    );
};
