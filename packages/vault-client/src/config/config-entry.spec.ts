import { describe, expect, it } from 'vitest';

import { IZConfigEntry, ZConfigEntryBuilder } from './config-entry';

describe('ZConfigEntryBuilder', () => {
  function createTestTarget() {
    return new ZConfigEntryBuilder('');
  }

  describe('Assign', () => {
    it('assigns other properties but keeps the non assigned ones.', () => {
      // Arrange
      const target = createTestTarget().key('domain').value('zthunworks.com');
      const expected = createTestTarget().copy(target.build()).value('marvel.com').build();
      // Act
      const actual = target.assign({ value: expected.value }).build();
      // Assert
      expect(actual).toEqual(expected);
    });
  });

  describe('Copy', () => {
    it('creates a copy', () => {
      // Arrange
      const other = new ZConfigEntryBuilder('').key('domain').value('zthunworks.com').build();
      const target = createTestTarget();
      // Act
      const actual = target.copy(other).build();
      // Assert
      expect(actual).not.toBe(other);
      expect(actual).toEqual(other);
    });
  });

  describe('Properties', () => {
    function assertPropertySet<T>(
      expected: T,
      buildFn: (target: ZConfigEntryBuilder, value: T) => ZConfigEntryBuilder,
      actualFn: (config: IZConfigEntry) => T
    ) {
      // Arrange
      const target = createTestTarget();
      // Act
      const login = buildFn(target, expected).build();
      const actual = actualFn(login);
      // Assert
      expect(actual).toEqual(expected);
    }

    it('sets the id as a combination of scope and key.', () => {
      assertPropertySet(
        'application.scope.key',
        (t) => t.scope('application.scope').key('key'),
        (c) => c._id
      );
    });

    it('sets the id to scope. if the key is not defined.', () => {
      assertPropertySet(
        'application.scope.',
        (t) => t.scope('application.scope'),
        (c) => c._id
      );
    });

    it('sets the id to .key if scope is not defined.', () => {
      assertPropertySet(
        '.key',
        (t) => t.key('key'),
        (c) => c._id
      );
    });

    it('sets the id to . if the scope and key are not defined.', () => {
      assertPropertySet(
        '.',
        (t) => t,
        (c) => c._id
      );
    });

    it('sets the scope.', () => {
      assertPropertySet(
        'domain',
        (t, v) => t.scope(v),
        (c) => c.scope
      );
    });

    it('sets the key.', () => {
      assertPropertySet(
        'domain',
        (t, v) => t.key(v),
        (c) => c.key
      );
    });

    it('sets the value.', () => {
      assertPropertySet(
        'zthunworks',
        (t, v) => t.value(v),
        (c) => c.value
      );
    });
  });

  describe('Generated values', () => {
    it('sets the value to a randomly generated string.', () => {
      // Arrange
      const target = createTestTarget().scope('application').key('secret').generate();
      // Act
      const actual = target.build().value;
      // Assert
      expect(actual).toBeTruthy();
    });

    it('sets the value to a string and respects the encoding and length.', () => {
      // Arrange
      const target = createTestTarget().scope('application').key('secret').generate(256, 'hex');
      // Act
      const actual = target.build().value;
      // Assert
      expect(actual?.length).toBeGreaterThanOrEqual(256);
    });
  });
});
