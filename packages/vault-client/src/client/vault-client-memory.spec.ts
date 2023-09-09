import { describe, expect, it } from 'vitest';
import { ZConfigEntryBuilder } from '../config/config-entry';
import { ZVaultClientMemory } from './vault-client-memory';

describe('VaultClientMemory', () => {
  function createTestTarget() {
    return new ZVaultClientMemory();
  }

  it('should return the previously set value.', async () => {
    // Arrange
    const target = createTestTarget();
    const entry = new ZConfigEntryBuilder('abcdefg').scope('identity').key('secret').build();
    const request = new ZConfigEntryBuilder(null).copy(entry).generate().build();
    await target.put(entry);
    // Act
    const actual = await target.get(request);
    // Assert
    expect(actual).toEqual(entry);
  });

  it('should add the default value if no value exists.', async () => {
    // Arrange
    const target = createTestTarget();
    const request = new ZConfigEntryBuilder(null).scope('identity').key('secret').generate().build();
    // Act
    const actual = await target.get(request);
    // Assert
    expect(actual).toEqual(request);
  });

  it('should overwrite the value on a put.', async () => {
    // Arrange
    const target = createTestTarget();
    const entry = new ZConfigEntryBuilder('abcdefg').scope('identity').key('secret').build();
    const request = new ZConfigEntryBuilder(null).copy(entry).generate().build();
    // Act
    await target.put(entry);
    await target.put(request);
    const actual = await target.get(entry);
    // Assert
    expect(actual).toEqual(request);
  });
});
