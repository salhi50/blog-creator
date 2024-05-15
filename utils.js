import fs from "node:fs";
import path from "node:path";
import {
  UPLOADS_BASE_PATH,
  UPLOADS_DIR,
  AUTHOR_ID_COOKIE_NAME
} from "./constants.js";

export function createErrorResponse(status = 500, headers = {}) {
  const err = new Error();
  err.status = status;
  err.headers = headers;
  return err;
}

export function isAuthorLoggedIn(req) {
  return req.author !== null;
}

export function setAuthorIdCookie(res, id) {
  res.cookie(AUTHOR_ID_COOKIE_NAME, id, {
    sameSite: "lax",
    secure: true,
    httpOnly: true,
    maxAge: 604_800_000 // 1 week
  });
}

export function extractTags(tagsStr = "") {
  let tags = new Set();
  tagsStr.split(",").forEach((part) => {
    let tag = part.trim().toLowerCase();
    if (tag !== "") tags.add(tag);
  });
  return Array.from(tags);
}

export function deleteFileFromUploadsDir(urlPath) {
  if (typeof urlPath === "string" && urlPath.startsWith(UPLOADS_BASE_PATH)) {
    fs.rm(path.resolve(UPLOADS_DIR, path.basename(urlPath)), () => {});
  }
}

export function deleteUploadedFile(file) {
  if(file) {
    fs.rm(file.path, () => {});
  }
}

export function getDuplicatedUsernameErrorMessage(username) {
  return `Sorry, the username "${username}" is already taken. Please choose another.`;
}

export function generateUploadedFilePath(file) {
  return `${UPLOADS_BASE_PATH}/${file.filename}`;
}

export function getDefaultPageLocals(req) {
  return {
    author: req.author,
    alert: {
      message: req.query.alertMessage,
      variant: req.query.alertVariant
    },
  }
}

export function generatePagination(totalItems, itemsPerPage, activePage) {
  const numPages = Math.ceil(totalItems / itemsPerPage);
  let arr = [],
    i;

  if (numPages <= 0 || activePage > numPages || activePage < 1) return arr;

  if (numPages <= 5) {
    for (i = 1; i <= numPages; i++) arr.push(i);
    return arr;
  }

  if (activePage < 5) {
    return [1, 2, 3, 4, null, numPages];
  } else if (activePage >= numPages - 3) {
    arr = [1, null];
    for (i = numPages - 3; i <= numPages; i++) arr.push(i);
    return arr;
  }

  return [1, null, activePage - 1, activePage, activePage + 1, null, numPages];
}
