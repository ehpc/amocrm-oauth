import express from 'express';
import { PrismaClient } from '@prisma/client';
import AmoCRM from './libs/amocrm/amocrm';
import OAuthData from './libs/oauth-data/oauth-data';
import { catchToStatus500 } from '../libs/router-helper/router-helper';
import crawlJSON from './libs/json-crawler/json-crawler';

const router = express.Router();
const prismaClient = new PrismaClient();
const integrationName = 'amocrm';

let crm;

/**
 * Loads OAuth tokens
 * @param {object} req Request
 * @param {object} res Response
 * @param {function} next Next
 */
async function loadTokensMiddleware(req, res, next) {
  const oAuthData = crm.getOAuthData();
  oAuthData.setTokens(
    await catchToStatus500(oAuthData.loadTokensWithPhoton.bind(oAuthData), res, console)(
      prismaClient.integrations,
      integrationName,
    ),
  );
  next();
}

/**
 * Reissues tokens
 * @param {object} req Request
 * @param {object} res Response
 * @param {function} next Next
 */
async function reissueTokensMiddleware(req, res, next) {
  await catchToStatus500(crm.reissueTokens.bind(crm), res, console)();
  const oAuthData = crm.getOAuthData();
  await catchToStatus500(oAuthData.saveTokensWithPhoton.bind(oAuthData), res, console)(
    prismaClient.integrations,
    integrationName,
  );
  next();
}

/**
 * Initializes router
 */
async function init() {
  const oAuthData = new OAuthData();
  oAuthData.loadFromEnv();
  crm = new AmoCRM(
    process.env.AMOCRM_URL,
    oAuthData,
    console,
  );
}

init();

// Load actual tokens on every request
router.use(loadTokensMiddleware);

// Test route
router.get('/test', async (req, res) => {
  const dbData = await catchToStatus500(
    prismaClient.integration.findOne.bind(prismaClient.integrations),
    res,
    console,
  )({
    where: {
      name: integrationName,
    },
  });
  const result = {
    dbData,
    oauthData: crm.getOAuthData().getData(),
    env: process.env,
  };
  res.json(result);
});

// Health check for CRM
router.get('/health-check', async (req, res) => {
  res.json(await catchToStatus500(crm.healthCheck.bind(crm), res, console)());
});

// Checks if API is accessible with credentials
router.get('/can-access-api', async (req, res) => {
  res.json(await catchToStatus500(crm.canAccessAPI.bind(crm), res, console)());
});

// Allows to manually set tokens
router.post('/set-tokens', async (
  { body: { accessToken, refreshToken } },
  res,
) => {
  const oAuthData = crm.getOAuthData();
  oAuthData.setAccessToken(accessToken);
  oAuthData.setRefreshToken(refreshToken);
  await catchToStatus500(oAuthData.saveTokensWithPhoton.bind(oAuthData), res, console)(
    prismaClient.integrations,
    integrationName,
    {
      accessToken,
      refreshToken,
    },
  );
  res.json(
    await catchToStatus500(prismaClient.integration.findOne.bind(prismaClient.integrations), res, console)({
      where: {
        name: integrationName,
      },
    }),
  );
});

// OAuth authorization
router.post('/oauth', async (
  { body: { clientId, clientSecret, authorizationKey } },
  res,
) => {
  const oAuthData = crm.getOAuthData();
  oAuthData.setClientId(clientId);
  oAuthData.setClientSecret(clientSecret);
  oAuthData.setAuthorizationKey(authorizationKey);
  const tokens = await catchToStatus500(crm.authenticate.bind(crm), res, console)();
  if (tokens) {
    await catchToStatus500(oAuthData.saveTokensWithPhoton.bind(oAuthData), res, console)(
      prismaClient.integrations,
      integrationName,
      tokens,
    );
    res.json(tokens);
  } else {
    res.status(401).end();
  }
});

// Reissue tokens
router.post('/reissue-tokens', async (req, res) => {
  res.json(await catchToStatus500(crm.reissueTokens.bind(crm), res, console)());
});

// WebHook AmoCRM
router.post('/hook', reissueTokensMiddleware, async (req, res) => {
  const status = crawlJSON(req.body, 'leads.status.0');
  console.debug('Data from hook:', JSON.stringify(req.body));
  if (status) {
    const pipelineName = await catchToStatus500(crm.getPipelineStatusName.bind(crm), res, console)(
      status.pipeline_id,
      status.status_id,
    );
    console.debug('Pipeline: ', pipelineName);
    if (!pipelineName || pipelineName.trim().toLowerCase() !== 'назначен экзамен') {
      return res.end();
    }
    const leadId = status.id;
    const leadName = status.name;
    const contactInfo = await catchToStatus500(
      crm.getContactInfoByLeadId.bind(crm),
      res,
      console,
    )(leadId);
    contactInfo.leadName = leadName;
    contactInfo.reconstructedName = AmoCRM.reconstructName(contactInfo);
    // Push data to db
    const studentData = {
      firstName: contactInfo.reconstructedName.firstName,
      lastName: contactInfo.reconstructedName.lastName,
    };
    if (contactInfo.email) {
      studentData.email = contactInfo.email;
    }
    if (contactInfo.phone) {
      studentData.phone = contactInfo.phone;
    }
    studentData.links = `company: ${contactInfo.company || ''};
      skype: ${contactInfo.skype || ''};
      facebook: ${contactInfo.facebook || ''};
      facebookName: ${contactInfo.facebookName || ''};
      instagram: ${contactInfo.instagram || ''};
      vk: ${contactInfo.vk || ''};
      experience: ${contactInfo.experience || ''};`;
    const result = await catchToStatus500(
      prismaClient.student.upsert.bind(prismaClient.students),
      res,
      console,
    )({
      where: {
        phone: contactInfo.phone,
      },
      update: studentData,
      create: studentData,
    });
    contactInfo.dbResult = result;
    res.json(contactInfo);
  } else {
    console.warn('No lead ID');
  }
  return res.end();
});

export default router;
