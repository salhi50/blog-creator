import express from "express";
import { AUTHORS_COLL } from "../constants.js";
import { setAuthorIdCookie } from "../utils.js";
import { redirectIfAuthorLoggedIn } from "../middlewares.js";

const router = express.Router();

export function renderLoginPage(req, res, locals = {}) {
  res.render("login", {
    title: "Login",
    ...locals
  });
}

router
  .route("/")

  .get(redirectIfAuthorLoggedIn(), (req, res) => {
    renderLoginPage(req, res);
  })

  .post(
    redirectIfAuthorLoggedIn(303),
    express.urlencoded({ extended: false }),
    async (req, res) => {

      let authorDoc = await AUTHORS_COLL.findOne({
        username: req.body.username,
        password: req.body.password
      });

      if (authorDoc) {
        setAuthorIdCookie(res, authorDoc._id.toString());
        res.redirect(303, "/");
      } 
      
      else {
        renderLoginPage(req, res, {
          alert: {
            message: "Invalid username or password."
          }
        });
      }
    }
  );

export default router;
