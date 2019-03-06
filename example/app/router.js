module.exports = (app) => {
  const { controller, router } = app;

  router.get('/', controller.page.home);
  router.get('/c', controller.page.index);
  router.get('/index', (ctx) => {
    ctx.body = 'hello world';
  });
};
