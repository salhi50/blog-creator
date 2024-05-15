import express from "express";
import {
  AUTHORS_COLL,
  VALIDATION_ERROR_MESSAGE
} from "../constants.js";
import { setAuthorIdCookie, getDuplicatedUsernameErrorMessage } from "../utils.js";
import { redirectIfAuthorLoggedIn } from "../middlewares.js";

const router = express.Router();

export function renderSignupPage(req, res, locals = {}) {
  res.render("signup", {
    title: "Signup",
    ...locals,
  });
}

router
  .route("/")

  .get(redirectIfAuthorLoggedIn(), (req, res) => {
    renderSignupPage(req, res);
  })

  // Create a new author
  .post(
    redirectIfAuthorLoggedIn(303),
    express.urlencoded({ extended: false }),
    async (req, res) => {
      let insertResult;
      try {
        insertResult = await AUTHORS_COLL.insertOne({
          username: req.body.username,
          password: req.body.password,
          joinedAt: new Date()
        });

        setAuthorIdCookie(res, insertResult.insertedId.toString());
        res.redirect(303, "/");

      } 
      
      catch (e) {
        if (e.code === 121) {
          renderSignupPage(req, res, {
            alert: {
              message: VALIDATION_ERROR_MESSAGE
            }
          });
        } 
        
        else if (e.code === 11000) {
          renderSignupPage(req, res, {
            alert: {
              message: getDuplicatedUsernameErrorMessage(req.body.username)
            }
          });
        } 
        
        else next(e);
      }
    }
  );

export default router;
