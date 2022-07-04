module.exports = ArcadeInviteTemplate = (app, mod, invite, idx) => {
  //console.log("ARCADEINVITETEMPLATE");
  //console.log(invite);

  let gameModule = app.modules.returnModule(invite.msg.game);
  /*for (let i = 0; i < app.modules.mods.length; i++) {
    if (app.modules.mods[i].name === slug) { 
      slug = app.modules.mods[i].returnSlug(); 
    }
  }*/
  //
  // gameslug given game
  //
  let slug = gameModule.returnSlug();


  let inviteTypeClass = "open-invite";

  let game_initialized = 0;
  if (invite.isMine) { inviteTypeClass = "my-invite"; }
  if (invite.msg) {
    if (invite.msg.options['game-wizard-players-select'] <= invite.msg.players.length) {
      game_initialized = 1;
    }
    if (invite.msg.players_needed <= invite.msg.players.length) {
      game_initialized = 1;
    }
  }
  console.log("Arcade invite template");
  console.log(JSON.parse(JSON.stringify(invite.msg)));
  //console.log("Game_initialized: " + game_initialized);
  //
  // trying to stop games from continue / cancel on load
  //
  //console.log(app.options.games);
  if (app.options) {
    if (app.options.games) {
      for (let i = 0; i < app.options.games.length; i++) {
      	if (app.options.games[i].initializing == 1) {
      	  game_initialized = 0;
      	}
      }
    }
  }
  //console.log("Game_initialized: " + game_initialized);
  let playersNeeded = invite.msg.players_needed > 4 ? 5: invite.msg.players_needed;
  let playersHtml = `<div class="playerInfo" style="">`;
  if (invite.msg.players.length > invite.msg.players_needed) {
    for (let i = 0; i < invite.msg.players.length; i++) {
      let identicon = app.keys.returnIdenticon(invite.msg.players[i]);
      playersHtml += `<div class="player-slot tip id-${invite.msg.players[i]}"><img class="identicon" src="${identicon}"><div class="tiptext">${app.browser.returnAddressHTML(invite.msg.players[i])}</div></div>`;
    }
  } else {
    for (let i = 0; i < invite.msg.players_needed; i++) {
      //if (i < 4) {
        if (i < invite.msg.players.length) {
          let identicon = app.keys.returnIdenticon(invite.msg.players[i]);
          playersHtml += `<div class="player-slot tip id-${invite.msg.players[i]}"><img class="identicon" src="${identicon}"><div class="tiptext">${app.browser.returnAddressHTML(invite.msg.players[i])}</div></div>`;
        } else {
          playersHtml += `<div class="player-slot identicon-empty"></div>`;  
        }
      /*} else {
        playersHtml += `<div style="color:#f5f5f59c;margin-left:0.2em;" class="player-slot-ellipsis fas fa-ellipsis-h"></div>`;  
        break;
      }*/
    }
  }
  playersHtml += '</div>';

  if (document.getElementById(`invite-${invite.transaction.sig}`)) { return ''; }
  let bannerBack = gameModule.respondTo("arcade-carousel")?.background || `/${slug}/img/arcade.jpg`;
  let gameBack = gameModule.respondTo("arcade-games")?.img || `/${slug}/img/arcade.jpg`;

  let inviteHtml = `
    <div id="invite-${invite.transaction.sig}" class="arcade-tile i_${idx} ${inviteTypeClass}" style="background-image: url('${bannerBack}');">
      <div class="invite-tile-wrapper">
        <div class="game-inset-img" style="background-image: url('${gameBack}');"></div>
        <div class="invite-col-2">
          <div class="gameName">${invite.msg.game}</div>
          <div class="gamePlayers">${playersHtml}</div>
        </div>
        <div class="gameShortDescription">${makeDescription(app, invite)}</div>
	<div class="gameButtons">
    `;
     if (invite.isMine) {
       if (game_initialized == 1) { 
         inviteHtml += `<button data-sig="${invite.transaction.sig}" data-cmd="continue" class="button invite-tile-button">CONTINUE</button>`;
       }else{
          inviteHtml += `<div class="button_with_icon"><i class="fas fa-link link_icon private"></i>`;          
          if (invite.transaction.from[0].add == app.wallet.returnPublicKey()){
            inviteHtml += `<button data-sig="${invite.transaction.sig}" data-cmd="${(invite.msg.request == "private")?"publicize":"invite"}" class="button invite-tile-button">${(invite.msg.request == "private")?"PRIVATE":"PUBLIC"}</button></div>`;  
          }
        }
       inviteHtml += `<button data-sig="${invite.transaction.sig}" data-cmd="cancel" class="button invite-tile-button">CANCEL</button>`;
     } else {
       if (game_initialized == 1) {
         inviteHtml += `<button data-sig="${invite.transaction.sig}" data-cmd="continue" class="button invite-tile-button">WATCH</button>`;
         //inviteHtml += `<button data-sig="${invite.transaction.sig}" data-cmd="cancel" class="button invite-tile-button">CANCEL</button>`;
       } else {
         inviteHtml += `<button data-sig="${invite.transaction.sig}" data-cmd="join" class="button invite-tile-button invite-tile-button-join">JOIN</button>`;
       }
     }

  inviteHtml += `
        </div>
      </div>
    </div>
    `;

  return inviteHtml;
}


/* 
  This could use some improvement since some games have a lot of options...
*/
let makeDescription = (app, invite) => {

  let html = '';

  if (invite.msg) {
    let gameModule = app.modules.returnModule(invite.msg.game);
    if (gameModule && gameModule !== "Arcade") {
      let sgoa = gameModule.returnShortGameOptionsArray(invite.msg.options);
      for (let i in sgoa) {
        html += `<div class="gameShortDescriptionRow"><div class="gameShortDescriptionKey">${i.replace(/_/g, ' ')}`;
        if (sgoa[i] !== null){
          html += `: </div><div class="gameShortDescriptionValue">${sgoa[i]}</div></div>`;
        }else{
          html += `</div></div>`
        }
      }
    }
  } 

  return html;

}


