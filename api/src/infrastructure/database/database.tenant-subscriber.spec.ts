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
  it('registers TenantSubscriber in data source subscribers', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    try {
      const dataSource = moduleRef.get(DataSource);
      const subscriberExists = dataSource.subscribers.some(
        (subscriber) => subscriber instanceof TenantSubscriber,
      );

      expect(subscriberExists).toBe(true);
    } finally {
      await moduleRef.close();
    }
  });
});
