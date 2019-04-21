var icons = {};

icons.unlocked = '<svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="lockAltOpenIconTitle lockAltOpenIconDesc" stroke="#000000" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter" fill="none" color="#000000"><path d="M7,7.625 L7,7 C7,4.23857625 9.23857625,2 12,2 L12,2 C14.7614237,2 17,4.23857625 17,7 L17,11"/> <rect width="14" height="10" x="5" y="11"/> <circle cx="12" cy="16" r="1"/> </svg>';

icons.locked = '<svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="lockAltIconTitle lockAltIconDesc" stroke="#000000" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter" fill="none" color="#000000">  <rect width="14" height="10" x="5" y="11"/> <path d="M12,3 L12,3 C14.7614237,3 17,5.23857625 17,8 L17,11 L7,11 L7,8 C7,5.23857625 9.23857625,3 12,3 Z"/> <circle cx="12" cy="16" r="1"/> </svg>';

icons.edit = '<svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="settingsIconTitle settingsIconDesc" stroke="#000000" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter" fill="none" color="#000000"> <path d="M5.03506429,12.7050339 C5.01187484,12.4731696 5,12.2379716 5,12 C5,11.7620284 5.01187484,11.5268304 5.03506429,11.2949661 L3.20577137,9.23205081 L5.20577137,5.76794919 L7.9069713,6.32070904 C8.28729123,6.0461342 8.69629298,5.80882212 9.12862533,5.61412402 L10,3 L14,3 L14.8713747,5.61412402 C15.303707,5.80882212 15.7127088,6.0461342 16.0930287,6.32070904 L18.7942286,5.76794919 L20.7942286,9.23205081 L18.9649357,11.2949661 C18.9881252,11.5268304 19,11.7620284 19,12 C19,12.2379716 18.9881252,12.4731696 18.9649357,12.7050339 L20.7942286,14.7679492 L18.7942286,18.2320508 L16.0930287,17.679291 C15.7127088,17.9538658 15.303707,18.1911779 14.8713747,18.385876 L14,21 L10,21 L9.12862533,18.385876 C8.69629298,18.1911779 8.28729123,17.9538658 7.9069713,17.679291 L5.20577137,18.2320508 L3.20577137,14.7679492 L5.03506429,12.7050339 Z"/> <circle cx="12" cy="12" r="1"/> </svg>';

icons.remote = '<svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="downloadIconTitle downloadIconDesc" stroke="#000000" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter" fill="none" color="#000000">  <path d="M12,3 L12,16"/> <polyline points="7 12 12 17 17 12"/> <path d="M20,21 L4,21"/> </svg>';

icons.update = '<svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="rotateIconTitle rotateIconDesc" stroke="#000000" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter" fill="none" color="#000000">  <path d="M22 12l-3 3-3-3"/> <path d="M2 12l3-3 3 3"/> <path d="M19.016 14v-1.95A7.05 7.05 0 0 0 8 6.22"/> <path d="M16.016 17.845A7.05 7.05 0 0 1 5 12.015V10"/> <path stroke-linecap="round" d="M5 10V9"/> <path stroke-linecap="round" d="M19 15v-1"/> </svg>';

icons.converter = '<svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="shuffleIconTitle shuffleIconDesc" stroke="#000000" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter" fill="none" color="#000000"> <path d="M21,8 L17.7707324,8 C15.816391,8 13.9845112,8.95183403 12.8610966,10.5510181 L10.7972528,13.4889058 C9.67383811,15.0880899 7.84195835,16.0399239 5.88761696,16.0399239 L2,16.0399239"/> <path d="M21,16.0399239 L17.7707324,16.0399239 C15.816391,16.0399239 13.9845112,15.0880899 12.8610966,13.4889058 L10.7972528,10.5510181 C9.67383811,8.95183403 7.84195835,8 5.88761696,8 L3,8"/> <polyline points="20 6 22 8 20 10 20 10"/> <polyline points="20 14 22 16 20 18 20 18"/> </svg>';

  // var datasets_url = '../config/datasets2.json';
  var datasets_url = "http://www.laastutabloo.ee:5000/datasets";
  var providers_url = "../config/providers.json";
  

function getIcon(id,color,tooltip){

  if(color == "red"){
    color = "red";
  } else if(color == "green"){
    color = "#2cff00";
  }

  var icon = icons[id].replace("#000000",color);
  icon = icon.replace("<svg","<span title='"+ tooltip +"'><svg class='svg_icons'");
  icon = icon.replace("</svg>","</svg></span>");

  return icon;

}


function create_header(){

    var html = [];
    html.push('<img src="images/logo.png" style="width: 80%;"/>');

	$("#header").html(html);

}


$( document ).ready(function() {

	$(".navbar").load("nav.html"); 

});


