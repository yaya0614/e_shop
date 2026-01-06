export type CouponType = 'DISCOUNT' | 'COUPON';
export interface UserCoupon {
  code: string;
  used: boolean;
  type: CouponType; // 使用修正後的型別

  // 折扣資訊 (optional 是因為不同 type 只會存在其中一個)
  discountPrice?: number;
  couponPercentage?: number;

  // 使用條件
  maxPrice?: number;
  minPrice?: number;
}
