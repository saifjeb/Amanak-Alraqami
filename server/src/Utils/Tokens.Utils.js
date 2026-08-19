import jwt from "jsonwebtoken";

export const generateAccessToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            nickname: user.nickname
           }, process.env.JWT_SECRET,
         {expiresIn: "15m"}
        )
}

export const generateRefreshToken = (user) => {
      return jwt.sign(
        { 
            id: user.id},
             process.env.REFRESH_SECRET,
         {expiresIn: "30d"}
        )

}