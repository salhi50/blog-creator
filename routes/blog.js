import express from "express";
import multer from "multer";
import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";
import {
  BLOGS_COLL,
  AUTHORS_COLL,
  DEFAULT_MULTER_STORAGE,
  VALIDATION_ERROR_MESSAGE
} from "../constants.js";
import { redirectIfAuthorIsNotLoggedIn } from "../middlewares.js";
import { ObjectId } from "mongodb";
import {
  createErrorResponse,
  deleteFileFromUploadsDir,
  extractTags,
  deleteUploadedFile,
  generateUploadedFilePath,
  getDefaultPageLocals
} from "../utils.js";
import { nanoid } from "nanoid";

const upload = multer({
  storage: DEFAULT_MULTER_STORAGE,
  limits: {
    fileSize: 102400 // 100kb
  }
});

const router = express.Router();

async function fetchBlog(req, res, next) {
  let blogId = req.params.blogId;

  if (
    ObjectId.isValid(blogId) &&
    (req.blog = await BLOGS_COLL.findOne({ _id: new ObjectId(blogId) })) !== null
  ) {
    req.blog.author = await AUTHORS_COLL.findOne({ _id: req.blog.authorId });
    next();
  } 

  else {
    next(createErrorResponse(404))
  };
}

export function renderBlogEditorPage(req, res, locals = {}) {
  res.render("blog-editor", {
    ...getDefaultPageLocals(req),
    title: locals.isNew ? "New blog" : "Edit blog",
    blog: req.blog,
    ...locals
  });
}

export function renderBlogPreviewPage(req, res, locals = {}) {
  res.render("blog-preview", {
    ...getDefaultPageLocals(req),
    title: req.blog.title,
    blog: req.blog,
    ...locals
  }); 
}

function setThumbnailSrc(blog, file) {
  if(file) {
    blog.thumbnailSrc = generateUploadedFilePath(file);
  }
}

marked.use({
  renderer: {
    heading(text, level) {
      let id = "";
      if (level <= 2) {
        level = 2;
        id = nanoid(8);
      }
      return `<h${level} id="${id}">${text}</h${level}>`;
    },
    table(header, body) {
      return `<table class="table">${header}${body}</table>`
    }
  }
});

router
  .route("/new")

  .get(redirectIfAuthorIsNotLoggedIn(), (req, res) => {
    renderBlogEditorPage(req, res, {
      isNew: true
    });
  })

  .post(
    redirectIfAuthorIsNotLoggedIn(303),
    upload.single("thumbnail"),
    async (req, res, next) => {

      let blogDoc = {
        title: req.body.title,
        description: req.body.description,
        createdAt: new Date(),
        updatedAt: new Date(),
        bodyMarkdown: req.body.bodyMarkdown,
        authorId: req.author._id,
        tags: extractTags(req.body.tags)
      };
      let insertResult;

      setThumbnailSrc(blogDoc, req.file);

      try {
        insertResult = await BLOGS_COLL.insertOne(blogDoc);
        res.redirect(303, `/blog/${insertResult.insertedId}/`);
      }

      catch (e) {
        deleteUploadedFile(req.file);
        if (e.code === 121) {
          renderBlogEditorPage(req, res, {
            isNew: true,
            alert: {
              message: VALIDATION_ERROR_MESSAGE
            }
          });
        } else next(e);
      }
    }
  );

router.use("/:blogId", fetchBlog);
router.use(
  "/:blogId/*",
  redirectIfAuthorIsNotLoggedIn(303),
  fetchBlog,
  (req, res, next) => {
    if (
      req.author._id.toString() !== 
      req.blog.authorId.toString()
    ) {
      return res.redirect(303, "/");
    } 
    else next();
  }
);

router
  .route("/:blogId/update")

  .get((req, res) => {
    renderBlogEditorPage(req, res, {
      isNew: false
    })
  })

  .post(upload.single("thumbnail"), async (req, res, next) => {

    let oldBlogDoc = req.blog;
    let newBlogDoc = {
      ...oldBlogDoc,
      title: req.body.title,
      description: req.body.description,
      updatedAt: new Date(),
      bodyMarkdown: req.body.bodyMarkdown,
      tags: extractTags(req.body.tags)
    };
    let updateResult;

    function handleUpdateError(err = {}) {
      deleteUploadedFile(req.file);
      renderBlogEditorPage(req, res, {
        isNew: false,
        alert: {
          message: err.code === 121 ? VALIDATION_ERROR_MESSAGE : (
            "An error occurred while updating the blog post."
          )
        }
      })
    }

    delete newBlogDoc.author;

    setThumbnailSrc(newBlogDoc, req.file);

    try {
      updateResult = await BLOGS_COLL.replaceOne({_id: oldBlogDoc._id}, newBlogDoc);

      if(updateResult.modifiedCount === 1) {
        if(req.file) deleteFileFromUploadsDir(oldBlogDoc.thumbnailSrc);
        res.redirect(303, `/blog/${newBlogDoc._id}`);
      }

      else handleUpdateError();
    }

    catch (e) {
      handleUpdateError(e);
    }
  });

router.get("/:blogId/delete", async (req, res) => {
    let result = await BLOGS_COLL.deleteOne({ _id: req.blog._id });

    if (result.deletedCount === 1) {
      deleteFileFromUploadsDir(req.blog.thumbnailSrc);
      res.redirect(302, "/?alertMessage=Blog has been deleted successfully.");
    }

    else {
      renderBlogPreviewPage(req, res, {
        alert: {
          message: "The blog could not be deleted due to an unexpected error."
        }
      })
    }
  }
);

router.get("/:blogId", (req, res) => {
  req.blog.bodyHTML = DOMPurify.sanitize(marked.parse(req.blog.bodyMarkdown));
  renderBlogPreviewPage(req, res);
});

export default router;
