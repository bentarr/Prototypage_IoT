import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { HTTP } from 'meteor/http';

import './main.html';

var preferedLanguageIso = new ReactiveVar();
var preferedLanguageName = new ReactiveVar();
var languages = new ReactiveVar();
var nbPages = new ReactiveVar();
var movies = new ReactiveVar();
var nbFilms = new ReactiveVar();
var genres = new ReactiveVar();
var page = new ReactiveVar(1);
var date = new ReactiveVar();
var searchInput = new ReactiveVar();
var filtreActif = new ReactiveVar();
var idGenreActif = new ReactiveVar(0);
var filtreDate = new ReactiveVar(false);
var filtrePopulariteDecroissant = new ReactiveVar(false);
var filtrePopulariteCroissant = new ReactiveVar(false);
var filtreGenre = new ReactiveVar(false);
var filtreSearch = new ReactiveVar(false);

// [Template] Films



Template.films.onCreated(function filmsOnCreated() {
  recupererTousLesGenres();
  recupererLangagePrefere();
});

Template.films.helpers({
  movies() { return movies.get(); },
  doitSafficher() { return nbFilms.get() > 0; },
  preferedLanguageIso() { return preferedLanguageIso.get(); },
  preferedLanguageName() { return preferedLanguageName.get(); }
});

Template.films.events({
  //
});

// [Template] Pagination

Template.pagination.helpers({
  page() { return page.get(); },
  doitSafficher() { return nbPages.get() > 1; }
});

Template.pagination.events({
  'click #pagePrecedente'() {
    if (page.get() > 1) {
      page.set(page.get() - 1);
      if (filtreSearch.get()) {
        recupererTousLesFilmsRecherches();
      } else {
        recupererTousLesFilms();
      }
    }
  },
  'click #pageSuivante'() {
    if (page.get() < nbPages.get()) {
      page.set(page.get() + 1);
      if (filtreSearch.get()) {
        recupererTousLesFilmsRecherches();
      } else {
        recupererTousLesFilms();
      }
    }
  }
});

// [Template] Filtres

Template.filterselect.onCreated(function filtersOnCreated() {
  recupererTousLesLangages();
})

Template.filterselect.helpers({
  genres() { return genres.get(); },
  dateDefaultValue() { return date.get(); },
  inputDefaultValue() { return searchInput.get(); },
  languages() { return languages.get(); },
  preferedLanguageIso() { return preferedLanguageIso.get(); },
  preferedLanguageName() { return preferedLanguageName.get(); }
})

Template.filterselect.events({
  'change #filter'(event) {
    let id = event.target.value;
    page.set(1);
    filtrePopulariteCroissant.set(false);
    filtrePopulariteDecroissant.set(false);
    searchInput.set('');
    filtreSearch.set(false);
    if (id == 3) {
      // Popularité : par ordre croissant
      filtrePopulariteCroissant.set(true);
      filtreActif.set('poc');
    } else if (id == 4) {
      // Popularité : par ordre décroissant
      filtrePopulariteDecroissant.set(true);
      filtreActif.set('pod');
    }
    recupererTousLesFilms();
  },
  'change #genres'(event) {
    idGenreActif.set(event.target.value);
    page.set(1);
    searchInput.set('');
    filtreSearch.set(false);
    if (idGenreActif.get() == '') {
      filtreGenre.set(false);
    } else {
      filtreGenre.set(true);
    }
    recupererTousLesFilms();
  },
  'input #date'(event){
    date.set(event.target.value);
    page.set(1);
    searchInput.set('');
    filtreSearch.set(false);
    if (date.get() == null) {
      filtreDate.set(false);
    }
    if (date.get() != null){
      filtreDate.set(true);
    }
    recupererTousLesFilms();
  },
  'input #search'(event) {
    searchInput.set(event.target.value);
    page.set(1);
    date.set('');
    filtrePopulariteCroissant.set(false);
    filtrePopulariteDecroissant.set(false);
    filtreActif.set('');
    filtreGenre.set(false);
    idGenreActif.set(0);
    filtreSearch.set(false);
    if (searchInput.get() != '') {
      filtreSearch.set(true);
      recupererTousLesFilmsRecherches();
    } else {
      recupererTousLesFilms();
    }
  },
  'change #languages'(event) {
    preferedLanguageIso.set(event.target.value);
    preferedLanguageName.set($('#languages option:selected').text());
    updatePreferedLanguage(preferedLanguageIso.get(), preferedLanguageName.get());
    recupererTousLesFilms();
  }
})

// Fonctions

function recupererTousLesFilms() {
  let pageActuelle = page.get();
  let filtre = '';
  let genre = '';
  let dateActuelle = '';
  let activeLanguage = '';
  let url = 'http://localhost:3000/api/films?page=' + pageActuelle;

  if (filtrePopulariteDecroissant.get()) { 
    filtre = filtreActif.get(); 
    url += '&filtre=' + filtre;
  }
  if (filtrePopulariteCroissant.get()) { 
    filtre = filtreActif.get(); 
    url += '&filtre=' + filtre;
  }
  if (filtreGenre.get()) { 
    genre = idGenreActif.get(); 
    url += '&genre=' + genre;
  }
  if (filtreDate.get()) { 
    dateActuelle = date.get(); 
    url += '&date=' + dateActuelle; 
  }
  activeLanguage = preferedLanguageIso.get();
  url += '&activeLanguage=' + activeLanguage;

  HTTP.call(
    'GET',
    url,
    {},
    (error, response) => { 
      movies.set(JSON.parse(response.content).results); 
      nbPages.set(JSON.parse(response.content).total_pages);
      nbFilms.set(JSON.parse(response.content).total_results);
    }
  );
}

function recupererLangagePrefere() {
  HTTP.call(
    'GET',
    'http://localhost:3000/api/favLanguage',
    {},
    (error, response) => {
      preferedLanguageIso.set(JSON.parse(response.content).langIso);
      preferedLanguageName.set(JSON.parse(response.content).langName);
      recupererTousLesFilms();
    }
  );
}

function recupererTousLesLangages() {
  HTTP.call(
    'GET',
    'http://localhost:3000/api/languages',
    {},
    (error, response) => { languages.set(JSON.parse(response.content)); }
  );
}

function recupererTousLesFilmsRecherches() {
  HTTP.call(
    'GET',
    'http://localhost:3000/api/search?page=' + page.get() + '&input=' + searchInput.get(),
    {},
    (error, response) => { 
      movies.set(JSON.parse(response.content).results); 
      nbPages.set(JSON.parse(response.content).total_pages);
      nbFilms.set(JSON.parse(response.content).total_results);
    }
  );
}

function recupererTousLesGenres() {
  HTTP.call(
    'GET',
    'http://localhost:3000/api/genres',
    {},
    (error, response) => { genres.set(JSON.parse(response.content).genres); }
  );
}

function updatePreferedLanguage(languageIso, languageName) {
  HTTP.call(
    'PUT',
    'http://localhost:3000/api/languages?iso=' + languageIso + '&name=' + languageName,
    {},
    (error, response) => { 
      preferedLanguageIso.set(JSON.parse(response.content).langIso); 
      preferedLanguageName.set(JSON.parse(response.content).langName);
    }
  );
}

function updateLikeMovie(idMovie) {
  HTTP.call(
    'PUT', 
    'http://localhost:3000/api/like/' + idMovie,
    {},
    (error, response) => {
      let index = movies.get().findIndex(
        (item) => { return item.id === JSON.parse(response.content).id; }
      );
      let moviesList = movies.get();
      moviesList[index].like = JSON.parse(response.content).like;
      movies.set(moviesList);
    } 
  );
}