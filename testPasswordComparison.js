// testPasswordComparison.js
const bcrypt = require('bcryptjs')

const password = 'defaultpassword1234' // Password from request body
const storedHash =
    '$2a$10$u66qUCh7H9zU5XORsCQhlOOtWWvHuOWioJbQWHqnpNa8.o39Segae' // Hash from your DB

bcrypt
    .compare(password, storedHash)
    .then((isMatch) => {
        console.log('Password match:', isMatch) // Should be true if passwords are identical
    })
    .catch((error) => console.log(error))
