import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { vi } from 'vitest';
import { Departamento, Emprestimo, Hardware, Usuario } from '../../entities';
import { AppModule } from '../../app.module';
import { TenantSubscriber } from '../../tenant/tenant.subscriber';

vi.mock('./data-source', async () => {
  const { DataSource: TypeOrmDataSource } = await import('typeorm');

  return {
    AppDataSource: new TypeOrmDataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [Departamento, Usuario, Hardware, Emprestimo],
      synchronize: true,
      logging: false,
    }),
  };
});

describe('DatabaseModule tenant subscriber wiring', () => {
  it('registers exactly one TenantSubscriber and resolves provider token', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    try {
      const dataSource = moduleRef.get(DataSource);
      const subscriberCountBefore = dataSource.subscribers.filter(
        (subscriber) => subscriber instanceof TenantSubscriber,
      ).length;
      const providerSubscriber = moduleRef.get(TenantSubscriber);
      const subscriberCountAfter = dataSource.subscribers.filter(
        (subscriber) => subscriber instanceof TenantSubscriber,
      ).length;

      expect(subscriberCountBefore).toBe(1);
      expect(providerSubscriber).toBeDefined();
      expect(providerSubscriber).toBeInstanceOf(TenantSubscriber);
      expect(subscriberCountAfter).toBe(1);
    } finally {
      await moduleRef.close();
    }
  });
});
