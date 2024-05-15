import { isAuthorLoggedIn } from "./utils.js";

export function redirectIfAuthorLoggedIn(status = 302, url = "/") {
  return function (req, res, next) {
    if (isAuthorLoggedIn(req)) {
      res.redirect(status, url);
    }
    next();
  };
}

export function redirectIfAuthorIsNotLoggedIn(status = 302, url = "/login") {
  return function (req, res, next) {
    if (!isAuthorLoggedIn(req)) {
      res.redirect(status, url);
    }
    next();
  };
}
