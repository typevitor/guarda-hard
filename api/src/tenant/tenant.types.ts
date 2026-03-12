export type JwtTenantPayload = {
  sub: string;
  empresa_id: string;
};

export type TenantScopedEntity = {
  id: string;
  empresa_id: string;
};
