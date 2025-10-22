

const express = require("express")
const MelodyPage = express.Router()

const exploreRouter = require("./MelodySub/explore.js")
const PostRouter = require("./MelodySub/post.js")
const profileRouter = require("./MelodySub/profile.js")
const searchRouter = require("./MelodySub/search.js")
const loginRouter = require("./MelodySub/login.js")
const trackingRouter = require("./MelodySub/tracking.js")

MelodyPage.use("/explore", exploreRouter )
MelodyPage.use("/post", PostRouter )
MelodyPage.use("/profile", profileRouter )
MelodyPage.use("/search", searchRouter )
MelodyPage.use("/auth", loginRouter )
MelodyPage.use("/tracking", trackingRouter )


module.exports =  MelodyPage

