import mongoose, { Schema } from "mongoose";

const artifactSchema: Schema = new Schema({
    identifier: { type: String, required: true },
    type: { type: String },
    language: { type: String },
    title: { type: String },
    content: { type: String }
});

const stateSchema: Schema = new Schema({
    content: { type: String },
    artifact: { type: artifactSchema },
    timestamp: { type: Number, required: true }
});

const messageSchema: Schema = new Schema({
    id: { type: String, required: true },
    role: { type: String, required: true },
    originalContent: { type: String },
    processedContent: { type: String },
    attachments: { type: Schema.Types.Mixed },
    artifact: { type: artifactSchema },
    model: { type: String },
    toolInvocations: { type: [Schema.Types.Mixed] },
    completionTokens: { type: Number },
    promptTokens: { type: Number },
    totalTokens: { type: Number },
    finishReason: { type: String },
    states: { type: [stateSchema] }
});

const settingsSchema: Schema = new Schema({
    model: { type: String, required: true },
    temperature: { type: Number, min: 0, max: 1, required: true },
    topP: { type: Number, min: 0, max: 1, required: true },
    maxTokens: { type: Number, required: true },
    enableArtifacts: { type: Boolean, required: true },
    enableInstructions: { type: Boolean, required: true },
    enableSafeguards: { type: Boolean, required: true },
    enablePasteToFile: { type: Boolean, required: true },
    toolChoice: { type: Schema.Types.Mixed, required: true },
    customInstructions: { type: String }
});

const chatSchema: Schema = new Schema(
    {
        messages: { type: [messageSchema], required: true },
        settings: { type: settingsSchema, required: true }
    },
    { timestamps: true }
);

const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);
export default Chat;
