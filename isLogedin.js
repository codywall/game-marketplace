const express = require('express');
const router = express.Router();



/* GET users listing. */
console.log("isLogedin");
router.get('/', function(req, res, next) {
    console.log("inside function")
    if (req.session.authenticated) {
        console.log("in");
        res.status(200).send("in");
    }
    else {
        console.log("out");
        res.status(200).send("out");
    }
});

module.exports = router;