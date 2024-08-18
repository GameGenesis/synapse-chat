"use client";

import React, { createContext, useContext, useReducer, useState } from "react";
import { Settings, Action, Artifact, CombinedMessage } from "@/lib/types";
import {
    DEFAULT_MODEL,
    DEFAULT_TEMPERATURE,
    DEFAULT_TOPP,
    DEFAULT_MAX_TOKENS,
    DEFAULT_MESSAGE_LIMIT,
    DEFAULT_ENABLE_ARTIFACTS,
    DEFAULT_ENABLE_INSTRUCTIONS,
    DEFAULT_ENABLE_SAFEGUARDS,
    DEFAULT_ENABLE_PASTE_TO_FILE,
    DEFAULT_ENABLE_MEMORY,
    DEFAULT_TOOL_CHOICE
} from "@/app/api/chat/config";

const initialState: Settings = {
    model: DEFAULT_MODEL,
    temperature: DEFAULT_TEMPERATURE,
    topP: DEFAULT_TOPP,
    maxTokens: DEFAULT_MAX_TOKENS,
    messageLimit: DEFAULT_MESSAGE_LIMIT,
    enableArtifacts: DEFAULT_ENABLE_ARTIFACTS,
    enableInstructions: DEFAULT_ENABLE_INSTRUCTIONS,
    enableSafeguards: DEFAULT_ENABLE_SAFEGUARDS,
    enablePasteToFile: DEFAULT_ENABLE_PASTE_TO_FILE,
    enableMemory: DEFAULT_ENABLE_MEMORY,
    toolChoice: DEFAULT_TOOL_CHOICE,
    customInstructions: ""
};

const reducer = (state: Settings, action: Action): Settings => {
    switch (action.type) {
        case "SET_MODEL":
            return { ...state, model: action.payload };
        case "SET_TEMPERATURE":
            return { ...state, temperature: action.payload };
        case "SET_MAX_TOKENS":
            return { ...state, maxTokens: action.payload };
        case "SET_TOP_P":
            return { ...state, topP: action.payload };
        case "SET_MESSAGE_LIMIT":
            return { ...state, messageLimit: action.payload };
        case "SET_ENABLE_ARTIFACTS":
            return { ...state, enableArtifacts: action.payload };
        case "SET_ENABLE_INSTRUCTIONS":
            return { ...state, enableInstructions: action.payload };
        case "SET_ENABLE_SAFEGUARDS":
            return { ...state, enableSafeguards: action.payload };
        case "SET_ENABLE_PASTE_TO_FILE":
            return { ...state, enablePasteToFile: action.payload };
        case "SET_ENABLE_MEMORY":
            return { ...state, enableMemory: action.payload };
        case "SET_CUSTOM_INSTRUCTIONS":
            return { ...state, customInstructions: action.payload };
        case "SET_TOOL_CHOICE":
            return { ...state, toolChoice: action.payload };
        default:
            return state;
    }
};

type ChatContextType = {
    state: Settings;
    dispatch: React.Dispatch<Action>;
    artifacts: Artifact[];
    setArtifacts: React.Dispatch<React.SetStateAction<Artifact[]>>;
    isArtifactsOpen: boolean;
    setIsArtifactsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isSettingsOpen: boolean;
    setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    combinedMessages: CombinedMessage[];
    setCombinedMessages: React.Dispatch<
        React.SetStateAction<CombinedMessage[]>
    >;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
    children
}) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [artifacts, setArtifacts] = useState<Artifact[]>([]);
    const [isArtifactsOpen, setIsArtifactsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [combinedMessages, setCombinedMessages] = useState<CombinedMessage[]>(
        []
    );

    return (
        <ChatContext.Provider
            value={{
                state,
                dispatch,
                artifacts,
                setArtifacts,
                isArtifactsOpen,
                setIsArtifactsOpen,
                isSettingsOpen,
                setIsSettingsOpen,
                combinedMessages,
                setCombinedMessages
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error("useChatContext must be used within a ChatProvider");
    }
    return context;
};
