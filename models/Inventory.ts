import mongoose, { Schema, Document } from "mongoose";

export interface IInventory extends Document {
  itemId: string;
  itemName: string;
  stockCount: number;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>(
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
      default: 0,
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
InventorySchema.index({ itemId: 1 });

const Inventory = mongoose.models.Inventory || mongoose.model<IInventory>("Inventory", InventorySchema);

export default Inventory;
