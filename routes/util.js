const express = require('express');
const router = express.Router();

const Angajati = require("../models/angajati");
const user = require("../user");



router.get("/setup", async (req, res) => {
  await Angajati.delete().exec();
  
  try {
    const new_user = new Angajati;
    new_user = user;
    await new_user.save();

    res.sendStatus(200);
  } catch(error) {
    console.log("Error commencing auto-setup!");
    console.error(error);

    res.status(500).send(error);
  }
});

module.exports = router;