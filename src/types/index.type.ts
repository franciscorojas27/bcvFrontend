export interface RateList {
  list: CointRate[];
  bcv_date: string;
}

export interface CointRate {
  symbol: string;
  price: string;
}
