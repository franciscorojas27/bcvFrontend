export interface RateList {
  list: CointRate[];
  bcv_date: string;
}

export interface CointRate {
  symbol: string;
  price: string | number;
  change_pct?: string | number;
}

export interface RateReport {
  bcv_date: string;
  fetched_at?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;
  ID?: number;
  list: CointRate[];
}

export type TradeSignalAction = "HOLD" | "SELL" | "BUY";

export interface TradeSignal {
  accuracy_rate: number;
  action: TradeSignalAction;
  created_at: string;
  id: number;
  key_factors: string[];
  rationale: string;
  win_points: number;
}
