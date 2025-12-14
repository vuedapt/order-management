import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrder extends Document {
  orderId: string;
  itemId: string;
  itemName: string;
  clientName: string;
  stockCount: number;
  date: string;
  time: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    itemId: {
      type: String,
      required: true,
    },
    itemName: {
      type: String,
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    stockCount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
OrderSchema.index({ orderId: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ itemId: 1 });
OrderSchema.index({ itemName: 1 });
OrderSchema.index({ clientName: 1 });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;

