/**
 * 模拟金流公司 SDK
 * 模拟 TapPay 或其他支付网关的功能
 */

import { randomBytes, createHash } from 'crypto';

// 支付卡片资料接口
export interface CardInfo {
  cardNumber: string; // 完整卡号 (例如: 4242424242424242)
  cardHolderName: string; // 持卡人姓名
  expiryMonth: number; // 到期月份 (1-12)
  expiryYear: number; // 到期年份 (例如: 2027)
  cvv: string; // CVV 安全码
}

// Prime Token 响应
export interface PrimeResponse {
  success: boolean;
  prime: string; // Prime token (用于后续交易)
  cardInfo: {
    binCode: string; // 卡号前6位
    lastFour: string; // 卡号后4位
    type: 'VISA' | 'MASTERCARD' | 'JCB' | 'AMERICAN_EXPRESS';
    issuer: string | null; // 发卡银行
  };
  message?: string;
}

// 绑定卡片响应 (Pay by Prime)
export interface BindCardResponse {
  success: boolean;
  data: {
    recTradeId: string; // 交易记录ID
    customerId: string; // 客户ID
    eventId: string; // 事件ID
    token: string; // 卡片 Token (用于后续快速支付)
    key: string; // 加密密钥
    identifier: string; // 标识符
    cardInfo: {
      binCode: string;
      lastFour: string;
      type: 'VISA' | 'MASTERCARD' | 'JCB' | 'AMERICAN_EXPRESS';
      issuer: string | null;
    };
  };
  message?: string;
}

// 使用 Token 支付响应
export interface PayByTokenResponse {
  success: boolean;
  data: {
    transactionId: string; // 交易ID
    orderId: string; // 订单ID
    amount: number; // 交易金额
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    paidAt: Date; // 支付时间
  };
  message?: string;
}

/**
 * 模拟金流 SDK 类
 */
export class MockPaymentSDK {
  private appId: string;
  private appKey: string;

  constructor(appId: string = 'mock_app_id', appKey: string = 'mock_app_key') {
    this.appId = appId;
    this.appKey = appKey;
  }

  /**
   * 步骤1: 获取 Prime Token
   * 前端通常会调用这个方法，将卡片信息转换为 Prime Token
   */
  async getPrime(cardInfo: CardInfo): Promise<PrimeResponse> {
    try {
      // 验证卡号
      if (!this.validateCardNumber(cardInfo.cardNumber)) {
        return {
          success: false,
          prime: '',
          cardInfo: {
            binCode: '',
            lastFour: '',
            type: 'VISA',
            issuer: null,
          },
          message: '无效的卡号',
        };
      }

      // 验证 CVV
      if (cardInfo.cvv.length < 3 || cardInfo.cvv.length > 4) {
        return {
          success: false,
          prime: '',
          cardInfo: {
            binCode: '',
            lastFour: '',
            type: 'VISA',
            issuer: null,
          },
          message: '无效的 CVV',
        };
      }

      // 生成 Prime Token (模拟加密的卡片信息)
      const prime = this.generatePrime(cardInfo);
      const cardType = this.getCardType(cardInfo.cardNumber);
      const binCode = cardInfo.cardNumber.substring(0, 6);
      const lastFour = cardInfo.cardNumber.substring(
        cardInfo.cardNumber.length - 4,
      );
      const issuer = this.getIssuer(binCode);

      return {
        success: true,
        prime,
        cardInfo: {
          binCode,
          lastFour,
          type: cardType,
          issuer,
        },
      };
    } catch (error) {
      return {
        success: false,
        prime: '',
        cardInfo: {
          binCode: '',
          lastFour: '',
          type: 'VISA',
          issuer: null,
        },
        message: error instanceof Error ? error.message : '获取 Prime 失败',
      };
    }
  }

  /**
   * 步骤2: 绑定卡片 (Pay by Prime)
   * 后端调用，使用 Prime Token 绑定卡片并获取可重复使用的 Card Token
   */
  async bindCard(prime: string, userId: string): Promise<BindCardResponse> {
    try {
      // 模拟延迟
      await this.delay(500);

      // 解析 Prime 获取卡片信息
      const cardInfo = this.parsePrime(prime);

      // 生成各种 ID 和 Token
      const recTradeId = this.generateRecTradeId();
      const customerId = userId;
      const eventId = this.generateUUID();
      const token = this.generateToken();
      const key = this.generateKey();
      const identifier = this.generateIdentifier();

      return {
        success: true,
        data: {
          recTradeId,
          customerId,
          eventId,
          token,
          key,
          identifier,
          cardInfo: {
            binCode: cardInfo.binCode,
            lastFour: cardInfo.lastFour,
            type: cardInfo.type,
            issuer: cardInfo.issuer,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        data: {
          recTradeId: '',
          customerId: '',
          eventId: '',
          token: '',
          key: '',
          identifier: '',
          cardInfo: {
            binCode: '',
            lastFour: '',
            type: 'VISA',
            issuer: null,
          },
        },
        message: error instanceof Error ? error.message : '绑定卡片失败',
      };
    }
  }

  /**
   * 步骤3: 使用 Token 支付
   * 后续交易可以直接使用 Card Token，不需要再输入卡号
   */
  async payByToken(
    token: string,
    orderId: string,
    amount: number,
  ): Promise<PayByTokenResponse> {
    try {
      // 模拟延迟
      await this.delay(800);

      // 模拟支付成功（90%成功率）
      const isSuccess = Math.random() > 0.1;

      if (!isSuccess) {
        return {
          success: false,
          data: {
            transactionId: '',
            orderId,
            amount,
            status: 'FAILED',
            paidAt: new Date(),
          },
          message: '支付失败，请稍后重试',
        };
      }

      const transactionId = this.generateTransactionId();

      return {
        success: true,
        data: {
          transactionId,
          orderId,
          amount,
          status: 'SUCCESS',
          paidAt: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        data: {
          transactionId: '',
          orderId,
          amount,
          status: 'FAILED',
          paidAt: new Date(),
        },
        message: error instanceof Error ? error.message : '支付失败',
      };
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 验证卡号（使用 Luhn 算法）
   */
  private validateCardNumber(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cleaned)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * 根据卡号判断卡片类型
   */
  private getCardType(
    cardNumber: string,
  ): 'VISA' | 'MASTERCARD' | 'JCB' | 'AMERICAN_EXPRESS' {
    const cleaned = cardNumber.replace(/\s/g, '');

    if (cleaned.startsWith('4')) return 'VISA';
    if (cleaned.startsWith('5') || cleaned.startsWith('2')) return 'MASTERCARD';
    if (cleaned.startsWith('35')) return 'JCB';
    if (cleaned.startsWith('34') || cleaned.startsWith('37'))
      return 'AMERICAN_EXPRESS';

    return 'VISA'; // 默认
  }

  /**
   * 根据 BIN 获取发卡银行（模拟）
   */
  private getIssuer(binCode: string): string | null {
    const issuerMap: Record<string, string> = {
      '424242': '測試銀行 (Test Bank)',
      '411111': '國泰世華銀行 (Cathay Bank)',
      '555555': '玉山銀行 (E.SUN Bank)',
      '378282': '中國信託 (CTBC Bank)',
      '601100': '台新銀行 (Taishin Bank)',
    };

    return issuerMap[binCode] || null;
  }

  /**
   * 生成 Prime Token
   */
  private generatePrime(cardInfo: CardInfo): string {
    const data = JSON.stringify({
      cardNumber: cardInfo.cardNumber,
      expiryMonth: cardInfo.expiryMonth,
      expiryYear: cardInfo.expiryYear,
      cvv: cardInfo.cvv,
      timestamp: Date.now(),
    });

    return `prime_${createHash('sha256').update(data).digest('hex')}`;
  }

  /**
   * 解析 Prime（模拟）
   */
  private parsePrime(_prime: string) {
    // 在真实环境中，这会解密 Prime 获取卡片信息
    // 这里我们模拟返回一些数据
    return {
      binCode: '424242',
      lastFour: '4242',
      type: 'VISA' as const,
      issuer: '測試銀行 (Test Bank)',
    };
  }

  /**
   * 生成交易记录ID（格式: D20251227xxxxx）
   */
  private generateRecTradeId(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = randomBytes(3)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 6);
    return `D${dateStr}${random}`;
  }

  /**
   * 生成 Card Token
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * 生成 Key
   */
  private generateKey(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * 生成 Identifier
   */
  private generateIdentifier(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * 生成交易ID
   */
  private generateTransactionId(): string {
    return `TXN${Date.now()}${randomBytes(4).toString('hex')}`;
  }

  /**
   * 生成 UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * 延迟函数（模拟网络请求）
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// 导出单例实例
export const mockPaymentSDK = new MockPaymentSDK();

// 导出一些测试用的卡号
export const TEST_CARDS = {
  VISA_SUCCESS: {
    cardNumber: '4242424242424242',
    cardHolderName: 'Test User',
    expiryMonth: 12,
    expiryYear: 2027,
    cvv: '123',
  },
  MASTERCARD_SUCCESS: {
    cardNumber: '5555555555554444',
    cardHolderName: 'Test User',
    expiryMonth: 11,
    expiryYear: 2028,
    cvv: '456',
  },
  VISA_INVALID: {
    cardNumber: '4242424242424241', // 无效的卡号
    cardHolderName: 'Test User',
    expiryMonth: 12,
    expiryYear: 2027,
    cvv: '123',
  },
};
