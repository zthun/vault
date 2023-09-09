import { IZDatabaseDocument, ZDatabaseOptionsBuilder } from '@zthun/dalmart-db';
import { IZDatabaseServer, ZDatabaseServerDocument } from '@zthun/dalmart-memory';
import { IZConfigEntry, ZConfigEntryBuilder } from '@zthun/vault-client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ZVaultCollections } from '../database/vault-database';
import { ZVaultService } from './vault-service';

describe('ZVaultService', () => {
  let mongo: IZDatabaseServer<IZDatabaseDocument>;
  let dal: IZDatabaseDocument;
  let configA: IZConfigEntry;
  let configB: IZConfigEntry;

  function createTestTarget() {
    return new ZVaultService(dal);
  }

  beforeAll(async () => {
    const options = new ZDatabaseOptionsBuilder().database('vault-service-test').build();
    mongo = new ZDatabaseServerDocument();
    dal = await mongo.start(options);
  });

  afterAll(async () => {
    await mongo.stop();
  });

  beforeEach(async () => {
    configA = new ZConfigEntryBuilder('zthunworks.com').scope('common').key('domain').build();
    configB = new ZConfigEntryBuilder(null).scope('authentication.secrets').key('jwt').generate().build();

    [configA, configB] = await dal.create(ZVaultCollections.Configs, [configA, configB]);
  });

  afterEach(async () => {
    await dal.delete(ZVaultCollections.Configs);
  });

  describe('Get', () => {
    describe('by key', () => {
      it('will retrieve the existing value.', async () => {
        // Arrange
        const target = createTestTarget();
        const expected = new ZConfigEntryBuilder(null).copy(configA).build();
        configA.value = 'not-correct';
        // Act
        const actual = await target.get({ entry: configA });
        // Assert
        expect(actual).toEqual(expected);
      });

      it('will add the default value if the key does not exist.', async () => {
        // Arrange
        const target = createTestTarget();
        const expected = true;
        const cfg = new ZConfigEntryBuilder(expected).scope('common').key('secure').build();
        // Act
        await target.get({ entry: cfg });
        cfg.value = !expected;
        const actual = await target.get({ entry: cfg });
        // Assert
        expect(actual.value).toEqual(expected);
      });

      it('is synchronized if multiple get requests come in at the same time.', async () => {
        // Arrange
        const target = createTestTarget();
        const expected = true;
        const cfg = new ZConfigEntryBuilder(expected).scope('common').key('secure').build();
        // Act
        const [one, two, three] = await Promise.all([
          target.get({ entry: cfg }),
          target.get({ entry: cfg }),
          target.get({ entry: cfg })
        ]);
        const actual = one.value || two.value || three.value;
        // Assert
        expect(actual).toEqual(expected);
      });
    });
  });

  describe('Put', () => {
    describe('by key', () => {
      it('will add a key that does not exist.', async () => {
        // Arrange
        const target = createTestTarget();
        const expected = new ZConfigEntryBuilder<boolean>(true).scope('common').key('secure').build();
        // Act
        const actual = await target.put({ entry: expected });
        // Assert
        expect(actual).toEqual(expected);
      });

      it('will update an existing key if it exists.', async () => {
        // Arrange
        const target = createTestTarget();
        const expected = new ZConfigEntryBuilder(true).scope('common').key('secure').build();
        // Act
        await target.put({ entry: expected });
        expected.value = true;
        const actual = await target.put({ entry: expected });
        // Assert
        expect(actual).toEqual(expected);
      });

      it('is synchronized if multiple get requests come in at the same time.', async () => {
        // Arrange
        const target = createTestTarget();
        const expected = new ZConfigEntryBuilder(true).scope('common').key('secure').build();
        const payload = { entry: expected };
        // Act
        await Promise.all([target.put(payload), target.put(payload), target.put(payload)]);
        const actual = await target.get(payload);
        // Assert
        expect(actual).toEqual(expected);
      });
    });
  });

  describe('Health', () => {
    it('should be true', async () => {
      // Arrange.
      const target = createTestTarget();
      // Act
      const actual = await target.health();
      // Assert.
      expect(actual).toEqual(true);
    });
  });
});
