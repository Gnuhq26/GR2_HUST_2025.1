import { StoreInfo } from '../common/decorators/current-store.decorator';

declare global {
  namespace Express {
    interface Request {
      currentStore?: StoreInfo;
      user?: {
        UserID: number;
        Email: string;
        FullName: string | null;
        Phone: string | null;
        Address: string | null;
        CreatedAt: Date;
        stores?: Array<StoreInfo>;
      };
    }
  }
}

export {};
