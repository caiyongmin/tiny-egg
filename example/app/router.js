module.exports = (app) => {
  const { controller, router } = app;

  app.get('/', controller.page.home);
  app.get('/c', controller.page.index);
  app.get('/index', (ctx) => {
    ctx.body = 'hello world';
  });
};
