/* eslint-disable no-template-curly-in-string */
const { get, template } = require('../utils');

describe('utils', () => {
  test('get', () => {
    const object = { a: [{ b: { c: 3 } }] };
    expect(get(object, 'a[0].b.c')).toBe(3);
    expect(get(object, ['a', '0', 'b', 'c'])).toBe(3);
    expect(get(object, 'a.b.c', 'default')).toBe('default');
  });

  test('template', () => {
    expect(template('hello ${foo}', { foo: 'bar' })).toBe('hello bar');
    expect(template('hello ${foo} ${foo}', { foo: 'bar' })).toBe('hello bar bar');
    expect(template('hello ${bar} ${foo}', { foo: 'bar', bar: 'foo' })).toBe('hello foo bar');
    expect(() => {
      template('hello ${undefined}', {});
    }).toThrow('template: was not provided a value for attribute $undefined');
  });
});