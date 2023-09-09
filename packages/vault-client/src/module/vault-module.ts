import { Inject, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { sleep } from '@zthun/helpful-fn';
import { ZLogEntryBuilder, ZLoggerConsole } from '@zthun/lumberjacky-log';
import { IZVaultClient, ZVaultClient } from '../client/vault-client';

export const ZVaultTimeoutToken = Symbol();
export const ZVaultIntervalToken = Symbol();
export const ZVaultToken = Symbol();

const ZVaultProvider = { provide: ZVaultToken, useClass: ZVaultClient };
const ZVaultTimeoutProvider = { provide: ZVaultTimeoutToken, useValue: 120000 };
const ZVaultIntervalProvider = { provide: ZVaultIntervalToken, useValue: 3000 };

/**
 * Represents the module that handles connections to the vault.
 */
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'Vault.Service',
        transport: Transport.TCP,
        options: {
          host: 'zthunworks-services-vault',
          port: 4000
        }
      }
    ])
  ],
  providers: [ZVaultProvider, ZVaultTimeoutProvider, ZVaultIntervalProvider],
  exports: [ZVaultProvider]
})
export class ZVaultModule {
  private _logger = new ZLoggerConsole(console);

  /**
   * Initializes a new instance of this object.
   *
   * @param _vault -
   *        The vault client.
   */
  public constructor(
    @Inject(ZVaultToken) private _vault: IZVaultClient,
    @Inject(ZVaultTimeoutToken) private _timeout: number,
    @Inject(ZVaultIntervalToken) private _interval: number
  ) {}

  /**
   * Occurs when the module is initialized.
   */
  public async onModuleInit() {
    let lastError: any = null;
    this._logger.log(new ZLogEntryBuilder().message('Waiting for the vault service to be ready').info().build());

    for (let i = 0; i < this._timeout; i += this._interval) {
      try {
        await this._vault.health();
        i = this._timeout;
        lastError = null;
        this._logger.log(new ZLogEntryBuilder().message('Vault service is ready').info().build());
      } catch (e) {
        this._logger.log(new ZLogEntryBuilder().message('Vault not yet ready.  Retrying...').warning().build());
        lastError = e;
        await sleep(this._interval);
      }
    }

    if (lastError) {
      this._logger.log(new ZLogEntryBuilder().message('Vault service failed to initialize').catastrophe().build());
      this._logger.log(new ZLogEntryBuilder().message(JSON.stringify(lastError)).error().build());
    }
  }
}
