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

const chatSchema: Schema = new Schema(
    {
        _id: { type: String, required: true },
        userId: { type: String, required: true, ref: 'User' },
        messages: { type: [messageSchema], required: true }
    },
    { timestamps: true }
);

const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);
export default Chat;
