import { get, set } from 'lodash';
import { IZConfigEntry, ZConfigEntryBuilder } from '../config/config-entry';
import { IZVaultClient } from './vault-client';

/**
 * Represents a VaultClient that stores data in memory.
 *
 * This just makes it easy to us the vault in unit tests.
 * You should never use this vault client in production
 */
export class ZVaultClientMemory implements IZVaultClient {
  private _memory: any = {};

  public healthy = true;

  public async read<T>(scope: string, key: string): Promise<IZConfigEntry<T> | null> {
    const value = get(this._memory, `${scope}.${key}`);
    return value == null
      ? Promise.resolve(null)
      : Promise.resolve(new ZConfigEntryBuilder(value).scope(scope).key(key).build());
  }

  public async get<T>(entry: IZConfigEntry<T>): Promise<IZConfigEntry<T>> {
    const value = await this.read<T>(entry.scope, entry.key);

    if (!value) {
      return this.put(entry);
    }

    return value;
  }

  public async put<T>(entry: IZConfigEntry<T>): Promise<IZConfigEntry<T>> {
    set(this._memory, `${entry.scope}.${entry.key}`, entry.value);
    return Promise.resolve(new ZConfigEntryBuilder(entry.value).copy(entry).build());
  }

  public health(): Promise<boolean> {
    if (!this.healthy) {
      return Promise.reject(new Error('The service is not yet ready'));
    }

    return Promise.resolve(true);
  }
}
