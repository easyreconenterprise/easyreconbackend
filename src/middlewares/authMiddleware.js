// /* global process */

// import jwt from "jsonwebtoken";

// const authenticateUser = (req, res, next) => {
//   console.log("AuthenticateUser middleware executed");
//   const token = req.headers.authorization;

//   console.log("Received token:", token);

//   if (!token || !token.startsWith("Bearer ")) {
//     // Check for 'Bearer ' prefix
//     console.log("Unauthorized - Token missing or invalid format");
//     return res.status(401).json({ error: "Unauthorized" });
//   }

//   try {
//     const decodedToken = jwt.verify(
//       token.replace("Bearer ", ""),
//       process.env.JWT_SECRET
//     );

//     // req.user = decodedToken; // Add the authenticated user details to the request object
//     // next();

//     console.log("Decoded Token:", decodedToken);

//     // Set decodedToken on the request object
//     req.decodedToken = decodedToken;

//     // Check if the token payload includes the 'sub' property (user ID)
//     const userId = decodedToken.user && decodedToken.user._id;

//     if (!userId) {
//       console.log("Unauthorized - User ID not found in token");
//       return res.status(403).json({ error: "User ID not found in token" });
//     }

//     req.user = { id: userId };
//     console.log("Authenticated user:", req.user);

//     next();
//   } catch {
//     console.log("Unauthorized - Invalid token");
//     return res.status(401).json({ error: "Invalid token" });
//   }
// };

// export default authenticateUser;
const jwt = require('jsonwebtoken')

const authenticateUsers = (req, res, next) => {
    console.log('AuthenticateUser middleware executed')

    // Extract token from Authorization header
    const authHeader = req.headers.authorization
    console.log('Authorization header:', authHeader)

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Unauthorized - Token missing or invalid format')
        return res
            .status(401)
            .json({ error: 'Unauthorized - Token missing or invalid format' })
    }

    const token = authHeader.split(' ')[1]
    console.log('Token:', token)

    try {
        // Verify the token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
        console.log('Decoded Token:', decodedToken)

        // Attach user information to the request object
        req.user = decodedToken.user

        if (!req.user || !req.user._id) {
            console.log('Unauthorized - User ID not found in token')
            return res
                .status(403)
                .json({ error: 'Unauthorized - User ID not found in token' })
        }

        next()
    } catch (error) {
        console.log('Unauthorized - Invalid token', error)
        return res.status(401).json({ error: 'Unauthorized - Invalid token' })
    }
}

module.exports = authenticateUsers
