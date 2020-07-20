import { promises as fs } from 'fs';
import path from 'path';

/**
 * OAuthData represents auth data required for OAuth API communication
 */
export default class OAuthData {
  /**
   * Constructor
   * @param {string} clientId OAuth client id
   * @param {string} clientSecret OAuth client secret
   * @param {string} redirectUri OAuth redirect url
   * @param {object} logger Logger injection
   */
  constructor(clientId, clientSecret, redirectUri, logger = console) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.logger = logger;
  }

  /**
   * Sets client id
   * @param {string} clientId Client ID
   */
  setClientId(clientId) {
    this.clientId = clientId;
  }

  /**
   * Sets client secret
   * @param {string} clientSecret Client secret
   */
  setClientSecret(clientSecret) {
    this.clientSecret = clientSecret;
  }

  /**
   * Sets authorization key
   * @param {string} authorizationKey OAuth authorization key
   */
  setAuthorizationKey(authorizationKey) {
    this.authorizationKey = authorizationKey;
  }

  /**
   * Sets access token
   * @param {string} accessToken OAuth access token
   */
  setAccessToken(accessToken) {
    this.accessToken = accessToken;
  }

  /**
   * Sets refresh token
   * @param {string} refreshToken OAuth refresh token
   */
  setRefreshToken(refreshToken) {
    this.refreshToken = refreshToken;
  }

  /**
   * Sets OAuth tokens
   * @param {object} tokens New tokens
   */
  setTokens(tokens) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
  }

  /**
   * Returns client id
   * @returns {string}
   */
  getClientId() {
    return this.clientId;
  }

  /**
   * Returns client secret
   * @returns {string}
   */
  getClientSecret() {
    return this.clientSecret;
  }

  /**
   * Returns redirect URI
   * @returns {string}
   */
  getRedirectUri() {
    return this.redirectUri;
  }

  /**
   * Returns authorization key
   * @returns {string}
   */
  getAuthorizationKey() {
    return this.authorizationKey;
  }

  /**
   * Returns access token
   * @returns {string}
   */
  getAccessToken() {
    return this.accessToken;
  }

  /**
   * Returns refresh token
   * @returns {string}
   */
  getRefreshToken() {
    return this.refreshToken;
  }

  /**
   * Returns OAuth tokens
   */
  getTokens() {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
    };
  }

  /**
   * Returns all auth data
   * @returns {object}
   */
  getData() {
    return {
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      authorizationKey: this.authorizationKey,
      redirectUri: this.redirectUri,
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
    };
  }

  /**
   * Converts OAuth data to JSON
   * @returns {string}
   */
  toJSON() {
    return JSON.stringify(this.getData());
  }

  /**
   * Loads OAuth data from JSON string
   * @param {string} str JSON string
   */
  fromJSON(str) {
    const data = JSON.parse(str);
    if (data.clientId) {
      this.clientId = data.clientId;
    }
    if (data.clientSecret) {
      this.clientSecret = data.clientSecret;
    }
    if (data.redirectUri) {
      this.redirectUri = data.redirectUri;
    }
    if (data.authorizationKey) {
      this.authorizationKey = data.authorizationKey;
    }
    if (data.accessToken) {
      this.accessToken = data.accessToken;
    }
    if (data.refreshToken) {
      this.refreshToken = data.refreshToken;
    }
    return this;
  }

  /**
   * Saves OAuth data to file
   * @param {string} [filePath] File path
   */
  async saveToFile(filePath = path.join(__dirname, 'oauth-data.json')) {
    try {
      await fs.writeFile(filePath, this.toJSON());
      return true;
    } catch (e) {
      this.logger.error(e);
      return false;
    }
  }

  /**
   * Loads OAuth data from file
   * @param {string} [filePath] File path
   */
  async loadFromFile(filePath = path.join(__dirname, 'oauth-data.json')) {
    try {
      return this.fromJSON(await fs.readFile(filePath));
    } catch (e) {
      this.logger.error(e);
      return false;
    }
  }

  /**
   * Loads OAuth data from environment
   */
  loadFromEnv() {
    this.redirectUri = process.env.AMOCRM_REDIRECT_URL;
    this.clientId = process.env.AMOCRM_CLIENT_ID;
    this.clientSecret = process.env.AMOCRM_CLIENT_SECRET;
    this.authorizationKey = process.env.AMOCRM_AUTHORIZATION_KEY;
    return true;
  }

  /**
   * Gets tokens from DB
   * @param {object} photonModel Photon model
   * @param {string} entityName Integration entity name
   * @returns {object}
   */
  async loadTokensWithPhoton(photonModel, entityName) {
    let integration;
    try {
      integration = await photonModel.findOne({
        where: {
          name: entityName,
        },
      });
    } catch (e) {
      this.logger.error('Failed to load tokens with photon', e);
      return {};
    }
    this.accessToken = integration.accessToken;
    this.refreshToken = integration.refreshToken;
    return {
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken,
    };
  }

  /**
   * Persists tokens to DB
   * @param {object} photonModel Photon model
   * @param {string} entityName Integration entity name
   */
  async saveTokensWithPhoton(photonModel, entityName) {
    const tokens = this.getTokens();
    return photonModel.upsert({
      where: {
        name: entityName,
      },
      update: tokens,
      create: {
        ...tokens,
        name: entityName,
      },
    });
  }
}
