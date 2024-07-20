import React, { useState, useEffect } from "react";

interface ToastProps {
    message: string;
    type: "error" | "success";
    duration?: number;
}

export const Toast = ({ message, type, duration = 3000 }: ToastProps) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    if (!isVisible) return null;

    return (
        <div
            className={`fixed p-4 rounded-md shadow-md ${
                type === "error" ? "bg-red-500" : "bg-green-500"
            } text-white`}
        >
            {message}
        </div>
    );
};

interface ToastContainerProps {
    toasts: Toast[];
}

export const ToastContainer = ({ toasts }: ToastContainerProps) => {
    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] flex flex-col items-center">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                />
            ))}
        </div>
    );
};

export interface Toast {
    id: number;
    message: string;
    type: "error" | "success";
}
