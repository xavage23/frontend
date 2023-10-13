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
  // source: user.go
  
  export interface User {
    id: string;
    username: string;
    enabled: boolean;
    root: boolean;
  }