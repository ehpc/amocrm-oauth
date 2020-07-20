import crawl from './json-crawler';

test('crawl simple object', () => {
  const obj = {
    a: {
      b: {
        c: 42,
      },
    },
  };
  expect(crawl(obj, 'a.b.c')).toEqual(42);
});

test('can crawl empty object', () => {
  expect(crawl({}, 'a.b.c')).toBeUndefined();
});

test('can crawl undefined', () => {
  expect(crawl(undefined, 'a.b.c')).toBeUndefined();
});

test('can crawl array indexes', () => {
  const obj = {
    a: [
      {
        b: 42,
      },
    ],
  };
  expect(crawl(obj, 'a.0.b')).toEqual(42);
});
