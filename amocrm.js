import fetch from './fetch/fetch';
import crawlJSON from './json-crawler/json-crawler';

/**
 * AmoCRM is a class for interacting with Amo CRM
 */
export default class AmoCRM {
  /**
   * AmoCRM constructor
   * @param {string} url CRM URL
   * @param {OAuthData} oAuthData OAuth data object
   * @param {object} logger Logger injection
   */
  constructor(url, oAuthData, logger = console) {
    this.url = url;
    this.oAuthData = oAuthData;
    this.logger = logger;
    this.cache = {};
  }

  /**
   * Authenticates and retrieves OAuth tokens
   * @returns {object} Tokens
   */
  async authenticate() {
    const requestParams = {
      client_id: this.oAuthData.getClientId(),
      client_secret: this.oAuthData.getClientSecret(),
      grant_type: 'authorization_code',
      code: this.oAuthData.getAuthorizationKey(),
      redirect_uri: this.oAuthData.getRedirectUri(),
    };
    const data = await fetch(
      `${this.url}/oauth2/access_token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestParams),
      },
      {
        resultType: 'json',
        defaultResult: false,
        logger: this.logger,
      },
    );
    if (!data.access_token) {
      this.logger.error('Failed to acquire tokens', data, requestParams);
      return false;
    }
    this.oAuthData.setAccessToken(data.access_token);
    this.oAuthData.setRefreshToken(data.refresh_token);
    return this.oAuthData.getTokens();
  }

  /**
   * Reissues access and refresh tokens
   * @returns {obect} Tokens
   */
  async reissueTokens() {
    const requestParams = {
      client_id: this.oAuthData.getClientId(),
      client_secret: this.oAuthData.getClientSecret(),
      grant_type: 'refresh_token',
      refresh_token: this.oAuthData.getRefreshToken(),
      redirect_uri: this.oAuthData.getRedirectUri(),
    };
    const headers = {
      'Content-Type': 'application/json',
    };
    const url = `${this.url}/oauth2/access_token`;
    const data = await fetch(
      url,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(requestParams),
      },
      {
        resultType: 'json',
        defaultResult: false,
        logger: this.logger,
      },
    );
    if (!data.access_token) {
      this.logger.error('Failed to reissue tokens', data, url, requestParams, headers);
      return false;
    }
    this.oAuthData.setAccessToken(data.access_token);
    this.oAuthData.setRefreshToken(data.refresh_token);
    return this.oAuthData.getTokens();
  }

  /**
   * Check if CRM is online
   * @returns {boolean}
   */
  async healthCheck() {
    const res = await fetch(
      this.url,
      {
        redirect: 'error',
      },
      {
        resultType: 'result',
        defaultResult: false,
        logger: this.logger,
      },
    );
    return res.status === 401 || !!res.ok;
  }

  /**
   * Gets pipeline name from ID
   * @param {string} pipelineId Pipeline ID
   * @param {string} statusId Status ID
   * @returns {string}
   */
  async getPipelineStatusName(pipelineId, statusId) {
    const data = await fetch(
      `${this.url}/api/v2/pipelines?id=${pipelineId}`,
      {
        headers: this.getAuthHeaders(),
      },
      {
        resultType: 'json',
        defaultResult: {},
        logger: this.logger,
      },
    );
    return crawlJSON(
      data,
      `_embedded.items.${pipelineId}.statuses.${statusId}.name`,
    );
  }

  /**
   * Gets lead info by ID
   * @param {string} leadId Lead ID
   * @returns {object}
   */
  async getLeadInfo(leadId) {
    const data = await fetch(
      `${this.url}/api/v2/leads?id=${leadId}`,
      {
        headers: this.getAuthHeaders(),
      },
      {
        resultType: 'json',
        defaultResult: {},
        logger: this.logger,
      },
    );
    return {
      mainContactId: crawlJSON(data, '_embedded.items.0.main_contact.id'),
    };
  }

  /**
   * Gets contact info by lead ID
   * @param {string} leadId Lead ID
   * @returns {object} Contact info
   */
  async getContactInfoByLeadId(leadId) {
    const { mainContactId } = await this.getLeadInfo(leadId);
    return this.getContactInfo(mainContactId);
  }

  /**
   * Merges different name into one
   * @param {object} nameData Different name representations
   * @returns {object}
   */
  static reconstructName(nameData) {
    const name = nameData.name ? nameData.name.trim() : '';
    const leadName = nameData.leadName ? nameData.leadName.trim() : '';
    const firstName = nameData.firstName ? nameData.firstName.trim() : '';
    const lastName = nameData.lastName ? nameData.lastName.trim() : '';
    const result = {
      firstName: '',
      lastName: '',
      middleName: '',
    };
    let [fn, ln, mn] = leadName.split(' ');
    if (fn) {
      result.firstName = fn;
    }
    if (ln) {
      result.lastName = ln;
    }
    if (mn) {
      result.middleName = mn;
    }
    [fn, ln, mn] = name.split(' ');
    if (fn) {
      result.firstName = fn;
    }
    if (ln) {
      result.lastName = ln;
    }
    if (mn) {
      result.middleName = mn;
    }
    if (firstName) {
      result.firstName = firstName;
    }
    if (lastName) {
      result.lastName = lastName;
    }
    return result;
  }

  /**
   * Gets contact information by ID
   * @param {string} contactId Contact ID
   * @returns {object} Contact info
   */
  async getContactInfo(contactId) {
    const data = await fetch(
      `${this.url}/api/v2/contacts/?id=${contactId}`,
      {
        headers: this.getAuthHeaders(),
      },
      {
        resultType: 'json',
        defaultResult: {},
        logger: this.logger,
      },
    );
    const contact = crawlJSON(data, '_embedded.items.0');
    const contactInfo = {
      name: contact.name,
      firstName: contact.first_name,
      lastName: contact.last_name,
      company: crawlJSON(contact, 'company.name'),
    };
    if (contact.custom_fields && contact.custom_fields.length) {
      const fieldMapping = {
        EMAIL: 'email',
        PHONE: 'phone',
        POSITION: 'position',
        IM: 'skype',
        Facebook: 'facebook',
        'Имя в Facebook': 'facebookName',
        Instagram: 'instagram',
        ВКонтакте: 'vk',
        'Опыт программирования': 'experience',
      };
      contact.custom_fields.forEach((field) => {
        const propertyName = fieldMapping[field.code] || fieldMapping[field.name];
        if (propertyName) {
          contactInfo[propertyName] = field.values.length > 1
            ? field.values.map((x) => x.value)
            : field.values[0].value;
        }
      });
    }
    return contactInfo;
  }

  /**
   * Checks if API is available with current credentials
   * @returns {boolean}
   */
  async canAccessAPI() {
    const data = await fetch(
      `${this.url}/api/v2/account`,
      {
        headers: this.getAuthHeaders(),
      },
      {
        resultType: 'json',
        defaultResult: {},
        logger: this.logger,
      },
    );
    return typeof data.id === 'number';
  }

  /**
   * Returns HTTP headers for authentication
   * @returns {object} Authorization headers
   */
  getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.oAuthData.getAccessToken()}`,
    };
  }

  /**
   * Returns OAuthData object
   * @returns {OAuthData}
   */
  getOAuthData() {
    return this.oAuthData;
  }
}
