import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { IZConfigEntry } from '../config/config-entry';

/**
 * Represents a client that contains access to a vault service.
 */
export interface IZVaultClient {
  /**
   * Reads a configuration item by scope and key.
   *
   * @param scope -
   *        The configuration scope.
   * @param key -
   *        The configuration key.
   *
   * @returns
   *        A promise that, when resolved, has the configuration for the
   *        specified scope and key.  Resolves to null if non such scope
   *        and key exists.
   */
  read<T>(scope: string, key: string): Promise<IZConfigEntry<T> | null>;

  /**
   * Gets the existing configuration value.
   *
   * If no config with the given scope and key exists, then the
   * configuration is added with the value.  Otherwise, the value
   * is overwritten with the stored value.
   *
   * @param entry -
   *        The current configuration to read.  If the scope and key of the config exists,
   *        then the existing config entity is returned, otherwise, the config value is added and
   *        the new config value is returned.
   *
   * @returns
   *        A promise that, when resolved, gives the existing config.
   */
  get<T>(entry: IZConfigEntry<T>): Promise<IZConfigEntry<T>>;

  /**
   * Adds a configuration entry or updates an existing entry.
   *
   * @param entry -
   *        The configuration entry to add or update.
   *
   * @returns
   *        A promise that, when resolve, returns the updated value.
   */
  put<T>(entry: IZConfigEntry<T>): Promise<IZConfigEntry<T>>;

  /**
   * Returns true.
   *
   * @returns
   *        True.  Returns a rejected promise if the service cannot be reached.
   */
  health(): Promise<boolean>;
}

/**
 * Represents the service that can be used to read configuration from the vault database.
 */
@Injectable()
export class ZVaultClient implements IZVaultClient {
  /**
   * Initializes a new instance of this object.
   *
   * @param proxy -
   *        The client proxy used to connect to the vault microservice.
   */
  public constructor(@Inject('Vault.Service') public readonly proxy: ClientProxy) {}

  public async read<T>(scope: string, key: string): Promise<IZConfigEntry<T> | null> {
    return lastValueFrom(this.proxy.send({ cmd: 'read' }, { scope, key }));
  }

  public async get<T>(entry: IZConfigEntry<T>): Promise<IZConfigEntry<T>> {
    return lastValueFrom(this.proxy.send({ cmd: 'get' }, { entry }));
  }

  public async put<T>(entry: IZConfigEntry<T>): Promise<IZConfigEntry<T>> {
    return lastValueFrom(this.proxy.send({ cmd: 'put' }, { entry }));
  }

  public async health(): Promise<boolean> {
    return lastValueFrom(this.proxy.send({ cmd: 'health' }, {}));
  }
}
