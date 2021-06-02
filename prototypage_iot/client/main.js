import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';
import { HTTP } from 'meteor/http';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

var temp_collection = new Mongo.Collection('temp');
var hum_collection = new Mongo.Collection('hum');

var highTempHasPublished = new ReactiveVar(false);
var lowTempHasPublished = new ReactiveVar(false);
var stateLed = new ReactiveVar(false);

Template.temp.helpers({
  // Fonction permettant d'accéder aux données de température côté HTML
  temp() {
    // Quand la fonctionnalité de stockage en masse des données
    // sera opérationnelle, récupération des 10 dernières données
    // pour remplir un graphe
    // var temp = temp_collection.find().limit(10);
    var temp = temp_collection.find();
    temp.forEach((t) => {
      // Traitement de la donnée de température et envoi d'un appel
      // HTTP sur le bon endpoint pour envoyer un message au broker, 
      // sur le canal de la LED, pour lui demander de s'allumer ou
      // de s'éteindre
      if (parseFloat(t.celsius.value) >= 30.00) {
        if (!highTempHasPublished.get()) {
          HTTP.call(
            'GET',
            'http://localhost:3000/high_temp',
            {},
            () => {
              highTempHasPublished.set(true);
              lowTempHasPublished.set(false);
              stateLed.set(true);
            }
          );
        }
      } else {
        if (!lowTempHasPublished.get()) {
          HTTP.call(
            'GET',
            'http://localhost:3000/low_temp',
            {},
            () => {
              highTempHasPublished.set(false);
              lowTempHasPublished.set(true);
              stateLed.set(false);
            }
          );
        }
      }
    })
    return temp;
  }
});

// Souscription à la fonction asyncrhone de meteor
// permettant de recevoir de la donnée de manière asynchrone
Template.temp.onCreated(function () {
  this.subscribe('publish_temp');
});

// Fonction permettant d'accéder aux données d'humidité côté HTML
Template.hum.helpers({
  hum() {
    var hum = hum_collection.find();
    return hum;
  }
});

Template.hum.onCreated(function () {
  this.subscribe('publish_hum');
});

Template.led.events({
  'click #addButton'() {
    console.log("toto");
    if (!stateLed.get()) {
      HTTP.call(
        'GET',
        'http://localhost:3000/high_temp',
        {},
        () => {
          stateLed.set(true);
        }
      );   
    } else {
        HTTP.call(
          'GET',
          'http://localhost:3000/low_temp',
          {},
          () => {
            
            stateLed.set(false);
          }
        );
    } 
  }
})

Template.led.helpers({
  stateLed() {
    return stateLed.get();
  }
});
