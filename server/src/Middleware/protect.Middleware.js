import jwt from "jsonwebtoken"
import { asyncHandler } from "./asyncHandler.Middleware.js"

export const protect = asyncHandler(async (req, res, next) => {
    try {
        let tokens = req.cookies.refreshTokens || req.headers.authorization.split(" ")[1]
        if (!tokens) {
            return res.status(401).json({ message: "no tokens" })
        }
        const decoded = await jwt.verify(tokens, process.env.REFRESH_SECRET)
        req.user = decoded
        console.log("req.user", req.user);

        next()
    } catch (error) {
        return res.status(500).json({ message: "internal server error protect" })
    }
})