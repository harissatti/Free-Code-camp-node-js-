// index.js

require('dotenv').config();
const connectDb = require("./db/connect");
const express = require('express');
const cors = require('cors');
const dns = require("dns");
const urlparser = require("url");
const app = express();
require("dotenv").config();

// Basic Configuration
const mongoURI = process.env.MONGO_URI;

(async () => {
  try {
    const db = await connectDb(mongoURI);

    if (!db) {
      console.error("Failed to connect to the database");
      return;
    }

    const urls = db.collection("urls");

    if (!urls) {
      console.error("Failed to access the 'urls' collection");
      return;
    }

    const port = process.env.PORT || 3000;
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use(cors());

    app.use('/public', express.static(`${process.cwd()}/public`));

    app.get('/', function (req, res) {
      res.sendFile(process.cwd() + '/views/index.html');
    });

    app.post('/api/shorturl', async function (req, res) {
      const url = req.body.url;
      const dnslookup = await new Promise((resolve) => {
        dns.lookup(urlparser.parse(url).hostname, (err, address) => {
          resolve(address);
        });
      });

      if (!dnslookup) {
        res.json({ error: "invalid URL" });
      } else {
        const urlCount = await urls.countDocuments({});
        const urlDoc = {
          url,
          short_url: urlCount
        };

        const result = await urls.insertOne(urlDoc);
        console.log(result);
        res.json({ original_url: url, short_url: urlCount });
      }
    });
    app.get("/api/shorturl/:shorturl",async(req,res)=>{
      const shorturl=req.params.shorturl;
      console.log(shorturl);
      const urlDoc=await urls.findOne({short_url: +shorturl});
      console.log(urlDoc);
      res.redirect(urlDoc.url);
    })

    app.listen(port, () => {
      console.log(`listening at port ${port}...`);
    });
  } catch (error) {
    console.error("Error in the main try-catch block:", error);
  }
})();
