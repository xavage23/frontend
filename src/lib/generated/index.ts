// Code generated by tygo. DO NOT EDIT.

//////////
// source: assets.go

export interface AssetMetadata {
  exists: boolean;
  path?: string;
  default_path: string;
  type?: string;
  size?: number /* int64 */;
  last_modified?: string /* RFC3339 */;
  errors?: string[];
}

//////////
// source: auth.go

export interface UserLogin {
  username: string;
  password: string;
}
export interface UserLoginResponse {
  user_id: string;
  token: string;
}

//////////
// source: common.go

/**
 * This represents a IBL xavagebb API Error
 */
export interface ApiError {
  context?: { [key: string]: string};
  message: string;
}
/**
 * Paged result common
 */
export interface PagedResult<T extends any> {
  count: number /* uint64 */;
  per_page: number /* uint64 */;
  results: T;
}

//////////
// source: game.go

export interface Game {
  id: string;
  code: string;
  enabled: boolean;
  trading_enabled: boolean;
  name: string;
  created_at: string /* RFC3339 */;
  current_price_index: number /* int */;
  initial_balance: number /* int64 */;
  game_number: number /* int */;
  old_stocks_carry_over: boolean;
}
export interface GameJoinRequest {
  game_code: string;
}
export interface GameJoinResponse {
  id: string;
  new: boolean;
}
export interface GameUser {
  id: string;
  user_id: string;
  game_id: string;
  game: Game;
  initial_balance: number /* int64 */;
  current_balance: number /* int64 */;
  created_at: string /* RFC3339 */;
}

//////////
// source: stock.go

export interface StockRatio {
  name: string;
  ratio: number /* float64 */;
}
export interface PriorPricePoint {
  prices: number /* int64 */[];
  game: Game;
}
export interface Stock {
  id: string;
  game_id: string;
  ticker: string;
  company_name: string;
  current_price: number /* int64 */;
  known_prices: number /* int64 */[];
  prior_prices: PriorPricePoint[];
  created_at: string /* RFC3339 */;
  ratios?: (StockRatio | undefined)[];
}
export interface StockList {
  stocks: (Stock | undefined)[];
  price_index: number /* int */;
}

//////////
// source: transact.go

export interface CreateTransaction {
  stock_id: string;
  amount: number /* int64 */;
  action: string;
}
export interface UserTransaction {
  id: string;
  user_id: string;
  game_id: string;
  origin_game_id: string;
  user?: User;
  stock_id: string;
  stock?: Stock;
  price_index: number /* int */;
  sale_price: number /* int64 */;
  amount: number /* int64 */;
  action: string;
  past: boolean;
  created_at: string /* RFC3339 */;
}

//////////
// source: user.go

export interface User {
  id: string;
  username: string;
  enabled: boolean;
  root: boolean;
  created_at: string /* RFC3339 */;
}
