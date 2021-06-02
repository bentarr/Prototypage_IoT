import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

// Ajout de la dépendance mqtt asynchrone
var mqtt = require('async-mqtt');

Meteor.startup(() => {});

// Endpoint permettant d'envoyer un message sur le canal de la LED
// sur le broker pour l'allumer
WebApp.connectHandlers.use('/high_temp', async (req, res, next) => {
  try {
    // Connexion au broker
    const client = await mqtt.connectAsync("mqtt://test.mosquitto.org");
    // Publication sur le canal de la LED avec le payload pour l'allumage
    await client.publish('EPSI/DHT11/adresse_mac/led', "\{ value: 1 \}");
    res.writeHead(200);
    res.end();
  } catch (error) {
    console.log(error);
    process.exit();
  }
});

// Endpoint permettant d'envoyer un message sur le canal de la LED
// sur le broker pour l'éteindre
WebApp.connectHandlers.use('/low_temp', async (req, res, next) => {
  try {
    // Connexion au broker
    const client = await mqtt.connectAsync("mqtt://test.mosquitto.org");
    // Publication sur le canal de la LED avec le payload pour l'allumage
    await client.publish('EPSI/DHT11/adresse_mac/led', "\{ value: 0 \}");
    res.writeHead(200);
    res.end();
  } catch (error) {
    console.log(error);
    process.exit();
  }
});

// De manière asynchrone, récupération des données 
// du canal envoyées par le capteur de température et ajout dans la
// BDD, pour les récupérer côté client
Meteor.publish('publish_temp', function () {
  (async () => {
    // Connexion au broker
    const client = await mqtt.connectAsync("mqtt://test.mosquitto.org");
    // Souscription au canal de la température
    client.subscribe('EPSI/DHT11/adresse_mac/temp');
    let hasAdded = false;
    // Ajout dans la BDD des données
    client.on('message', (topic, message) => {
      if (hasAdded) {
        this.changed('temp', '0', { celsius: JSON.parse(message.toString()) });
      } else {
        this.added('temp', '0', { celsius: JSON.parse(message.toString()) });
        hasAdded = true;
      }
    });
    this.ready();
  })();
});

// De manière asynchrone, récupération des données 
// du canal envoyées par le capteur d'humidité et ajout dans la
// BDD, pour les récupérer côté client
Meteor.publish('publish_hum', function () {
  (async () => {
    // Connexion au broker
    const client = await mqtt.connectAsync("mqtt://test.mosquitto.org");
    // Souscription au canal de l'humidité
    client.subscribe('EPSI/DHT11/adresse_mac/hum');
    let hasAdded = false;
    // Ajout dans la BDD des données
    client.on('message', (topic, message) => {
      if (hasAdded) {
        this.changed('hum', '0', { humidity: JSON.parse(message.toString()) });
      } else {
        this.added('hum', '0', { humidity: JSON.parse(message.toString()) });
        hasAdded = true;
      }
    });
    this.ready();
  })();
});