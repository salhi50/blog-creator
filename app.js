import express from "express";
import path from "node:path";
import isNumber from "is-number";
import isObject from "isobject";
import { createErrorResponse, getDefaultPageLocals } from "./utils.js";
import {
  ALLOWED_METHODS,
  AUTHORS_COLL,
  DEFAULT_HEADERS,
  PORT,
  AUTHOR_ID_COOKIE_NAME
} from "./constants.js";
import { ObjectId } from "mongodb";
// Third party middlewares
import cookieParser from "cookie-parser";
// Routers
import signupRouter from "./routes/signup.js";
import loginRouter from "./routes/login.js";
import blogRouter from "./routes/blog.js";
import authorRouter from "./routes/author.js";
import homeRouter from "./routes/home.js";

const app = express();

// App Settings
app.set("views", path.resolve(import.meta.dirname, "pug/templates"));
app.set("view engine", "pug");
app.disable("etag");
app.disable("x-powered-by");

// Middlewares
app.use((req, res, next) => {
  res.set(DEFAULT_HEADERS);
  next();
});

app.use((req, res, next) => {
  if (ALLOWED_METHODS.indexOf(req.method) === -1) {
    next(
      createErrorResponse(405, {
        Allow: ALLOWED_METHODS.join(", ")
      })
    );
  } else next();
});

app.use(cookieParser(), async (req, res, next) => {
  let authorId = req.cookies[AUTHOR_ID_COOKIE_NAME];
  if (ObjectId.isValid(authorId)) {
    req.author = await AUTHORS_COLL.findOne({
      _id: new ObjectId(authorId)
    });
  } 
  else req.author = null;
  next();
});

app.use("/", homeRouter);
app.use("/blog", blogRouter);
app.use("/author", authorRouter);
app.use("/login", loginRouter);
app.use("/signup", signupRouter);

app.use(
  "/static",
  express.static(path.resolve(import.meta.dirname, "client/static"), {
    redirect: false,
    index: false,
    setHeaders(res) {
      res.set("Cache-Control", "public, max-age=31536000000, immutable")
    }
  })
);

app.use(
  "/scripts",
  express.static(path.resolve(import.meta.dirname, "client/scripts"), {
    redirect: false,
    index: false,
    setHeaders(res) {
      res.set("Cache-Control", "no-cache")
    }
  })
);

app.all("*", (req, res, next) => {
  next(createErrorResponse(404));
});

// Error handler
app.use((err, req, res, next) => {
  let status = 500;
  let title = "5xx Server error";

  if (res.headersSent) return next(err);
  
  if (isNumber(err.status) && err.status >= 400 && err.status < 600) {
    status = err.status;
    if (status === 404) title = "404 Not found";
    else if (status < 500) title = "4xx Not found";
  }

  if (isObject(err.headers)) res.set(err.headers);

  res.render("error", {
    ...getDefaultPageLocals(req),
    title,
    status,
  });
});

app.listen(PORT);
