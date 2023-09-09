import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ZVaultClientMemory } from 'src/client/vault-client-memory';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { ZVaultIntervalToken, ZVaultModule, ZVaultTimeoutToken, ZVaultToken } from './vault-module';

describe('ZVaultModule', () => {
  let _target: INestApplication<any>;
  const vault = new ZVaultClientMemory();

  const createTestTarget = async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [ZVaultModule] })
      .overrideProvider(ZVaultToken)
      .useValue(vault)
      .overrideProvider(ZVaultTimeoutToken)
      .useValue(10)
      .overrideProvider(ZVaultIntervalToken)
      .useValue(2)
      .compile();

    _target = moduleFixture.createNestApplication();
    await _target.init();
    return _target;
  };

  beforeEach(() => {
    vault.healthy = true;
  });

  afterEach(async () => {
    await _target?.close();
  });

  it('should wait for the vault to become healthy', async () => {
    // Arrange.
    // Act.
    await createTestTarget();
    // Assert.
    // expect(logger.log).not.toHaveBeenCalledWith(expect.objectContaining({level: ZLogLevel.Catastrophe }))
  });

  it('should log if the vault service cannot be found', async () => {
    // Arrange.
    vault.healthy = false;
    /*
    const expected: string = await vault
      .health()
      .then((w) => String(w))
      .catch((e: Error) => e.message);
    */

    // Act.
    await createTestTarget();
    // Assert.
    // expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({ level: ZLogLevel.Catastrophe, message: expected }))
  });
});
