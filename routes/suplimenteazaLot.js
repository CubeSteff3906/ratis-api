const Operatii = require('../models/operatii2');
const Loturi = require('../models/loturi');

const suplimenteazaLot = async function (lot) {

    let stadiuOperatie = ["NULL"];
    let cantitatePieseFinalizate = [lot.cantitateRebut];
    let setupTerminat = [];
    let inspectiePrimaPiesa = [];
  
    const vectorOperatii = await Operatii.find().exec();
    
    for (let i = 1; i <= vectorOperatii.length; i++) {
      stadiuOperatie.push("NULL");
      cantitatePieseFinalizate.push(-1);
      setupTerminat.push(null);
      inspectiePrimaPiesa.push(null);
    }

    for (let i = 1; i <= vectorOperatii.length; i++) { // Itereaza prin valorile select urilor din form
      if (lot.stadiuOperatie[i] === "Finalizata") {
        stadiuOperatie[i] = "In asteptare";
        cantitatePieseFinalizate[i] = 0;
        setupTerminat[i] = false;
        inspectiePrimaPiesa[i] = false;
      }
    }
    
    const datetime = new Date();
    let data = datetime.toString();
    data = data.slice(0, 10);
  
    let cod = lot._id;
    let codFinal;
  
    let text = lot.Identificator;
    if (text.slice(text.length-7, text.length) !== "(Rebut)") {
      text += "(Rebut)";
      codFinal = cod + "-R1";
    } else {
      codFinal = cod.slice(0, cod.length - 1) + (+cod[cod.length - 1] + 1);
    }
  
    const lotRebut = new Loturi({
      _id: codFinal,
      Data: data,
      Stadiu_lot: "In creare",
      Identificator: text,
      Termen_Livrare: lot.Termen_Livrare,
      Cod_reper: lot.Cod_reper,
      Denumire: lot.Denumire,
      Numar_Lot: lot.Numar_Lot + "-A",
      cantitateaTotala: lot.cantitateRebut,
      Desen: lot.Desen,
      Revizie: lot.Revizie,
      Dimensiune_Semifabricat: lot.Dimensiune_Semifabricat,
      Certificat_Calitate: lot.Certificat_Calitate,
      cantitateRebut: 0,
      esteNecesaraOperatia: lot.esteNecesaraOperatia,
      stadiuOperatie: stadiuOperatie,
      setupTerminat: setupTerminat,
      inspectiePrimaPiesa: inspectiePrimaPiesa,
      cantitatePieseFinalizate: cantitatePieseFinalizate,
      cantitatePieseInCurs: lot.cantitatePieseInCurs,
      angajatOperatie: lot.angajatOperatie,
      utilajOperatie: lot.utilajOperatie,
      dataInitiere: new Date()
    })
    lotRebut.save();
  }
  
  module.exports = suplimenteazaLot;