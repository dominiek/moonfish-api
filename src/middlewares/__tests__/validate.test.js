const Joi = require('joi');
const validate = require('../validate');
const { context } = require('../../test-helpers');

describe('validate', () => {
  it('should throw an error when the request doesn\'t contain a key as specified in Joi schema', async () => {
    const middleware = validate({
      body: {} // Does not exist in given context
    });
    const ctx = context();

    await expect(middleware(ctx)).rejects.toHaveProperty('message', 'Specified schema key \'body\' does not exist in \'request\' object');
  });

  it('should reject a request with invalid params', async () => {
    // Require test param, but don't provide it in ctx object:
    const middleware = validate({
      body: Joi.object().keys({ test: Joi.number().required() })
    });

    const ctx = context();
    ctx.request.body = { fail: 'fail' };

    await expect(middleware(ctx)).rejects.toHaveProperty('status', 400);
  });

  it('should accept a valid request', async () => {
    const middleware = validate({
      body: Joi.object().keys({ test: Joi.string().required() })
    });
    const ctx = context({ url: '/' });
    ctx.request.body = { test: 'something' };

    await middleware(ctx, () => {
      expect(ctx.request.body.test).toBe('something');
    });
  });

  it('should support the light syntax', async () => {
    const middleware = validate({
      body: { test: Joi.string().required() }
    });
    const ctx = context({ url: '/' });
    ctx.request.body = { test: 'something' };

    await middleware(ctx, () => {
      expect(ctx.request.body.test).toBe('something');
    });
  });

  it('should do type conversion for query', async () => {
    const middleware = validate({
      query: { convertToNumber: Joi.number().required() }
    });
    const ctx = context({ url: '/' });
    ctx.request.query = {
      convertToNumber: '1234'
    };

    await middleware(ctx, () => {
      expect(ctx.request.query.convertToNumber).toBe(1234);
    });
  });


  it('should drop keys that were not defined in the Joi scheme', async () => {
    const middleware = validate({
      query: { somethingExisting: Joi.string() }
    });

    const ctx = context({ url: '/' });
    ctx.request.query = {
      somethingExisting: 'yes',
      shouldBeRemoved: 'should be been removed from request'
    };

    await middleware(ctx, () => {
      expect(ctx.request.query.somethingExisting).toBe('yes');
      expect(ctx.request.query.shouldBeRemoved).toBe(undefined);
    });
  });
});