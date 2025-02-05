const GameCreateNewTemplate = require('./game-create-new.template.js');
const SaitoOverlay = require('./../../../../../lib/saito/new-ui/saito-overlay/saito-overlay');
const AdvancedOverlay = require("./game-create-advance-options");

class GameCreateNew {

  constructor(app, mod, game_mod, invite) {
    this.app = app;
    this.mod = mod;
    this.game_mod = game_mod;
    this.overlay = new SaitoOverlay(app, mod);
  }

  render(app, mod, invite) {
    this.overlay.show(app, mod, GameCreateNewTemplate(app, mod, this.game_mod, invite));
    
    let advancedOptions = this.game_mod.returnGameOptionsHTML();
    if (!advancedOptions) {
      document.querySelector(".arcade-advance-opt").style.display = "none";
    } else {
      //Create (hidden) the advanced options window
      mod.meta_overlay = new AdvancedOverlay(app, this.game_mod);
      mod.meta_overlay.render(app, this.game_mod, advancedOptions);
      mod.meta_overlay.attachEvents(app, this.game_mod);
      

      //
      // move advanced options into game details form
      let advanced1 = document.querySelector(".game-wizard-advanced-box");
      let overlay1 = document.querySelector(".game-overlay");
      let overlay2 = document.querySelector(".game-overlay-backdrop");
      let overlaybox = document.querySelector(".game-wizard-advanced-options-overlay");
      overlaybox.appendChild(overlay1);
      overlaybox.appendChild(overlay2);
      if (advanced1) {
        overlaybox.appendChild(advanced1);
      }
    }

    this.attachEvents(app, mod);
  }

  
  attachEvents(app, mod) {
    gamecreate_self = this;

    if (document.querySelector(".saito-multi-select_btn")){
      document.querySelector(".saito-multi-select_btn").addEventListener("click", (e) => {
      e.currentTarget.classList.toggle("showAll");
      });  
    }


    //Attach events to advance options button
    document.querySelector(".arcade-advance-opt").onclick = (e) => {
      //Requery advancedOptions on the click so it can dynamically update based on # of players
      let accept_button = `<div id="game-wizard-advanced-return-btn" class="game-wizard-advanced-return-btn button saito-button-primary small" style="float: right;">Accept</div>`;
      let advancedOptionsHTML = gamecreate_self.game_mod.returnGameOptionsHTML();
      if (!advancedOptionsHTML.includes(accept_button)){
        advancedOptionsHTML += accept_button;
      }
      mod.meta_overlay.show(app, gamecreate_self.game_mod, advancedOptionsHTML);
      gamecreate_self.game_mod.attachAdvancedOptionsEventListeners();
      document.querySelector(".game-wizard-advanced-options-overlay").style.display = "block";
      try {
        if (document.getElementById("game-wizard-advanced-return-btn")) {
          document.querySelector(".game-wizard-advanced-return-btn").onclick = (e) => {
            mod.meta_overlay.hide();
          };
        }
      } catch (err) { }
    };

    document.getElementById("game-rules-btn").addEventListener("click", (e)=>{
       let options = gamecreate_self.getOptions();
       let gamemod = app.modules.returnModule(options.game);
       gamemod.overlay.show(app, mod, gamemod.returnGameRulesHTML());
    });

    //
    // create game
    //
    Array.from(document.querySelectorAll(".game-invite-btn")).forEach((gameButton) => {
      gameButton.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          let mod = app.modules.returnModule('Arcade');   
          let options = this.getOptions();
          let isPrivateGame = e.currentTarget.getAttribute("data-type");
          if (isPrivateGame == "private") {
            app.browser.logMatomoEvent("Arcade", "ArcadeCreateClosedInvite", options.game);
          } else if (isPrivateGame == "single") {
            app.browser.logMatomoEvent("Arcade", "ArcadeLaunchSinglePlayerGame", options.game);
          } else {
            app.browser.logMatomoEvent("Arcade", "ArcadeCreateOpenInvite", options.game);
          }

          //
          // if crypto and stake selected, make sure creator has it
          //
          try{
            if (options.crypto && parseFloat(options.stake) > 0) {
              let crypto_transfer_manager = new GameCryptoTransferManager(app);
              let success = await crypto_transfer_manager.confirmBalance(app, mod, options.crypto, options.stake);
              if (!success){ return; }
            }
          }catch(err){
             console.log("ERROR checking crypto: " + err);
            return;
          }

          //Check League Membership
          if (options.league){
            let leag = app.modules.returnModule("League");
            if (!leag.isLeagueMember(options.league)){
              salert("You need to be a member of the League to create a League-only game invite");
              return;
            }
          }

          let gamemod = app.modules.returnModule(options.game);
          let players_needed = 0;
          if (document.querySelector(".game-wizard-players-select")) {
            players_needed = document.querySelector(".game-wizard-players-select").value;
          } else {
            players_needed = document.querySelector(".game-wizard-players-no-select").dataset.player;
          }

          let gamedata = {
            ts: new Date().getTime(),
            name: gamemod.name,
            slug: gamemod.returnSlug(),
            options: options,
            players_needed: players_needed,
            invitation_type: "public",
          };


          console.log("Gamedata options");
          console.log(gamedata);

          if (players_needed === 0) {
            console.error("Create Game Error");
            console.log(gamedata);
            return;
          }
          
          //Close the overlay
          gamecreate_self.overlay.hide();

          if (players_needed == 1) {

            mod.launchSinglePlayerGame(app, gamedata); //Game options don't get saved....
            return;
          } else {
            
            //console.log("PRE CREATING OPEN TX");
            if (isPrivateGame == "private") {
              gamedata.invitation_type = "private";
            }

            let newtx = mod.createOpenTransaction(gamedata);
            app.network.propagateTransaction(newtx);
  
            //
            // and relay open if exists
            //
            let peers = [];
            for (let i = 0; i < app.network.peers.length; i++) {
              peers.push(app.network.peers[i].returnPublicKey());
            }
            let relay_mod = app.modules.returnModule("Relay");
            if (relay_mod != null) {
              relay_mod.sendRelayMessage(peers, "arcade spv update", newtx);
            }
        
            mod.addGameToOpenList(newtx);

            if (isPrivateGame == "private") {
              console.log(newtx);
              //Create invite link from the game_sig 
              mod.showShareLink(newtx.transaction.sig);
            }
          }
        } catch (err) {
          console.log(err);
          alert("error: " + err);
        }

        return false;
      });
    });
  
  }


  getOptions() {
    let options = {};
    document.querySelectorAll("form input, form select").forEach((element) => {
      if (element.type == "checkbox") {
        if (element.checked) {
          options[element.name] = 1;
        }
      } else if (element.type == "radio") {
        if (element.checked) {
          options[element.name] = element.value;
        }
      } else {
        options[element.name] = element.value;
      }
    });
    return options;
  }
}




module.exports = GameCreateNew;
