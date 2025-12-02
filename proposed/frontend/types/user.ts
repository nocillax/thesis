// User types
export interface User {
  wallet_address: string;
  username: string;
  email: string;
  registration_date: string;
  is_authorized: boolean;
  is_admin: boolean;
}

export interface RegisterUserDTO {
  username: string;
  email: string;
  is_admin: boolean;
}
