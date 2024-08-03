import React from "react";
import { AlertCircle } from "lucide-react";

interface Props {
    title: string;
    message: string;
}

export const ErrorMessage = ({ title, message }: Props) => {
    return (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
            <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <h3 className="text-red-800 font-medium">{title}</h3>
            </div>
            <p className="mt-2 text-sm text-red-700">{message}</p>
        </div>
    );
};
