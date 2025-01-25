// testHashGeneration.js
const bcrypt = require('bcryptjs')

const password = 'defaultpassword1234' // Password to hash
bcrypt
    .hash(password, 10)
    .then((hashedPassword) => {
        console.log('Generated hash:', hashedPassword)
    })
    .catch((error) => console.log('Error hashing password:', error))
