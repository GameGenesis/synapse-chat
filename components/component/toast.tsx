import React, { useState, useEffect } from "react";

interface ToastProps {
    message: string;
    type: "error" | "success";
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
    message,
    type,
    duration = 3000
}) => {
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
            className={`fixed top-4 right-4 p-4 rounded-md shadow-md ${
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

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center">
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
