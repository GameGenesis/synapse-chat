import mongoose, { Schema } from "mongoose";

export const artifactSchema: Schema = new Schema(
    {
        identifier: { type: String, required: true },
        type: { type: String },
        language: { type: String },
        title: { type: String },
        content: { type: String },
        shareableURL: { type: String }
    },
    { timestamps: true }
);

const Artifact =
    mongoose.models.Artifact || mongoose.model("Artifact", artifactSchema);
export default Artifact;
