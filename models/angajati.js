const mongoose = require('mongoose');

const schemaAngajati = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  nume: {
    type: String,
    required: true
  },
  prenume: {
    type: String,
    required: true
  },
  pozitie: {
    type: String,
    required: true
  },
  verificator: {
    type: Boolean,
    required: true
  },
  receptie :{
    type: Boolean,
    required: true
  },
  supervizor: {
    type: Boolean,
    required: true
  },
  parola: {
    type: String,
    required: false
  }
});

module.exports = mongoose.model('angajati', schemaAngajati);