import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStock extends Document {
  itemId: string;
  itemName: string;
  stockCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const StockSchema = new Schema<IStock>(
  {
    itemId: {
      type: String,
      required: true,
      unique: true,
    },
    itemName: {
      type: String,
      required: true,
    },
    stockCount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
StockSchema.index({ itemId: 1 });
StockSchema.index({ itemName: 1 });

const Stock: Model<IStock> =
  mongoose.models.Stock || mongoose.model<IStock>("Stock", StockSchema);

export default Stock;

