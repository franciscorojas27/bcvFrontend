export interface RateList {
  list: CointRate[];
  bcv_date: string;
}

export interface CointRate {
  symbol: string;
  price: string | number;
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
