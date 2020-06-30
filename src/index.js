import $ from "jquery";
import L from "./leaflet.js";
import _ from "lodash";

import "./styles.css";
import "./leaflet.css";
import "./algolia.css";

import algoliasearch from "algoliasearch/lite";
import instantsearch from "instantsearch.js";

import { connectGeoSearch } from "instantsearch.js/es/connectors";

import {
  searchBox,
  configure,
  refinementList,
  clearRefinements,
  hits
} from "instantsearch.js/es/widgets";

const searchClient = algoliasearch(
  "T2ZX9HO66V",
  "b6b9b5e4e0d0aa9dd71349d4ff994dac"
);

const search = instantsearch({
  indexName: "ark-map",
  searchClient
});

function rlat(mlat) {
  return (mlat - 8) / 84.0;
}

function rlon(mlon) {
  return (mlon - 10) / 79.5;
}

function mlat(lat) {
  return lat * 84.0 + 8;
}

function mlon(lon) {
  return lon * 79.5 + 10;
}

function getAObj(obj, name) {
  for (let e in obj) {
    if (obj[e].name === name) return obj[e].value;
  }
  return 0;
}

L.Projection.NoWrap = {
  project: function(latlng) {
    return new L.Point(latlng.lng, latlng.lat);
  },
  unproject: function(point, unbounded) {
    return new L.LatLng(point.y, point.x, true);
  }
};

L.CRS.Direct = L.Util.extend({}, L.CRS, {
  code: "Direct",
  projection: L.Projection.NoWrap,
  transformation: new L.Transformation(1, 0, 1, 0)
});

window.numonly = function numonly(myfield, e, dec) {
  var key;
  var keychar;
  if (window.event) key = window.event.keyCode;
  else if (e) key = e.which;
  else return true;
  keychar = String.fromCharCode(key);
  // control keys
  if (
    key == null ||
    key === 0 ||
    key === 8 ||
    key === 9 ||
    key === 13 ||
    key === 27
  )
    return true;
  // numbers
  else if ("0123456789".indexOf(keychar) > -1) return true;
  // decimal point jump
  else if (dec && keychar === ".") {
    myfield.form.elements[dec].focus();
    return false;
  } else return false;
};

window.iconpref = function iconpref(value) {
  document.getElementById("iconprev").style.backgroundImage =
    "url(" + markerIconTypes[value].options.iconUrl + ")";
};

let markers = [];

let mapIcons = [];
mapIcons[0] = "Pin";
mapIcons[1] = "Dungeon";
mapIcons[2] = "Home";
mapIcons[3] = "Target";
mapIcons[4] = "Spawn";
mapIcons[5] = "Enemy";
mapIcons[6] = "Pet";
mapIcons[7] = "Carnivore";
mapIcons[8] = "Herbivore";
mapIcons[9] = "Berry";
mapIcons[10] = "Metal";
mapIcons[11] = "Wood";
mapIcons[12] = "Mountain";
mapIcons[13] = "Cave";
mapIcons[14] = "Underwater";
mapIcons[15] = "Obelisk";
mapIcons[16] = "Beacon loot crate";
mapIcons[17] = "Note";
mapIcons[18] = "Dossier";
mapIcons[19] = "Cave loot crate";
mapIcons[20] = "Cave entrance";
mapIcons[21] = "Deep sea or desert loot crate";
mapIcons[22] = "Artifact";
mapIcons[23] = "Player note";
mapIcons[24] = "Oil Rock";
mapIcons[25] = "Metal Deposit";
mapIcons[26] = "River Rock";
mapIcons[27] = "Rich Metal Deposit";
mapIcons[28] = "Silica Deposit";
mapIcons[29] = "Obsidian Deposit";
mapIcons[30] = "Crystal Deposit";

let markerIconTypes = [];
for (var i in mapIcons) {
  var icon = mapIcons[i];
  markerIconTypes[i] = L.icon({
    iconUrl: "./src/img/icons/" + icon.replace(/ /g, "_") + ".png",
    iconSize: [24, 30],
    iconAnchor: [12, 30],
    popupAnchor: [0, -30]
  });
}

var popup = L.popup({ closeButton: false });

function removeMarkerE(lat, lon) {
  for (let e in markers) {
    var tmpm = markers[e].getLatLng();
    if (tmpm.lat === lat && tmpm.lng === lon) {
      map.removeLayer(markers[e]);
    }
  }
}

window.addMarkerText = function addMarkerText(lat, long) {
  var message =
    '<div id="iconprev" style="background-image:url(\'' +
    markerIconTypes[0].options.iconUrl +
    '\');"></div><form id="addmark" method="post" action="https://api.apify.com/v2/acts/87ZoafhqSwzg8d7O5/runs?token=jfyMRD2LaBA4NTZmbcKHXxuW5">' +
    '<select class="bg-white focus:outline-none focus:shadow-outline border border-gray-300 rounded-lg py-2 px-4 block w-full appearance-none leading-normal" name="icon" onchange="iconpref(this.value)">';
  for (var i in mapIcons) {
    message += '<option value="' + i + '">' + mapIcons[i] + "</option>";
  }
  message =
    message +
    '</select><input class="bg-white focus:outline-none focus:shadow-outline border border-gray-300 rounded-lg py-2 px-4 block w-full appearance-none leading-normal" type="text" name="title" value="Title">' +
    '<textarea class="bg-white focus:outline-none focus:shadow-outline border border-gray-300 rounded-lg py-2 px-4 block w-full appearance-none leading-normal" name="desc">Description</textarea>' +
    '<table><tr><td>lat:<input class="bg-white focus:outline-none focus:shadow-outline border border-gray-300 rounded-lg py-2 px-4 block w-full appearance-none leading-normal" type="text" name="mlat" value="' +
    Math.round(mlat(lat) * 1000) / 1000 +
    '" onKeyPress="return numonly(this,event)"></td><td>lng:<input class="bg-white focus:outline-none focus:shadow-outline border border-gray-300 rounded-lg py-2 px-4 block w-full appearance-none leading-normal" type="text" style="" name="mlon" value="' +
    Math.round(mlon(long) * 1000) / 1000 +
    '" onKeyPress="return numonly(this,event)"></td></tr></table><input class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" type="submit"></form>';

  var ltn = {};
  ltn.lat = lat;
  ltn.lng = long;
  popup
    .setLatLng(ltn)
    .setContent(message)
    .openOn(map);

  $("#addmark").submit(function(e) {
    e.preventDefault(); //STOP default action

    var postData = $(this).serializeArray();
    var lat = rlat(getAObj(postData, "mlat"));
    var lng = rlon(getAObj(postData, "mlon"));

    var json = {};
    json["title"] = getAObj(postData, "title");
    json["description"] = getAObj(postData, "desc");
    json["icon"] = _.toNumber(getAObj(postData, "icon"));
    json["category"] = "Player note";
    json["_geoloc"] = { lat, lng };
    json["location"] = {
      lat: getAObj(postData, "mlat"),
      lng: getAObj(postData, "mlon")
    };
    json["objectID"] = lat + "" + lng;
    json["iconUrl"] = markerIconTypes[getAObj(postData, "icon")].iconUrl;

    var formURL = $(this).attr("action");
    $.ajax({
      url: formURL,
      type: "POST",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify(json),
      success: function(data, textStatus, jqXHR) {
        popup._close();
        var newMarker = L.marker(
          { lat: lat, lng: lng },
          { icon: markerIconTypes[getAObj(postData, "icon")] }
        );
        newMarker.bindPopup(
          "<b>" +
            getAObj(postData, "titel") +
            "</b><br><span>lat: " +
            getAObj(postData, "mlat") +
            " - lng: " +
            getAObj(postData, "mlon") +
            "</span><br>" +
            getAObj(postData, "desc") +
            "<br><button onclick='removeMarker(" +
            lat +
            "," +
            lng +
            ")'>Remove marker</button>"
        );
        newMarker.addTo(map);
        markers.push(newMarker);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        //if fails
        alert("unable to add marker :(");
      }
    });
    e.preventDefault(); //STOP default action
  });
};

window.removeMarker = function removeMarker(lat, long) {
  var message =
    '<form id="remmark" method="post" action="https://hooks.zapier.com/hooks/catch/2182073/orpgmyo">' +
    '<input type="hidden" name="lat" value="' +
    lat +
    '"><input type="hidden" name="long" value="' +
    long +
    '"><input type="submit" value="Yes, Delete!" name="delete"></form>';
  var ltn = {};
  ltn.lat = lat;
  ltn.lng = long;
  popup
    .setLatLng(ltn)
    .setContent(message)
    .openOn(map);

  $("#remmark").submit(function(e) {
    var postData = $(this).serializeArray();
    postData.push({ name: "delete", value: "true" });
    var lat = getAObj(postData, "lat");
    var lon = getAObj(postData, "long");

    var formURL = $(this).attr("action");
    $.ajax({
      url: formURL,
      type: "POST",
      data: postData,
      success: function(data, textStatus, jqXHR) {
        popup._close();
        removeMarkerE(lat, lon);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        //if fails
        alert("unable to remove marker :(");
      }
    });
    e.preventDefault(); //STOP default action
  });
};

// Create the render function
let map = null;
let isUserInteraction = false;

const renderGeoSearch = (renderOptions, isFirstRendering) => {
  const {
    items,
    currentRefinement,
    refine,
    clearMapRefinement,
    widgetParams
  } = renderOptions;

  const { initialZoom, initialPosition, container } = widgetParams;

  if (isFirstRendering) {
    const element = document.createElement("div");
    element.style.height = "100%";

    map = L.map(element, { crs: L.CRS.Direct });

    L.tileLayer(
      "https://res.cloudinary.com/hilnmyskv/image/upload/v1589286709/ark-map/{z}/{x}/{y}.png",
      {
        minZoom: 1,
        maxZoom: 6,
        tms: true,
        attribution: "ARK: The Island",
        continousWorld: true,
        noWrap: true,
        detectRetina: true
      }
    ).addTo(map);

    map.on("moveend", () => {
      if (isUserInteraction) {
        const ne = map.getBounds().getNorthEast();
        const sw = map.getBounds().getSouthWest();

        refine({
          northEast: { lat: ne.lat, lng: ne.lng },
          southWest: { lat: sw.lat, lng: sw.lng }
        });
      }
    });

    map.on("click", function(e) {
      var lat = Math.abs(e.latlng.lat);
      var long = e.latlng.lng;

      var llat = mlat(lat);
      var llong = mlon(long);

      let message =
        "Latitude: " +
        Math.round(llat) +
        " | " +
        "Longitude: " +
        Math.round(llong) +
        '<button class="mt-4 block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onclick="addMarkerText(' +
        lat +
        "," +
        long +
        ')">Add marker here</button>';
      popup
        .setLatLng(e.latlng)
        .setContent(message)
        .openOn(map);
    });

    const button = document.createElement("button");
    button.textContent = "Clear the map refinement";
    button.addEventListener("click", () => {
      clearMapRefinement();
    });

    container.appendChild(element);
    container.appendChild(button);
  }

  container.querySelector("button").hidden = !currentRefinement;

  if (markers.length) {
    markers.forEach(marker => map.removeLayer(marker));
  }

  markers = items.map(
    ({ _geoloc, title, icon, description, category, location }) => {
      let iconUrl;
      if (category === "Player note") {
        iconUrl = markerIconTypes[icon];
      } else {
        iconUrl = markerIconTypes[mapIcons.indexOf(category)];
      }
      return L.marker({ lat: _geoloc.lat, lng: _geoloc.lng }, { icon: iconUrl })
        .bindPopup(
          "<b>" +
            title +
            "</b><br><span>lat: " +
            location.lat +
            " - lng: " +
            location.lng +
            "</span><br>" +
            (description || "") +
            "<button class='mt-4 block bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow' onclick='removeMarker(" +
            _geoloc.lat +
            "," +
            _geoloc.lng +
            ")'>Remove marker</button>"
        )
        .addTo(map);
    }
  );

  isUserInteraction = false;
  if (!currentRefinement && markers.length) {
    map.fitBounds(L.featureGroup(markers).getBounds(), {
      animate: false
    });
  } else if (!currentRefinement) {
    map.setView(initialPosition, initialZoom, {
      animate: false
    });
  }
  isUserInteraction = true;
};

// Create the custom widget
const customGeoSearch = connectGeoSearch(renderGeoSearch);

search.addWidgets([
  configure({
    hitsPerPage: 1000
  }),
  searchBox({
    container: "#searchbox"
  }),
  refinementList({
    container: "#refinement-list",
    attribute: "category",
    sortBy: ["name:asc"],
    limit: 20
  }),
  clearRefinements({
    container: "#clear-refinements"
  }),
  hits({
    container: "#hits",
    cssClasses: {
      item: "mb-2 border border-solid"
    },
    templates: {
      item(hit) {
        let icon;
        if (hit.category === "Player note") {
          icon = markerIconTypes[hit.icon].options.iconUrl;
        } else {
          icon =
            markerIconTypes[mapIcons.indexOf(hit.category)].options.iconUrl;
        }
        return (
          `
          <div class="w-100 p-2 flex items-center">
          <span class="inline-flex h-8 w-8 mr-2 items-center">
            <img width="24" height="30" class="m-auto" src="` +
          icon +
          `" alt="` +
          mapIcons[hit.icon || 0] +
          `"/>
          </span>
          <div>
          <div class="text-xl">
            ${instantsearch.highlight({ attribute: "title", hit })}
          </div>
          <div class="text-gray-500">
            ${instantsearch.highlight({ attribute: "description", hit })}
          </div>
          </div>
          </div>
        `
        );
      }
    }
  }),
  customGeoSearch({
    container: document.querySelector("#geo-search"),
    initialZoom: 1,
    initialPosition: {
      lat: 0.5,
      lng: 0.5
    }
  })
]);

search.start();

search.setUiState({
  "ark-map": {
    refinementList: {
      category: ["Player note", "Cave entrance", "Obelisk"]
    }
  }
});
