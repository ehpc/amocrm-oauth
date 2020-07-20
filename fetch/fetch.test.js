import fetch from './fetch';

test('can fetch JSON', async () => {
  const json = await fetch(
    'http://httpbin.org/get?param=value',
    {},
    {
      resultType: 'json',
    },
  );
  expect(json).toMatchObject({
    args: {
      param: 'value',
    },
  });
});

test('doesn\'t throw', async () => {
  const response = await fetch(
    'http://undefined',
    {},
    {
      defaultResult: 42,
    },
  );
  expect(response).toEqual(42);
});
