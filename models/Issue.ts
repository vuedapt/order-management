import mongoose, { Schema, Document, Model } from "mongoose";

export interface IIssue extends Document {
  row: number;
  itemId: string;
  error: string;
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IssueSchema = new Schema<IIssue>(
  {
    row: {
      type: Number,
      required: true,
    },
    itemId: {
      type: String,
      required: false,
      default: "",
    },
    error: {
      type: String,
      required: true,
    },
    resolved: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
IssueSchema.index({ resolved: 1, createdAt: -1 });

const Issue: Model<IIssue> =
  mongoose.models.Issue || mongoose.model<IIssue>("Issue", IssueSchema);

export default Issue;

