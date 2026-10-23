const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).then(() => {}, next);

function createAuthController(authService) {
  return {
    login: wrap(async (req, res) => res.json(await authService.login(req.body))),
    me: wrap(async (req, res) => res.json({ user: req.user })),
  };
}
module.exports = { createAuthController };
