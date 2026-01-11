import mongoose, { Schema, Document } from "mongoose";

export interface IBilling extends Document {
  billId: string;
  orderId: mongoose.Types.ObjectId;
  orderOrderId: string;
  itemId: string;
  itemName: string;
  clientName: string;
  billedStockCount: number;
  price: number;
  totalAmount: number;
  date: string;
  time: string;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BillingSchema = new Schema<IBilling>(
  {
    billId: {
      type: String,
      required: true, // Required for new entries
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    orderOrderId: {
      type: String,
      required: true,
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
    billedStockCount: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
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
BillingSchema.index({ billId: 1 });
BillingSchema.index({ orderId: 1 });
BillingSchema.index({ orderOrderId: 1 });
BillingSchema.index({ itemId: 1 });
BillingSchema.index({ clientName: 1 });
BillingSchema.index({ createdAt: -1 });

const Billing = mongoose.models.Billing || mongoose.model<IBilling>("Billing", BillingSchema);

export default Billing;
