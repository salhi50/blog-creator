import express from "express";
import {
  AUTHORS_COLL,
  AUTHOR_ID_COOKIE_NAME,
  DEFAULT_MULTER_STORAGE,
  VALIDATION_ERROR_MESSAGE
} from "../constants.js";
import { 
  createErrorResponse,
  deleteFileFromUploadsDir, 
  deleteUploadedFile,
  generateUploadedFilePath,
  isAuthorLoggedIn,
  getDuplicatedUsernameErrorMessage,
  getDefaultPageLocals
} from "../utils.js";
import {redirectIfAuthorIsNotLoggedIn} from "../middlewares.js";
import multer from "multer";

const router = express.Router();

const upload = multer({
  storage: DEFAULT_MULTER_STORAGE,
  limits: {
    fileSize: 51200 // 50 kb
  }
});

export function renderProfilePage(req, res, locals = {}) {
  let title = `${req.profile.username} - `;

  switch(locals.activeTab) {
    case "settings": title += "Settings"; break;
    case "home": title += "Home"; break;
    default: title += "Profile"
  }

  res.render("profile", {
    ...getDefaultPageLocals(req),
    title,
    profile: req.profile,
    ...locals
  })
}

async function fetchAuthorProfile(req, res, next) {
  let username = req.params.username;

  if (
    isAuthorLoggedIn(req) && 
    req.author.username === username
  ) {
    req.profile = req.author;
  } 
  else req.profile = await AUTHORS_COLL.findOne({ username });

  if (!req.profile) next(createErrorResponse(404));
  else next();
}

router.use("/:username", fetchAuthorProfile);
router.use(
  "/:username/*",
  redirectIfAuthorIsNotLoggedIn(303),
  fetchAuthorProfile, 
  (req, res, next) => {
    if (req.profile._id.toString() !== req.author._id.toString()) {
      return res.redirect(303, "/");
    }
    next();
  }
);

router.get("/:username/settings", (req, res) => {
  renderProfilePage(req, res, {
    activeTab: "settings"
  })
});

router.post(
  "/:username/change-:form",
  upload.single("picture"),
  express.urlencoded({extended: false}),
  async (req, res, next) => {
    let updates = {};
    let form = req.params.form;
    let updateResult;

    function handleUpdateError(e = {}) {
      let errorMsg = (
        e.code === 121 ? VALIDATION_ERROR_MESSAGE :
        e.code === 11000 ? getDuplicatedUsernameErrorMessage(req.body.username) :
        "Failed to update your profile."
      );
      if(form === "picture") deleteUploadedFile(req.file);
      reload(errorMsg);
    }

    function reload(alertMessage, alertVariant) {
      let url = `/author/${req.author.username}/settings`;
      if(alertMessage) {
        url += `?alertMessage=${alertMessage}`;
        if(alertVariant) {
          url += `&alertVariant=${alertVariant}`;
        }
      }
      res.redirect(303, url);
    }

    switch(form) {
      case "picture":
        if(!req.file) return reload();
        updates = {pictureSrc: generateUploadedFilePath(req.file)};
        break;
      
      case "password":
        if(req.body.oldPassword !== req.author.password) {
          return reload("Old password is incorrect");
        }
        updates = {password: req.body.password};
        break;

      case "username":
        updates = {username: req.body.username};
        break;
      
      case "details":
        updates = {
          about: req.body.about,
          socialMediaLinks: {
            facebook: req.body.facebook,
            instagram: req.body.instagram,
            linkedin: req.body.linkedin,
            x: req.body.x
          }
        }
        break;

      default:
        return next(createErrorResponse(404));
    }

    try {
      updateResult = await AUTHORS_COLL.updateOne({_id: req.author._id}, {
        $set: updates
      })
      if(updateResult.modifiedCount === 1) {
        if(form === "picture") {
          deleteFileFromUploadsDir(req.author.pictureSrc);
        }
        req.author = Object.assign(req.author, updates);
        reload("Profile updated successfully.", "success");
      }
      else handleUpdateError();
    }
    catch(e) {
      handleUpdateError(e);
    }
  }
)

router.get("/:username/logout", (req, res) => {
  res.cookie(AUTHOR_ID_COOKIE_NAME, "", {
    maxAge: 0,
  })
  res.redirect(302, "/");
})

router.get("/:username", (req, res) => {
  renderProfilePage(req, res, {
    activeTab: "home"
  })
});

export default router;
