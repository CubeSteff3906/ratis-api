const Loturi = require("../models/loturi");

const finalizeazaLot = async function (lot) {

    const dataFinalizare = new Date();
    // Durata in productie
    let timpTotalExecutie = 0;
    const duratePeUtilaje = lot.timpDeExecutieOperatie;
    duratePeUtilaje.forEach(durata => {
      timpTotalExecutie += durata;
    })
    timpTotalExecutie = parseInt(timpTotalExecutie);
    const nrOre = parseInt(timpTotalExecutie / 3600); // numarul de ore intregi din comanda
    timpTotalExecutie -= (nrOre * 3600); //numarul de secunde ramas fara acele ore
    const nrMinute = parseInt(timpTotalExecutie / 60);
  
    // Durata comenzii ca atare
    let durataComanda = parseInt((dataFinalizare - lot.dataInitiere)/1000);
    const nrOreComanda = parseInt(durataComanda / 3600);
    durataComanda -= (nrOre * 3600);
    const nrMinuteComanda = parseInt(durataComanda / 60);
    
    // Informatia finala
    const timpDeExecutieTotal = "Executia comenzii a durat " + nrOreComanda + " ore si " + nrMinuteComanda +
    " minute, din care aproximativ " + nrOre + " ore si " + nrMinute + " minute a petrecut in Productie.";
  
    // Creeam o piesaFinalizata cu informatiile pieseiInCurs
  
    const filtruLot = { _id: lot._id };
    const updateLot = {
      $set: {
        Stadiu_lot: "Finalizat",
        dataFinalizare: dataFinalizare,
        rezumatOperatiiFinalizate: lot.rezumatOperatiiFinalizate,
        timpDeExecutieTotal: timpDeExecutieTotal
      }
    };
    await Loturi.updateOne(filtruLot, updateLot).exec();
  }

  module.exports = finalizeazaLot;