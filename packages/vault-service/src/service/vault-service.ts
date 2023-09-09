import { Controller, Inject } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { IZDatabaseDocument } from '@zthun/dalmart-db';
import { ZDataRequestBuilder, ZFilterBinaryBuilder, ZFilterLogicBuilder } from '@zthun/helpful-query';
import { IZConfigEntry, ZConfigEntryBuilder } from '@zthun/vault-client';
import { ZVaultCollections, ZVaultDatabase } from '../database/vault-database';

@Controller()
export class ZVaultService {
  /**
   * Initializes a new instance of this object.
   *
   * @param _dal -
   *        The data access layer used to communicate with the vault database.
   */
  public constructor(@Inject(ZVaultDatabase.Token) private readonly _dal: IZDatabaseDocument) {}

  /**
   * Reads a configuration item by scope and key.
   *
   * @param payload -
   *        The data payload that contains the scope and key.
   *
   * @returns
   *        A promise that, when resolved, has the configuration for the specified scope and key in the
   *        payload.  Resolves to null if non such scope and key exists.
   */
  @MessagePattern({ cmd: 'read' })
  public async read<T>({ scope, key }: { scope: string; key: string }): Promise<IZConfigEntry<T>> {
    const scopeFilter = new ZFilterBinaryBuilder().subject('scope').equal().value(scope).build();
    const keyFilter = new ZFilterBinaryBuilder().subject('key').equal().value(key).build();
    const filter = new ZFilterLogicBuilder().and().clause(scopeFilter).clause(keyFilter).build();
    const request = new ZDataRequestBuilder().filter(filter).build();
    const [existing] = await this._dal.read<IZConfigEntry<T>>(ZVaultCollections.Configs, request);
    return existing;
  }

  /**
   * Gets the existing configuration value.
   *
   * If no config with the given scope and key exists, then the
   * configuration is added with the default value.
   *
   * @param entry -
   *        The current configuration to read.  If the scope and key of the config exists,
   *        then the existing config entity is returned, otherwise, the config value is added.
   *
   * @returns
   *        A promise that, when resolved, returns the value that is currently in the database.
   */
  @MessagePattern({ cmd: 'get' })
  public async get<T>({ entry }: { entry: IZConfigEntry<T> }): Promise<IZConfigEntry<T>> {
    let config = await this.read<T>(entry);

    if (!config) {
      config = new ZConfigEntryBuilder(entry.value).copy(entry).build();
      [config] = await this._dal
        .create(ZVaultCollections.Configs, [config])
        .catch(() => Promise.all([this.read<T>(entry)]));
    }

    return config;
  }

  /**
   * Adds a configuration entry or updates an existing entry.
   *
   * Be careful with multiple calls going through all at the same time.
   * This method is a last one in wins system.
   *
   * @param param0 -
   *        The configuration entry to add or update.
   *
   * @returns
   *        A promise that, when resolve, returns the value that is currently in the database.
   */
  @MessagePattern({ cmd: 'put' })
  public async put<T>({ entry }: { entry: IZConfigEntry<T> }): Promise<IZConfigEntry<T>> {
    const filter = new ZFilterBinaryBuilder().subject('_id').equal().value(entry._id).build();
    const items = [entry];
    const config = await this._dal
      .create<IZConfigEntry<T>>(ZVaultCollections.Configs, items)
      .catch(() => this._dal.update<IZConfigEntry>(ZVaultCollections.Configs, entry, filter))
      .then(() => this.read<T>(entry));

    return config;
  }

  /**
   * Gets the service health.
   *
   * @returns
   *        True
   */
  @MessagePattern({ cmd: 'health' })
  public async health(): Promise<true> {
    return true;
  }
}
