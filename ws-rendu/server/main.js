import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { HTTP } from 'meteor/http';
import { Mongo } from 'meteor/mongo'
import { SERVER_CONFIG } from './server-config.js';

const Like = new Mongo.Collection('like');
const Languages = new Mongo.Collection('languages');

let baseurl = SERVER_CONFIG.themoviedb_api_config.base_url;
let apikey = SERVER_CONFIG.themoviedb_api_config.api_key;
let language = SERVER_CONFIG.themoviedb_api_config.language;
const urlDeBase = baseurl + 'discover/movie?api_key=' + apikey + '&language=' + language;
const urlGenres = baseurl + 'genre/movie/list?api_key=' + apikey + '&language=' + language;
const urlSearch = baseurl + 'search/movie?api_key=' + apikey + '&language=' + language;
const urlLanguages = baseurl + 'configuration/languages?api_key=' + apikey;

Meteor.startup(() => {});

WebApp.connectHandlers.use('/api/favLanguage', (req, res, next) => {
  if (!Languages.findOne()) {
    Languages.insert({ langIso: 'fr', langName: 'French' });
  }
  res.writeHead(200);
  res.end(JSON.stringify(Languages.findOne()));
});

WebApp.connectHandlers.use('/api/languages', (req, res, next) => {
  switch (req.method) {
    case 'GET':
      HTTP.call(
        'GET',
        urlLanguages,
        {},
        (error, response) => {
          let dbResp = response.data;
          res.writeHead(200);
          res.end(JSON.stringify(dbResp));
        }
      );
      break;
    case 'PUT':
      let params = urlSplit(req.originalUrl);
      let languageIso = '';
      let languageName = '';
      params.forEach((param) => {
        switch (param[0]) {
          case 'iso':
            languageIso = param[1];
            break;
          case 'name':
            languageName = param[1];
            break;
          default:
            break;
        }
      });
      let newPreferedLanguage = updatePreferedLanguage(languageIso, languageName);
      res.writeHead(200);
      res.end(JSON.stringify(newPreferedLanguage));
      break;
    default:
      break;
  }
});

WebApp.connectHandlers.use('/api/genres', (req, res, next) => {
  HTTP.call(
    'GET', 
    urlGenres,
    {},
    (error, response) => {
      let genres = response.data;
      res.writeHead(200);
      res.end(JSON.stringify(genres));
    }
  );
});

WebApp.connectHandlers.use('/api/like', (req, res, next) => {
  switch (req.method) {
    case 'GET':
      break;
    case 'PUT':
      let idMovie = req.url.split('/')[1];
      let newMovieLikes = updateLikeMovie(parseInt(idMovie));
      res.writeHead(200);
      res.end(JSON.stringify(newMovieLikes));
      break;
    default:
      break;
    }
  }
);

WebApp.connectHandlers.use('/api/search', (req, res, next) => {
  let params = urlSplit(req.originalUrl);
  let urlFinal = urlSearch;
  let page = '';
  let input = '';

  params.forEach(param => {
    switch (param[0]) {
      case 'page':
        page = param[1];
        urlFinal += '&page=' + page;
        break;
      case 'input':
        input = param[1];
        urlFinal += '&query=' + input;
        break;
      default:
        break;
    }
  });

  HTTP.call(
    'GET', 
    urlFinal,
    {},
    (error, response) => {
      res.writeHead(200);
      res.end(JSON.stringify(response.data));
    }
  );
});

/**
 * Étant donné qu'à chaque nouvelle fonctionnalité de filtrage, on devait rajouter entre 
 * 2 et 5 fonctions pour gérer les filtrages multiples, nous avons décidé de tout refactoriser
 * pour avoir une fonction qui les gère tous, peu importe l'ordre/le nombre de filtres
 * 
 * D'où la fonction urlSplit(url) qui permet de récupérer les paramètres de l'url
 * */
WebApp.connectHandlers.use('/api/films', (req, res, next) => {
  let page = '';
  let filtre = '';
  let genre = '';
  let date = '';
  let activeLanguage = '';
  let params = urlSplit(req.originalUrl);
  let urlFinal = urlDeBase;

  params.forEach(param => {
    switch (param[0]) {
      case 'page':
        page = param[1];
        urlFinal += '&page=' + page;
        break;
      case 'filtre':
        filtre = param[1];
        switch (filtre) {
          case 'pod':
            filtre = 'popularity.desc';
            break;
          case 'poc':
            filtre = 'popularity.asc';
            break;
          default:
            break;
        }
        urlFinal += '&sort_by=' + filtre;
        break;
      case 'genre':
        genre = param[1];
        urlFinal += '&with_genres=' + genre;
        break;
      case 'date':
        date = param[1];
        urlFinal += '&primary_release_year=' + date;
        break;
      case 'activeLanguage':
        activeLanguage = param[1];
        urlFinal += '&with_original_language=' + activeLanguage;
        break;
      default:
        break;
    }
  });

  HTTP.call(
    'GET', 
    urlFinal,
    {},
    (error, response) => {
      let newResp = response.data;
      newResp.results.forEach((movie) => {
        let resource = Like.findOne({ id: movie.id });
        movie.like = resource ? resource.like : 0;
      });
      res.writeHead(200);
      res.end(JSON.stringify(newResp));
    }
  );
});

function urlSplit(url) {
  let urlParams = url.split('?')[1].split('&');
  let params = [];
  urlParams.forEach(param => {
    params.push(param.split('='));
  });
  return params;
}

function updateLikeMovie(idMovie) {
  let resource = Like.findOne({ id: idMovie });
  if (resource) {
    Like.update(
      { id: idMovie }, 
      { $inc: { like: 1 } }
    );
  } else {
    Like.insert(
      { id: idMovie,
        like: 1 }
    );
  }
  return Like.findOne({ id: idMovie });
}

function updatePreferedLanguage(languageIso, languageName) {
  let resource = Languages.findOne();
  if (resource) {
    Languages.update(
      { langIso: resource.langIso },
      { langIso: languageIso, langName: languageName });
  } else {
    Languages.insert({ langIso: languageIso, langName: languageName });
  }
  return Languages.findOne();
}