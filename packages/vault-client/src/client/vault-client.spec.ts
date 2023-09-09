import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';
import { Mocked, beforeEach, describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { ZConfigEntryBuilder } from '../config/config-entry';
import { ZVaultClient } from './vault-client';

describe('VaultClient', () => {
  let proxy: Mocked<ClientProxy>;

  function createTestTarget() {
    return new ZVaultClient(proxy);
  }

  beforeEach(() => {
    proxy = mock<ClientProxy>();
    proxy.send.mockReturnValue(of(null));
  });

  describe('Read', () => {
    it('gets by scope and key.', async () => {
      // Arrange.
      const scope = 'common';
      const key = 'domain';
      const target = createTestTarget();
      // Act.
      await target.read(scope, key);
      // Assert.
      expect(proxy.send).toHaveBeenCalledWith({ cmd: 'read' }, { scope, key });
    });

    it('gets by entry.', async () => {
      // Arrange.
      const entry = new ZConfigEntryBuilder(null).scope('common').key('domain').build();
      const target = createTestTarget();
      // Act.
      await target.get(entry);
      // Assert.
      expect(proxy.send).toHaveBeenCalledWith({ cmd: 'get' }, { entry });
    });
  });

  describe('Write', () => {
    it('puts by entry.', async () => {
      // Arrange.
      const entry = new ZConfigEntryBuilder('local.zthunworks.com').scope('common').key('domain').build();
      const target = createTestTarget();
      // Act.
      await target.put(entry);
      // Assert.
      expect(proxy.send).toHaveBeenCalledWith({ cmd: 'put' }, { entry });
    });
  });

  describe('Health', () => {
    it('should get the health.', async () => {
      // Arrange.
      const target = createTestTarget();
      // Act.
      await target.health();
      // Assert.
      expect(proxy.send).toHaveBeenCalledWith({ cmd: 'health' }, {});
    });
  });
});
