import mongoose, { Schema } from "mongoose";

const artifactSchema: Schema = new Schema(
    {
        identifier: { type: String, required: true },
        type: { type: String, required: true },
        title: { type: String, required: true },
        content: { type: String, required: true },
        userId: { type: String, required: true }
    },
    { timestamps: true }
);

const Artifact =
    mongoose.models.Artifact || mongoose.model("Artifact", artifactSchema);
export default Artifact;
