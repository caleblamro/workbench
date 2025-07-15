export interface SalesforceUser {
  id: string;
  display_name: string;
  nick_name: string;
  first_name: string;
  last_name: string;
  email: string;
  organization_id: string;
  username: string;
  user_type: string;
  language: string;
  locale: string;
  utcOffset: number;
  timezone: string;
  photos?: {
    picture?: string;
    thumbnail?: string;
  };
  urls?: {
    enterprise: string;
    metadata: string;
    partner: string;
    rest: string;
    sobjects: string;
    search: string;
    profile: string;
  };
}

export interface AuthSession {
  user: SalesforceUser;
  instanceUrl: string;
  isAuthenticated: boolean;
}

export interface SalesforceConnection {
  accessToken: string;
  instanceUrl: string;
  refreshToken?: string;
}
