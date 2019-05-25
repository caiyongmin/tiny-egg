module.exports = (app) => {
  const { controller, router } = app;

  // use egg controller
  router.get('/', controller.page.index);
  // use egg controller and servive
  router.get('/home', controller.page.home);
  // direct koa route handler, not use egg controller
  router.get('/direct', (ctx) => {
    ctx.body = 'direct koa router handler, not use egg controller';
  });
};
