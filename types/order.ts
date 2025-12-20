export interface OrderHistoryVendor {
  id: string; // ✨ 新增 Vendor ID
  name: string; // 供應商名稱
}

export interface OrderHistoryProduct {
  name: string;
  coverId: string | null;
  // ✨ 移除 vendor: OrderHistoryVendor;
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
  updatedAt: string; // ✨ 新增：更新時間
  vendor: OrderHistoryVendor; // ✨ 變動：Vendor 移到訂單層級
  products: OrderHistoryProductItem[]; // 產品概覽列表
}

// 實際 API 回傳的結構
export interface GetOrderHistoryResponse {
  orders: OrderHistoryItem[];
}

// --- 訂單詳情 (來自 [orderId].get.ts) ---

export interface OrderDetailVendor {
  id: string;
  name: string;
}

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

// ✨ 變動：OrderDetailResponse 現在包含完整的訂單資訊
export interface OrderDetailResponse {
  id: string;
  price: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  couponId: string | null; // 根據後端回傳判斷是否為 null
  vendor: OrderDetailVendor;
  products: OrderDetailProductItem[];
}
