// @flow
export type User = {
  avatarUrl: string,
  id: string,
  name: string,
  email: string,
  username: string,
  isAdmin?: boolean,
  isSuspended?: boolean,
};

export type Team = {
  id: string,
  name: string,
  avatarUrl: string,
};

export type NavigationNode = {
  id: string,
  title: string,
  url: string,
  children: Array<NavigationNode>,
};

export type Document = {
  collaborators: Array<User>,
  collection: Object,
  createdAt: string,
  createdBy: User,
  html: string,
  id: string,
  private: boolean,
  starred: boolean,
  views: number,
  team: string,
  text: string,
  title: string,
  updatedAt: string,
  updatedBy: User,
  url: string,
  views: number,
};

// Pagination response in an API call
export type Pagination = {
  limit: number,
  nextPath: string,
  offset: number,
};

// Pagination request params
export type PaginationParams = {
  limit?: number,
  offset?: number,
  sort?: string,
  direction?: 'ASC' | 'DESC',
};

export type ApiKey = {
  id: string,
  name: ?string,
  secret: string,
};

export type Subscription = {
  userCount: number,
  freeUserLimit: number,
  plan: 'free' | 'monthly' | 'yearly',
  planName?: string,
  status?: 'active' | 'canceled',
  unitAmount?: number,
  periodAmount?: number,
};
