/**
 * Represents information about the vault database.
 */
export abstract class ZVaultDatabase {
  /**
   * The database injection token.
   */
  public static readonly Token = 'DATABASE.VAULT';
  /**
   * The database name.
   */
  public static readonly Name = 'vault';
}

/**
 * Represents the collections in the vault database.
 */
export abstract class ZVaultCollections {
  /**
   * The collection of configs.
   */
  public static readonly Configs = 'configs';
}
