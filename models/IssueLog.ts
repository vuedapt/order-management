import mongoose, { Schema, Document } from "mongoose";

export interface IIssueLog extends Document {
  row: number;
  itemId?: string;
  error: string;
  resolved: boolean;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IssueLogSchema = new Schema<IIssueLog>(
  {
    row: {
      type: Number,
      required: true,
    },
    itemId: {
      type: String,
    },
    error: {
      type: String,
      required: true,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
IssueLogSchema.index({ resolved: 1 });
IssueLogSchema.index({ createdAt: -1 });

const IssueLog = mongoose.models.IssueLog || mongoose.model<IIssueLog>("IssueLog", IssueLogSchema);

export default IssueLog;
