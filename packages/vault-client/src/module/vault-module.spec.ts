import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IZLogger, ZLogLevel, ZLoggerSilent } from '@zthun/lumberjacky-log';
import { ZLoggerToken } from '@zthun/lumberjacky-nest';
import { ZVaultClientMemory } from 'src/client/vault-client-memory';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZVaultIntervalToken, ZVaultModule, ZVaultTimeoutToken, ZVaultToken } from './vault-module';

describe('ZVaultModule', () => {
  let _target: INestApplication<any>;
  let logger: IZLogger;
  const vault = new ZVaultClientMemory();

  const createTestTarget = async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [ZVaultModule] })
      .overrideProvider(ZVaultToken)
      .useValue(vault)
      .overrideProvider(ZVaultTimeoutToken)
      .useValue(10)
      .overrideProvider(ZVaultIntervalToken)
      .useValue(2)
      .overrideProvider(ZLoggerToken)
      .useValue(logger)
      .compile();

    _target = moduleFixture.createNestApplication();
    await _target.init();
    return _target;
  };

  beforeEach(() => {
    logger = new ZLoggerSilent();
    vi.spyOn(logger, 'log');

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
    expect(logger.log).not.toHaveBeenCalledWith(expect.objectContaining({ level: ZLogLevel.CATASTROPHE }));
  });

  it('should log if the vault service cannot be found', async () => {
    // Arrange.
    vault.healthy = false;
    // Act.
    await createTestTarget();
    // Assert.
    expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({ level: ZLogLevel.CATASTROPHE }));
  });
});
