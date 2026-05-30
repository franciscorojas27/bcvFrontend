export interface RateList {
  list: CointRate[];
  bcv_date: string;
}

export interface BinanceRate {
  price: string | number;
  type_value?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface RateGap {
  value?: string | number;
  value_porcentual?: string | number;
  binance_rate?: BinanceRate | null;
}

export interface CointRate {
  symbol: string;
  price: string | number;
  change_pct?: string | number;
  gap?: RateGap | null;
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
