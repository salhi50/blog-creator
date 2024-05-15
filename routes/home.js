import express from "express";
import {extractTags, generatePagination, getDefaultPageLocals} from "../utils.js"
import isNumber from "is-number";
import { AUTHORS_COLL, BLOGS_COLL } from "../constants.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const BLOGS_PER_PAGE = 12;
  const searchParams = req.query;

  // MongoDB Query
  let query = {};
  let queryOptions = {
    sort: {
      _id: 1
    },
    limit: BLOGS_PER_PAGE,
    projection: {
      bodyMarkdown: 0
    }
  }
  // Passed as locals when rendering the home page
  let params = {
    search: "",
    sort: "newest",
    tags: [],
    authorUsername: "",
    page: 1
  }
  let blogs = [];
  let blogsCount = 0;
  let pagination = [];

  function renderHomePage() {
    res.render("home", {
      ...getDefaultPageLocals(req),
      title: "All blogs",
      blogs,
      blogsCount,
      pagination,
      params,
    })
  }

  if(
    typeof searchParams.search === "string" &&
    searchParams.search.trim() !== ""
  ) {
    query.$text = {$search: searchParams.search};
    params.search = searchParams.search;
  }

  if(searchParams.sort === "oldest") {
    queryOptions.sort._id = -1;
    params.sort = "oldest";
  }

  if(searchParams.tags) {
    let tags = extractTags(searchParams.tags);
    if(tags.length > 0) {
      params.tags = tags;
      query.tags = {$in: tags};
    }
  }

  if(searchParams.authorUsername) {
    let author = await AUTHORS_COLL.findOne({
      username: searchParams.authorUsername
    });
    params.authorUsername = searchParams.authorUsername;
    if(!author) {
      return renderHomePage();
    }
    query.authorId = author._id;
  }

  if(isNumber(searchParams.page)) {
    let page = Number(searchParams.page);
    if(page > 1) {
      queryOptions.skip = (page - 1) * BLOGS_PER_PAGE;
      params.page = page;
    }
  }

  blogsCount = await BLOGS_COLL.countDocuments(query);
  blogs = await BLOGS_COLL.find(query, queryOptions).toArray();
  for(let i = 0; i < blogs.length; i++) {
    blogs[i].author = await AUTHORS_COLL.findOne({
      _id: blogs[i].authorId
    })
  }
  pagination = generatePagination(blogsCount, BLOGS_PER_PAGE, params.page);

  renderHomePage();

});

export default router;
