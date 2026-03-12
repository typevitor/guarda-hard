export class MissingTenantContextError extends Error {
  constructor() {
    super('Tenant context is missing empresa_id');
    this.name = 'MissingTenantContextError';
  }
}

export class InvalidTenantPayloadError extends Error {
  constructor() {
    super('JWT payload does not contain empresa_id');
    this.name = 'InvalidTenantPayloadError';
  }
}

export class CrossTenantAccessError extends Error {
  constructor() {
    super('Cross-tenant operation blocked');
    this.name = 'CrossTenantAccessError';
  }
}
