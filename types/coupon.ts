export interface UserCoupon {
    type: 'DISCOUNT' | 'PERCENTAGE'; // 假設 CouponType 映射到這兩種
    discountPrice?: number;         // 定額折扣金額 (DISCOUNT)
    couponPercentage?: number;      // 百分比折扣 (PERCENTAGE)
    maxPrice?: number;              // 最高可折抵金額
    minPrice?: number;              // 最低訂單門檻
    code: string;                   // 優惠碼
    used: boolean;                  // 是否已使用 (應為 false，因為 API 篩選了)
  }