import { MongoClient } from "mongodb";
import multer from "multer";
import path from "node:path";
import { nanoid } from "nanoid";

export const ALLOWED_METHODS = ["GET", "HEAD", "POST"];
export const PORT = 3000;
export const DEFAULT_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "no-store"
};

export const UPLOADS_DIR = path.resolve(
  import.meta.dirname,
  "client/static/uploads"
);
export const UPLOADS_BASE_PATH = "/static/uploads";

export const MONGO_URI = "mongodb://localhost:27017";
export const MONGO_CLIENT = new MongoClient(MONGO_URI);
export const BLOG_CREATOR_DB = MONGO_CLIENT.db("blog-creator");
export const AUTHORS_COLL = BLOG_CREATOR_DB.collection("authors");
export const BLOGS_COLL = BLOG_CREATOR_DB.collection("blogs");

export const DEFAULT_MULTER_STORAGE = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename(req, file, cb) {
    cb(null, nanoid() + path.extname(file.originalname));
  }
});

export const AUTHOR_ID_COOKIE_NAME = "authorId";
export const VALIDATION_ERROR_MESSAGE = "Validation Error in submission.";