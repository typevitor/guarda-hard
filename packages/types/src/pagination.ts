export type PaginatedResult<TItem> = {
  items: TItem[];
  page: number;
  pageSize: 10;
  total: number;
  totalPages: number;
};

export type PaginationQuery = {
  page: number;
  pageSize: 10;
};

export type EmprestimoStatus = 'open' | 'returned';
