import pactum from 'pactum';
import { StatusCodes } from 'http-status-codes';

const isCI = process.env.CI === 'true';

describe('Fake Store API - Test Suite', () => {
  const p = pactum;

  beforeAll(() => {
    p.request.setBaseUrl('https://fakestoreapi.com');
    p.request.setDefaultTimeout(10000);
  });

  describe('Products', () => {

    it('Should return a list of all products with valid structure', async () => {
      await p
        .spec()
        .get('/products')
        .expectStatus(StatusCodes.OK)
        .expectJsonSchema({
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'title', 'price', 'category'],
          },
        });
    });

    it('Should return a single product by valid ID', async () => {
      await p
        .spec()
        .get('/products/1')
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({
          id: 1,
          title: /.+/,
          price: /\d+/,
        });
    });

    it('Should return all categories', async () => {
      await p
        .spec()
        .get('/products/categories')
        .expectStatus(StatusCodes.OK)
        .expectJsonSchema({
          type: 'array',
          items: { type: 'string' },
        });
    });

    it('Should return products from a specific category', async () => {
      await p
        .spec()
        .get('/products/category/electronics')
        .expectStatus(StatusCodes.OK)
        .expectJsonSchema({
          type: 'array',
        });
    });

    it('Should handle invalid product ID gracefully', async () => {
      await p
        .spec()
        .get('/products/9999')
        .expect((ctx) => {
          const status = ctx.res.statusCode;
          const body = ctx.res.body;

          if (isCI) {
            // CI pode bloquear (403), então não quebra pipeline
            expect([200, 403]).toContain(status);
          } else {
            expect(status).toBe(200);
            expect(body === '' || typeof body === 'object').toBeTruthy();
          }
        });
    });

  });

  describe('Users', () => {

    it('Should return all users', async () => {
      await p
        .spec()
        .get('/users')
        .expectStatus(StatusCodes.OK)
        .expectJsonSchema({
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'email', 'username'],
          },
        });
    });

    it('Should return a single user', async () => {
      await p
        .spec()
        .get('/users/1')
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({
          id: 1,
          email: /.+@.+/,
        });
    });

  });

  describe('Carts', () => {

    it('Should return all carts', async () => {
      await p
        .spec()
        .get('/carts')
        .expectStatus(StatusCodes.OK);
    });

    it('Should return a single cart with valid structure', async () => {
      await p
        .spec()
        .get('/carts/1')
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({
          id: 1,
          products: [
            {
              productId: /\d+/,
              quantity: /\d+/,
            },
          ],
        });
    });

  });

  describe('Authentication', () => {

    it('Should login successfully with valid credentials', async () => {
      await p
        .spec()
        .post('/auth/login')
        .withJson({
          username: 'mor_2314',
          password: '83r5^_',
        })
        .expectStatus(StatusCodes.CREATED)
        .expectJsonLike({
          token: /.+/,
        });
    });

    it('Should fail login with invalid credentials', async () => {
      await p
        .spec()
        .post('/auth/login')
        .withJson({
          username: 'invalid',
          password: 'invalid',
        })
        .expectStatus(StatusCodes.UNAUTHORIZED);
    });

  });

  describe('Performance & Validation', () => {

    it('Should respond within acceptable time', async () => {
      if (isCI) return; // evita falha no GitHub Actions

      await p
        .spec()
        .get('/products')
        .expectStatus(StatusCodes.OK)
        .expectResponseTime(2000);
    });

  });

});