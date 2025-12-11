// --- 訂單列表 (來自 index.get.ts) ---
export interface OrderHistoryVendor {
  name: string; // 供應商名稱
}

export interface OrderHistoryProduct {
  name: string;
  coverId: string | null;
  vendor: OrderHistoryVendor;
}

export interface OrderHistoryProductItem {
  quantity: number;
  product: OrderHistoryProduct;
}

export interface OrderHistoryItem {
  id: string; // 訂單 ID
  price: number; // 訂單總價
  status: string; // 訂單狀態 (e.g., 'RECEIVED')
  createdAt: string; // 創建時間 (ISO 8601)
  products: OrderHistoryProductItem[]; // 產品概覽列表
}

// 實際 API 回傳的結構
export interface GetOrderHistoryResponse {
  orders: OrderHistoryItem[];
}

// --- 訂單詳情 (來自 [orderId].get.ts) ---

export interface OrderDetailProduct {
  id: string;
  name: string;
  description: string;
  price: number; // 商品單價
  coverId: string;
}

export interface OrderDetailProductItem {
  quantity: number;
  product: OrderDetailProduct;
}

// 注意: [orderId].get.ts 的返回結構就是 OrderDetail 的資料
export interface OrderDetailResponse {
  id: string;
  products: OrderDetailProductItem[];
  // 註：後端回傳 Order 整個物件，可能還包含 status, price 等欄位，但我們主要關注 products 詳情。
}
