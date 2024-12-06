
export interface IUser {
  _id: string;
  username: string;
  walletAddress: string;
  tokenBalance: number;
  created_at: Date;
  role: number;
  avatar?: string | null | undefined;
  referrerId?: string | null | undefined;
}