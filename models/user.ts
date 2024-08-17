import mongoose, { Schema } from "mongoose";

const memorySchema: Schema = new Schema({
    content: { type: String, required: true },
    embedding: { type: [Number], required: true }
});

const settingsSchema: Schema = new Schema({
    model: { type: String, required: true },
    temperature: { type: Number, min: 0, max: 1, required: true },
    maxTokens: { type: Number, required: true },
    topP: { type: Number, min: 0, max: 1, required: true },
    messageLimit: { type: Number, required: true },
    enableArtifacts: { type: Boolean, required: true },
    enableInstructions: { type: Boolean, required: true },
    enableSafeguards: { type: Boolean, required: true },
    enablePasteToFile: { type: Boolean, required: true },
    enableMemory: { type: Boolean, required: true },
    toolChoice: { type: Schema.Types.Mixed, required: true },
    customInstructions: { type: String }
});

const userSchema: Schema = new Schema(
    {
        _id: { type: String, required: true },
        name: { type: String, default: "User", required: true },
        memories: { type: [memorySchema], required: true },
        settings: { type: settingsSchema, required: true },
        chats: [{ type: String, ref: "Chat" }]
    },
    { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
