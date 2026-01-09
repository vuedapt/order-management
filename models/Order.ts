import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  itemId: string;
  itemName: string;
  stockCount: number;
  billedStockCount: number;
}

export type OrderStatus = "partially_completed" | "uncompleted" | "completed";

export interface IOrder extends Document {
  orderId: string;
  clientName: string;
  items: IOrderItem[];
  date: string;
  time: string;
  status: OrderStatus;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  itemId: { type: String, required: true },
  itemName: { type: String, required: true },
  stockCount: { type: Number, required: true, min: 0 },
  billedStockCount: { type: Number, required: true, default: 0, min: 0 },
});

const OrderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: "Order must have at least one item",
      },
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["partially_completed", "uncompleted", "completed"],
      default: "uncompleted",
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

// Indexes (orderId already has an index from unique: true)
OrderSchema.index({ clientName: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
