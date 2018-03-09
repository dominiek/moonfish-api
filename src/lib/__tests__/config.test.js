const config = require('../config');

beforeAll(() => {
  config.__restore();
});

describe('config', () => {
  test('config.__set', () => {
    config.__set('burger', { pizza: 1 });
    expect(config.__getAll().burger.pizza).toBe(1);
    config.__set('burger', { burger: 1 }, true);
    expect(config.__getAll().burger.burger).toBe(1);
    expect(config.__getAll().burger.pizza).toBe(1);
    config.__set('burger.nested', 1);
    expect(config.__getAll().burger.pizza).toBe(1);
    expect(config.__getAll().burger.nested).toBe(1);
  });

  test('config.__restore', () => {
    config.__set('burger', { pizza: 1 });
    config.__restore();
    const result = config.__getAll();
    expect(result.burger).toBe(undefined);
  });

  test('config.get', () => {
    config.__set('test.test', { test: 1 });
    expect(config.get('test.test.test')).toBe(1);
  });
});