const express = require("express");

const router = express.Router();

router.get("/:province", async (req, res) => {

    const province = req.params.province;

    res.send(`
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>AgriPredict</title>

<script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>

</head>

<body style="font-family:sans-serif;text-align:center;padding-top:80px">

<h2>จังหวัด ${province}</h2>

<p>กำลังเชื่อมต่อ...</p>

<script>

async function start(){

    await liff.init({
        liffId:"2009633390-g8hIM7oO"
    });

    if(!liff.isLoggedIn()){

        liff.login();

        return;

    }

    const profile = await liff.getProfile();

    console.log(profile);

}

start();

</script>

</body>

</html>
`);

});

module.exports = router;
