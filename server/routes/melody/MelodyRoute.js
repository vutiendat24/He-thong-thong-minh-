

const express = require("express")
const MelodyPage = express.Router()

const exploreRouter = require("./MelodySub/explore.js")
const PostRouter = require("./MelodySub/post.js")
const profileRouter = require("./MelodySub/profile.js")
const searchRouter = require("./MelodySub/search.js")
const loginRouter = require("./MelodySub/login.js")

const trackingRouter = require("./MelodySub/tracking.js")

const messageRouter = require("./MelodySub/messenger.js")
const notifyRouter = require("./MelodySub/notification.js")
const ReportRouter = require("./Admin/Report.js")
const DashboarRouter = require("./Admin/Dashboard.js")
const UsersRouter = require("./Admin/UsersManagement.js")
const HotContentRouter = require("./Admin/HotContent.js")

MelodyPage.use("/notify", notifyRouter)
MelodyPage.use("/explore", exploreRouter )
MelodyPage.use("/post", PostRouter )
MelodyPage.use("/profile", profileRouter )
MelodyPage.use("/search", searchRouter )
MelodyPage.use("/auth", loginRouter )
MelodyPage.use("/tracking", trackingRouter )
MelodyPage.use("/messenger", messageRouter)
MelodyPage.use("/admin", ReportRouter )
MelodyPage.use("/admin", DashboarRouter )
MelodyPage.use("/admin", UsersRouter )
MelodyPage.use("/admin", HotContentRouter )

module.exports =  MelodyPage

