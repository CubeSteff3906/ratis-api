const express = require('express');
const router = express.Router();

const Angajati = require('../models/angajati');
let Operatii = require('../models/operatii2');
const Loturi = require('../models/loturi');
const Utilaje = require('../models/utilaje');

const suplimenteazaLot = require('./suplimenteazaLot');
const finalizeazaLot = require("./finalizeazaLot");

const executaOperatie = async function (Identificator, idAngajat, operatieSelectata, tipOperatie, utilajSelectat, nrRebut) {

  const filtruLot = { _id: Identificator };
  const filtruAngajat = { _id: idAngajat };

  const vectorOperatii = await Operatii.find().exec();
  const vOperatie = [...vectorOperatii];
  const numarOperatii = vectorOperatii.length;

  if (operatieSelectata > numarOperatii) {
    operatieSelectata = numarOperatii;
  }

  const angajatCurent = await Angajati.findOne(filtruAngajat).exec();
  let lot = await Loturi.findOne(filtruLot).exec();

  let update = {};
  // Se calculeaza operatia precedenta si cea succesiva celei curente in queue-ul operatiilor comenzii
  let operatiePrecedenta = operatieSelectata - 1;
  while (lot.stadiuOperatie[operatiePrecedenta] === "NULL" && operatiePrecedenta > 0) {
    operatiePrecedenta--;
  }
  let operatieUlterioara = operatieSelectata + 1;
  while (lot.stadiuOperatie[operatieUlterioara] === "NULL") {
    operatieUlterioara++;
  }

  let operatie = await Operatii.findOne({ id: operatieSelectata }).exec();
  
  // Constructia obiectelor de update in functie de tipul operatiei
  if (tipOperatie === "Setup") {
    

    console.log("Initiere-Finalizare la ", vOperatie[operatieSelectata - 1]);

    let setupTerminat = lot.setupTerminat;
    setupTerminat[operatieSelectata] = true;

    let date = new Date();
    let data = date.toString();

    const ziua = data.slice(8, 10) + data.slice(3, 7) + data.slice(10, 15);
    const ora = data.slice(15, 24);

    const rezumatOperatieCurenta = angajatCurent.nume + " a terminat setup-ul pentru operatia de " +
    (operatie.nume).toLowerCase() + " pe data de " + ziua + " la ora " + ora + ".";

    update = {
      $set: {
        'setupTerminat': setupTerminat
      },
      $push: {
        'rezumatOperatiiFinalizate': rezumatOperatieCurenta
      }
    };
  } else if (tipOperatie === "InitiereFinalizare") {

    console.log("Initiere-Finalizare la ", vOperatie[operatieSelectata - 1]);

    let rebutDacaExista = lot.cantitateRebut;

    if (nrRebut === null || nrRebut == 0) {
      nrRebut = 0;
    }

    rebutDacaExista += nrRebut;

    let date = new Date();
    let data = date.toString();

    const ziua = data.slice(8, 10) + data.slice(3, 7) + data.slice(10, 15);
    const ora = data.slice(15, 24);

    const rezumatOperatieCurenta = angajatCurent.nume + " a marcat ca finalizata operatia de " +
    (operatie.nume).toLowerCase() + " pe data de " + ziua + " la ora " + ora + ".";

    const cantitatePieseFinalizate = lot.cantitatePieseFinalizate;
    cantitatePieseFinalizate[operatieSelectata] = cantitatePieseFinalizate[operatiePrecedenta];
    cantitatePieseFinalizate[operatiePrecedenta] = 0;

    const stadiuOperatie = lot.stadiuOperatie;
    stadiuOperatie[operatieSelectata] = "Finalizata";

    update = {
      $set: {
        'cantitatePieseFinalizate': cantitatePieseFinalizate,
        'stadiuOperatie': stadiuOperatie,
        'cantitateRebut': nrRebut
      },
      $push: {
        'rezumatOperatiiFinalizate': rezumatOperatieCurenta
      }
    };
  } else if (tipOperatie === "Inspectie") {

    console.log("Inspectie la ", vOperatie[operatieSelectata - 1]);
    let inspectiePrimaPiesa = lot.inspectiePrimaPiesa;
    inspectiePrimaPiesa[operatieSelectata] = true;

    let date = new Date(); 
    let data = date.toString();

    const ziua = data.slice(8, 10) + data.slice(3, 7) + data.slice(10, 15);
    const ora = data.slice(15, 24);

    const rezumatOperatieCurenta = angajatCurent.nume + " a marcat ca trecuta inspectia dupa operatia de " +
    (operatie.nume).toLowerCase() + " pe data de " + ziua + " la ora " + ora + ".";

    update = {
      $set: {
        'inspectiePrimaPiesa': inspectiePrimaPiesa
      },
      $push: {
        'rezumatOperatiiFinalizate': rezumatOperatieCurenta
      }
    }
  } else if (tipOperatie === "Initiere") {

    // Cand initiem o operatie, pornim intotdeauna cu numarul de piese care au trecut prin toate operatiile
    // precedente si asteapta operatia noastra.
    const cantitatePieseInCurs = lot.cantitatePieseInCurs;
    cantitatePieseInCurs[operatieSelectata] = lot.cantitatePieseFinalizate[operatiePrecedenta];

    const stadiuOperatie = lot.stadiuOperatie;
    stadiuOperatie[operatieSelectata] = "In lucru";

    const angajatOperatie = lot.angajatOperatie;
    angajatOperatie[operatieSelectata] = angajatCurent.nume;

    const utilajOperatie = lot.utilajOperatie;
    utilajOperatie[operatieSelectata] = utilajSelectat;

    const dataInitiereOperatie = lot.dataInitiereOperatie;
    dataInitiereOperatie[operatieSelectata] = new Date();

    update = {
      $set: {
        'cantitatePieseInCurs': cantitatePieseInCurs,
        'stadiuOperatie': stadiuOperatie,
        'angajatOperatie': angajatOperatie,
        'utilajOperatie': utilajOperatie,
        'dataInitiereOperatie': dataInitiereOperatie
      }
    };

    // Piesele ce au fost preluate in noua operatie, trebuie sa nu mai figureze in cea precedenta:
    const cantitatePieseFinalizate = lot.cantitatePieseFinalizate;
    cantitatePieseFinalizate[operatiePrecedenta] = 0;
    await Loturi.updateOne(filtruLot, { $set: { 'cantitatePieseFinalizate': cantitatePieseFinalizate } }).exec();

  } else if (tipOperatie === "Finalizare") {

    // Am folosit utilajSelectat pentru a trimite numarul pieselor finalizate

    // numar = numarul de piese deja gata + numarul de piese gata acum
    const numar = lot.cantitatePieseFinalizate[operatieSelectata] + parseInt(utilajSelectat);
    
    // numarPieseNeterminate (dar nu stricate) = cu cate am inceput - cate am terminat - cate am stricat
    const numarPieseNeterminate = lot.cantitatePieseInCurs[operatieSelectata] - utilajSelectat - nrRebut;
    
    const dataFinalizareOperatie = new Date();

    operatie = await Operatii.findOne({ id: operatieSelectata }).exec();

    let rezumatOperatieCurenta;

    let data1;
    let ziua1;
    let ora1;

    rezumatOperatieCurenta = angajatCurent.nume + " a terminat " + utilajSelectat +
    " x " + lot.Denumire + " dupa operatia de " + (operatie.nume).toLowerCase();

    if (lot.utilajOperatie[operatieSelectata] !== "NULL" && lot.utilajOperatie[operatieSelectata] !== null ) {
      rezumatOperatieCurenta = rezumatOperatieCurenta + " la utilajul " + lot.utilajOperatie[operatieSelectata];
    }
    
    data1 = (lot.dataInitiereOperatie[operatieSelectata]).toString();
    ziua1 = data1.slice(8, 10) + data1.slice(3, 7) + data1.slice(10, 15);
    ora1 = data1.slice(15, 24);

    let data2 = dataFinalizareOperatie.toString();
    const ziua2 = data2.slice(8, 10) + data2.slice(3, 7) + data2.slice(10, 15);
    const ora2 = data2.slice(15, 24);
    
    rezumatOperatieCurenta = rezumatOperatieCurenta + ". A inceput operatia pe data de " + ziua1 + " la ora" + ora1 +
    " si a terminat pe data de " + ziua2 + " la ora" + ora2 + ".";

    if (nrRebut > 0) {
      rezumatOperatieCurenta += "S-au dat in rebut " + nrRebut + " produse.";
    }

    const timpDeExecutieOperatie = (dataFinalizareOperatie - lot.dataInitiereOperatie[operatieSelectata]) / 1000;

    let setupTerminat = lot.setupTerminat;

    let inspectiePrimaPiesa = lot.inspectiePrimaPiesa;

    let stadiu;
    if (numarPieseNeterminate > 0) {
      stadiu = "In asteptare";
      inspectiePrimaPiesa[operatieSelectata] = false;
      setupTerminat[operatieSelectata] = false;
    } else {
      stadiu = "Finalizata";
      setupTerminat[operatieSelectata] = null;
      inspectiePrimaPiesa[operatieSelectata] = null;
    }

    // Mai am de efectuat operatieSelectata pentru toate piesele pe care nu le-am terminat dar nici nu le-am stricat
    const cantitatePieseInCurs = lot.cantitatePieseInCurs;
    cantitatePieseInCurs[operatieSelectata] = 0;

    // Noul numar de piese ce au finalizat operatieSelectata este cel existent + cate am terminat acum
    // De asemenea, cele pe care le-am stricat trebuie mentionate la 0 pentru a putea incepe din nou productia pentru
    // ele
    const cantitatePieseFinalizate = lot.cantitatePieseFinalizate;
    cantitatePieseFinalizate[operatieSelectata] = numar;
    cantitatePieseFinalizate[operatiePrecedenta] = numarPieseNeterminate;

    // Cate am stricat in total = cate am stricat deja + cate am stricat acum
    let cantitateRebut = lot.cantitateRebut;
    cantitateRebut += parseInt(nrRebut);

    const stadiuOperatie = lot.stadiuOperatie;
    stadiuOperatie[operatieSelectata] = stadiu;
 
    let angajatOperatie = lot.angajatOperatie;
    let utilajOperatie = lot.utilajOperatie;

    // if (cantitatePieseFinalizate[operatieSelectata] === lot.cantitateaTotala - lot.cantitateRebut) {
      angajatOperatie[operatieSelectata] = "Niciunul";
      utilajOperatie[operatieSelectata] = "Niciunul";
    // }

    update = {
      $set: {
        'cantitateRebut': cantitateRebut,
        'cantitatePieseInCurs': cantitatePieseInCurs,
        'cantitatePieseFinalizate': cantitatePieseFinalizate,
        'stadiuOperatie': stadiuOperatie,
        'setupTerminat': setupTerminat,
        'angajatOperatie': angajatOperatie,
        'utilajOperatie': utilajOperatie,
        'inspectiePrimaPiesa': inspectiePrimaPiesa
      },
      $push: {
        'rezumatOperatiiFinalizate': rezumatOperatieCurenta,
        'timpDeExecutieOperatie': timpDeExecutieOperatie
      }
    };

  }

  try{
    await Loturi.updateOne(filtruLot, update).exec();
  } catch (err) {
    console.log(err);
  }

  lot = await Loturi.findOne(filtruLot).exec();
  let op = lot.esteNecesaraOperatia;
  let l;
  op.forEach((nume, index) => {
    if (op[index] === true) {
      l = index;
    }
  })

  if (lot.cantitateaTotala - lot.cantitateRebut === lot.cantitatePieseFinalizate[l]) {
    if (lot.cantitateRebut > 0 ) {
      suplimenteazaLot(lot);
    }
    finalizeazaLot(lot);
  }
}


router.get('/', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const angajat = await Angajati.findOne({ _id: idAngajat }).exec();
  let nume = angajat.prenume;
  nume = nume.toUpperCase();
  res.render('angajat', {idAngajat, nume } );
})

router.post('/', async (req, res) => {
  const idAngajat = req.body.idAngajat;
  const Identificator = req.body.idLot;
  const angajat = await Angajati.findOne({ _id: idAngajat }).exec();
  let nume = angajat.nume;
  nume = nume.toUpperCase();
  const lot = await Loturi.findOne({ _id: Identificator }).exec();
  if (lot) {
    if (lot.Stadiu_lot === "Finalizat" || lot.Stadiu_lot === "Finalizata") {
      res.redirect(`/popup?idAngajat=${idAngajat}&tipEroare=comandaLipsa&nume=${nume}`);
    } else {
      res.redirect(`/angajat/operatii-piesa?idAngajat=${idAngajat}&Identificator=${Identificator}`);
    }
  } else {
    res.redirect(`/popup?idAngajat=${idAngajat}&tipEroare=comandaLipsa&nume=${nume}`);
  }
})

router.get('/operatii-piesa', async (req, res) => {
  const Identificator = req.query.Identificator;
  const idAngajat = req.query.idAngajat;
  const vectorOperatii = await Operatii.find().exec();
  let denumiriOperatii = ['NULL'];
  vectorOperatii.forEach(operatie => {
    denumiriOperatii.push(operatie.nume);
  });
  let index = 0;
  const loturi = await Loturi.find({ _id: Identificator }).exec();
  const piesaCurenta = loturi[0];
  const angajatCurent = await Angajati.findOne({ _id: idAngajat }).exec();
  res.render('angajat/operatii-piesa', { Identificator, idAngajat, piesaCurenta, denumiriOperatii, index, angajatCurent });
})

router.post('/operatii-piesa', async(req, res) => {
  const idAngajat = req.body.idAngajat;
  const Identificator = req.body.idPiesa;
  const operatieCurenta = req.body.operatieCurenta;
  const tipOperatie = req.body.tipOperatie;

  res.redirect(`./meniu-operatie?Identificator=${Identificator}&idAngajat=${idAngajat}&operatieCurenta=${operatieCurenta}&tipOperatie=${tipOperatie}`);
})


router.get('/meniu-operatie', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const Identificator = req.query.Identificator;
  const tipOperatie = req.query.tipOperatie;

  const vectorOperatii = await Operatii.find().exec();
  let denumiriOperatii = ['NULL'];
  vectorOperatii.forEach(operatie => {
    denumiriOperatii.push(operatie.nume);
  });

  const lot = await Loturi.findOne({ _id: Identificator }).exec();

  let indexOperatieCurenta = req.query.operatieCurenta;
  const operatieCurenta = denumiriOperatii[indexOperatieCurenta];
  let indexOperatiePrecedenta = indexOperatieCurenta - 1;
  while (lot.cantitatePieseFinalizate[indexOperatiePrecedenta] === -1) {
    indexOperatiePrecedenta--;
  }

  const utilajeDisponibile = [];
  const vectorUtilaje = await Utilaje.find().exec();
  vectorUtilaje.forEach(utilaj => {
    const vector = utilaj.operatii;
    if (vector.includes(denumiriOperatii[indexOperatieCurenta])) {
      utilajeDisponibile.push(utilaj.nume);
    }
  });

  const angajat = await Angajati.findOne({ _id: idAngajat }).exec();
  const numeAngajat = angajat.nume;

  res.render('angajat/meniu-operatie', { Identificator, idAngajat, operatieCurenta, indexOperatieCurenta, indexOperatiePrecedenta, tipOperatie, numeAngajat, lot, Utilaje: utilajeDisponibile });
})

router.get('/meniu-operatie2', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const Identificator = req.query.idPiesa;
  const tipOperatie = req.query.tipOperatie;
  const operatieCurenta = req.query.operatieCurenta;
  const index = req.query.index;
  const nrRebut = req.query.nrRebut;

  const lot = await Loturi.findOne({ _id: Identificator}).exec();

  res.render('angajat/meniu-operatie2', { Identificator, idAngajat, operatieCurenta, index, tipOperatie, lot, nrRebut });
})

router.get('/meniu-operatie3', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const Identificator = req.query.idPiesa;
  const tipOperatie = req.query.tipOperatie;
  const operatieCurenta = req.query.operatieCurenta;
  const index = req.query.index;
  const nrRebut = req.query.nrRebut;
  const nrFin = req.query.nrFin;

  const lot = await Loturi.findOne({ _id: Identificator }).exec();

  res.render('angajat/meniu-operatie3', { Identificator, idAngajat, operatieCurenta, index, tipOperatie, lot, nrRebut, nrFin });
})

router.post('/meniu-operatie3', async (req, res) => {
  const idAngajat = req.body.idAngajat;
  const Identificator = req.body.idPiesa;
  const tipOperatie = req.body.tipOperatie;
  const index = req.body.index;
  const nrRebut = req.body.nrRebut;
  const nrFin = req.body.nrFin;

  await executaOperatie(Identificator, idAngajat, index, tipOperatie, nrFin, nrRebut);

  res.redirect(`/`);
})

module.exports = router;