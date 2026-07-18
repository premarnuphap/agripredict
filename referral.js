const express = require("express");

const router = express.Router();

router.get("/:province", async (req, res) => {

    const province = req.params.province;

    res.send(`
        <html>

        <head>
            <title>เพิ่มเพื่อน</title>
        </head>

        <body style="font-family:sans-serif;text-align:center;padding-top:80px">

            <h2>จังหวัด ${province}</h2>

            <p>กดปุ่มด้านล่างเพื่อเพิ่มเพื่อน LINE</p>

            <a href="https://line.me/R/ti/p/@YOUR_LINE_ID">
                <button
                    style="
                        font-size:22px;
                        padding:15px 35px;
                        cursor:pointer;
                    "
                >
                    เพิ่มเพื่อน LINE
                </button>
            </a>

        </body>

        </html>
    );

});

module.exports = router;
