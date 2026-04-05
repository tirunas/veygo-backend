import { HasherService } from '../../../src/modules/auth/hasher.service';

describe('HasherService', () => {
  let service: HasherService;

  beforeEach(() => {
    service = new HasherService(1); // rounds=1 for speed
  });

  it('hashes a password', async () => {
    const hash = await service.hash('secret123');
    expect(hash).not.toBe('secret123');
    expect(hash.startsWith('$2b$')).toBe(true);
  });

  it('verifies correct password', async () => {
    const hash = await service.hash('secret123');
    expect(await service.verify('secret123', hash)).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await service.hash('secret123');
    expect(await service.verify('wrong', hash)).toBe(false);
  });
});
