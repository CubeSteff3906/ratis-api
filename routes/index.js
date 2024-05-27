const express = require('express');
const router = express.Router();

const Angajati = require('../models/angajati');
const Loturi = require('../models/loturi');
const Revizii = require('../models/revizii');
const Produse = require('../models/produse');

const bcrypt = require('bcryptjs');

router.get('/', async (req, res) => {
  res.render('index');
})

router.post('/', async (req, res) => {
  const idAngajat = req.body.idAngajat;
  const angajat = await Angajati.findOne({ _id: idAngajat });
  if (angajat) {
    if (angajat.pozitie === "Lucrator") {
      res.redirect(`/angajat?idAngajat=${idAngajat}`);
    } else if (angajat.pozitie === "Operator") {
      res.redirect(`/operator?idAngajat=${idAngajat}`);
    } else if (angajat.pozitie === "Administrator") {
      res.redirect(`/parola?idAngajat=${idAngajat}&privilegii=admin`  /*`/admin?idAngajat=${idAngajat}&privilegii=admin`*/); // Va redirectiona la admin/verifica-parola initial, dupa de acolo la /admin/
    } else {
      console.log('Angajatul nu are o pozitie valida');
    }
  } else {
    res.redirect(`/popup?tipEroare=angajatLipsa`);
  }
})

router.get('/popup', async (req, res) => {
  const tipEroare = req.query.tipEroare;
  const idAngajat = req.query.idAngajat;
  const nume = req.query.nume;
  res.render('popup', { tipEroare: tipEroare, nume, idAngajat });
})

router.get('/parola', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  res.render('parola', {idAngajat});
})

router.post('/parola', async (req, res) => {
  const idAngajat = req.body.idAngajat;
  const parola = req.body.parola;
  const angajat = await Angajati.findOne({ _id: idAngajat }).exec();
  if (angajat.parola === parola) {
    res.redirect(`/admin?idAngajat=${idAngajat}&privilegii=admin`);
  } else {
    res.redirect(`/popup?idAngajat=${idAngajat}&tipEroare=parolaIncorecta`)
  }
})

module.exports = router;