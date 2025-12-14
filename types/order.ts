export interface Order {
  id: string;
  orderId: string;
  itemId: string;
  itemName: string;
  clientName: string;
  stockCount: number;
  date: string;
  time: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderFormData {
  itemId: string;
  itemName: string;
  clientName: string;
  stockCount: number;
}

