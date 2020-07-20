import dotenv from 'dotenv';
import AmoCRM from './amocrm';
import OAuthData from './oauth-data/oauth-data';

dotenv.config();

const oAuthData = new OAuthData();
oAuthData.loadFromEnv();

const crm = new AmoCRM(
  process.env.AMOCRM_URL,
  oAuthData,
  console,
);

test('can reconstruct name', () => {
  const tests = [
    [{ name: 'Тест Тестов Тестович' }, { firstName: 'Тест', lastName: 'Тестов', middleName: 'Тестович' }],
    [{ name: 'Евгений', leadName: 'Евгений Большаков' }, { firstName: 'Евгений', lastName: 'Большаков', middleName: '' }],
    [{ name: 'Евгений Большаков Петрович', firstName: 'Евгений' }, { firstName: 'Евгений', lastName: 'Большаков', middleName: 'Петрович' }],
  ];
  tests.forEach(([input, expected]) => {
    expect(AmoCRM.reconstructName(input)).toEqual(expected);
  });
});

test('connect to CRM #manual', async () => {
  expect(await crm.healthCheck()).toBe(true);
});

test('get OAuth tokens #manual', async () => {
  const tokens = await crm.authenticate();
  expect(tokens).toEqual(expect.objectContaining({
    accessToken: expect.any(String),
    refreshToken: expect.any(String),
  }));
  expect(await oAuthData.saveToFile()).toBe(true);
});

test('reissue OAuth tokens #manual', async () => {
  const tokens = await crm.reissueTokens();
  expect(tokens).toEqual(expect.objectContaining({
    accessToken: expect.any(String),
    refreshToken: expect.any(String),
  }));
  expect(await oAuthData.saveToFile()).toBe(true);
});

test('can access API #manual', async () => {
  expect(await crm.canAccessAPI()).toBe(true);
});

test('get pipeline status name by id #manual', async () => {
  expect(
    (await crm.getPipelineStatusName('1309792', '21234451')).toLowerCase(),
  ).toEqual('назначен экзамен');
});

test('get contact info by id #manual', async () => {
  expect(await crm.getContactInfo('46925315')).toMatchObject({
    name: 'Тест Тестов Тестович',
    phone: '+72323324234',
  });
});

test('get lead info by id #manual', async () => {
  expect(await crm.getLeadInfo('26378833')).toMatchObject({
    mainContactId: 46925315,
  });
});

test('get contact info by lead id #manual', async () => {
  expect(await crm.getContactInfoByLeadId('26378833')).toMatchObject({
    name: 'Тест Тестов Тестович',
    phone: '+72323324234',
  });
});
