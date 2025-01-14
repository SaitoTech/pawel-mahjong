const GameTemplate = require('../../lib/templates/gametemplate');
const GameScoreboard = require("../../lib/saito/ui/game-scoreboard/game-scoreboard");


//////////////////
// CONSTRUCTOR  //
//////////////////
class Monarchy extends GameTemplate {

  constructor(app) {
    super(app);

    this.app             = app;

    this.name  		       = "Dominion";

    this.description     = `${this.name} is a strategy deck-building game, where players strive for dominion over the land by spending money on land and resources.`;
    this.status          = "Alpha";
    this.card_height_ratio = 1.6; // height is 1.6x width

    this.scoreboard      = new GameScoreboard(app);
    this.interface     = 1; //Display card graphics
    this.minPlayers 	 = 2;
    this.maxPlayers 	 = 4;

    this.categories 	 = "Games Boardgame Strategy Deckbuilding";

    this.hud.mode = 0;  // long-horizontal
    this.hud.enable_mode_change = 1;
    this.hud.card_width = 120;
    this.hud.respectDocking = true;
    
    this.cards_in_play = [];
    this.is_testing = false;
    
    this.last_discard = null;
    this.back_button_html = `<i class="fas fa-window-close" id="back_button"></i>`;
    this.menu_backup_callback = ()=>{this.endTurn();} //Default behavior
  }



  formatDeck(cardStats, title = ""){
    let html = `
      <div class="rules-overlay">
        <h1>${title}</h1>
        <div class="cardlist-container">`;

    for (let cardType in this.game.state.supply){
      if (cardStats[cardType]){
        html += `<div class="cardlist" style="width:${80+40*cardStats[cardType]}px">`;
        for (let i = 0; i < cardStats[cardType]; i++){
          html += this.returnCardImage(cardType);
        }
        html += "</div>";   
      }
    }

    html += "</div></div>";

    return html;
  }

  returnWelcomeOverlay(){
   let html = `<div id="welcome_overlay" class="welcome_overlay splash_overlay rules-overlay">
           <img src="/${this.name.toLowerCase()}/img/welcome_splash.jpg" style="width:100%;height:100%" />
               </div>`;
    return html;
  }

  showDecks(){
    this.menu.addMenuOption({
      text : "Decks",
      id : "game-decks",
      class : "game-decks",
      callback : function(app, game_mod) {
        game_mod.menu.showSubMenu("game-decks");
      }
    });
    for (let i = 1; i <= this.game.players.length; i++){
      let title = (this.game.player == i) ? "My Deck" : `Player ${i}'s Deck`;
      this.menu.addSubMenuOption("game-decks", {
        text : `Player ${i}${(this.game.player == i)?" (Me)":""}`,
        id : "decks-player-"+i,
        class : "decks-cards",
        callback : function(app, game_mod) {
           game_mod.menu.hideSubMenus();
           game_mod.overlay.show(game_mod.app, game_mod, game_mod.formatDeck(game_mod.game.state.decks[i], title)); 
        }
      });
    }
    this.menu.render(this.app, this);
    this.menu.attachEvents(this.app, this);

    console.log(JSON.parse(JSON.stringify(this.game.state.decks)));
  }

 
 initializeHTML(app) {

    if (this.browser_active == 0) { return; }

    super.initializeHTML(app);

    this.menu.addMenuOption({
      text : "Game",
      id : "game-game",
      class : "game-game",
      callback : function(app, game_mod) {
      	game_mod.menu.showSubMenu("game-game");
      }
    });
   
    this.menu.addSubMenuOption("game-game", {
      text : "How to Play",
      id : "game-rules",
      class : "game-rules",
      callback : function(app, game_mod) {
         game_mod.menu.hideSubMenus();
         game_mod.overlay.show(game_mod.app, game_mod, game_mod.returnGameRulesHTML()); 
      }
    });

     this.menu.addSubMenuOption("game-game", {
      text : "Exit",
      id : "game-exit",
      class : "game-exit",
      callback : function(app, game_mod) {
        window.location.href = "/arcade";
      }
    });

    this.menu.addMenuIcon({
      text : '<i class="fa fa-window-maximize" aria-hidden="true"></i>',
      id : "game-menu-fullscreen",
      callback : function(app, game_mod) {
	      game_mod.menu.hideSubMenus();
        app.browser.requestFullscreen();
      }
    });

    this.menu.addChatMenu(app, this);

    this.menu.render(app, this);
    this.menu.attachEvents(app, this);

    this.log.render(app, this);
    this.log.attachEvents(app, this);

    this.cardbox.render(app, this);
    this.cardbox.attachEvents(app, this);

    //
    // add card events -- text shown and callback run if there
    //
    this.cardbox.addCardType("showcard", "", null);
    this.cardbox.addCardType("logcard", "", null);
    this.cardbox.addCardType("card", "play", this.cardbox_callback);
    this.cardbox.addCardType("handy-help", "", function(){});

    //Test for mobile
    try {
      if (app.browser.isMobileBrowser(navigator.userAgent)) {
        console.log("Mobile user!");
        this.hud.card_width = 100; //Smaller cards
        this.cardbox.skip_card_prompt = 0;
      } 
    } catch (err) {
      console.log("ERROR with Mobile: " + err);
    }


    
    this.hud.render(app, this);
    this.hud.attachEvents(app, this);

    let hh = document.querySelector(".hud-header");
    if (hh){
      if (!document.getElementById("zoom")){
        this.app.browser.addElementToElement(`<i id="zoom" class="fas fa-search hud-controls" aria-hidden="true"" title="Toggle Zoom on Card Hover"></i>`, hh);
      }
      if (!document.getElementById("my_hand") && this.game.player > 0){
        this.app.browser.addElementToElement(`<i id="my_hand" class="handy-help hud-controls fas fa-fw fa-hand-paper" aria-hidden="true"></i>`, hh);  
      }
    }

    this.scoreboard.render(app, this);
    this.scoreboard.attachEvents(app, this);
}


  ////////////////
  // initialize //
  ////////////////
initializeGame(game_id) {

  if (this.game.status != "") { this.updateStatus(this.game.status); }
  this.restoreLog();

  this.deck = this.returnCards();

  //
  // initialize
  //
  if (!this.game.state) {
    this.game.state = this.returnState();

    console.log("\n\n\n\n");
    console.log("---------------------------");
    console.log("---------------------------");
    console.log("------ INITIALIZE GAME ----");
    console.log("----------Dominion---------");
    console.log("---------------------------");
    console.log("---------------------------");
    console.log("\n\n\n\n");

    this.updateStatus("<div class='status-message' id='status-message'>Generating the Game</div>");

    this.game.queue.push("turn\t1");
    this.game.queue.push("READY");
    for (let p = 1; p <= this.game.players.length; p++){
      this.game.queue.push(`DEAL\t${p}\t${p}\t5`);  
      
      for (let i = this.game.players.length; i>0; i--){
        this.game.queue.push(`DECKENCRYPT\t${p}\t${i}`);
      }
      for (let i = this.game.players.length; i>0; i--){
        this.game.queue.push(`DECKXOR\t${p}\t${i}`);
      }
      this.game.queue.push(`DECK\t${p}\t${JSON.stringify(this.returnInitialHand())}`);  
    }
    
    this.game.queue.push("init");

  }

  if (this.browser_active){
     this.displayBoard();
     this.updateScore();
  }
 
}





  //
  // Core Game Logic
  //
  handleGameLoop() {

    let we_self = this;
    
    this.saveGame(this.game.id);
    ///////////
    // QUEUE //
    ///////////
    if (this.game.queue.length > 0) {

      if (this.browser_active){
         this.displayBoard();
      }
      //console.log("LOOP DECK:",JSON.parse(JSON.stringify(this.game.deck)));
      //console.log("LOOP POOL:",JSON.parse(JSON.stringify(this.game.pool)));

      let qe = this.game.queue.length-1;
      let mv = this.game.queue[qe].split("\t");


      if (mv[0] == "init") {
        this.game.queue.splice(qe, 1);
        /*
          Determine which cards are in play for the game
        */
        let supply = [];
        if (this.game.options.card_set){
          switch(this.game.options.card_set){
            case "firstgame":      supply = ["cellar", "market", "militia", "mine", "moat", "remodel", "smithy", "village", "woodcutter", "workshop"]; break;
            case "bigmoney":       supply = ["adventurer", "bureaucrat", "chancellor", "chapel", "feast", "laboratory", "market", "mine", "moneylender", "throneroom"]; break;
            case "interaction":    supply = ["bureaucrat", "chancellor", "councilroom", "festival", "library", "militia", "moat", "spy", "thief", "village"]; break;
            case "sizedistortion": supply = ["cellar", "chapel", "feast", "gardens", "laboratory", "thief", "village", "witch", "woodcutter", "workshop"]; break;
            case "villagesquare":  supply = ["bureaucrat", "cellar", "festival", "library", "market", "remodel", "smithy", "throneroom", "village", "woodcutter"]; break;
          }
        }
        //Random Selection
        if (supply.length == 0){
          let choices = (this.game.options.second)? this.returnSecondEd() : this.returnFirstEd();
          for (let i = 0; i < 10; i++){
            let ind = this.rollDice(choices.length) - 1;
            supply = supply.concat(choices.splice(ind-1,1));
          }
        }
        if (this.is_testing){
          supply = ["chancellor", "merchant", "bureaucrat", "feast", "market", "village", "vassal", "woodcutter", "mine", "smithy"];
        }
        supply.sort((a,b) =>{
          let c_a = this.deck[a];
          let c_b = this.deck[b];
          if (c_a.type < c_b.type){
            return -1;
          }
          if (c_a.type > c_b.type){
            return 1;
          }
          if (c_a.cost < c_b.cost){
            return -1;
          }
          if (c_a.cost > c_b.cost){
            return 1;
          }
          return 0;
        });

        while (supply.length > 0){
          let card = supply.shift();
          this.game.state.supply[card] = (this.is_testing)? 4: 10;
        }

        return 1;
      }

      if (mv[0] == "gameover"){
        let winner = [];
        let highScore = -1;
        let reason = "high score";
        
        this.showDecks();
        //Find High Score
        for (let i = 1; i <= this.game.players.length; i++){
          let score = this.returnPlayerVP(i);
          if (score > highScore){
            highScore = score;
          }
        }
        //Get Players with High Score
        for (let i = 1; i <= this.game.players.length; i++){
          if (this.returnPlayerVP(i) == highScore){
            winner.push(i);
          }
        }
        //Filter for least number of turns
        if (winner.length > 1){
          let leastMoves = 10000;
          reason += " and fewest moves";
          for (let j = 0; j < winner.length; j++){
            if (this.game.state.players[winner[j]-1].turns < leastMoves){
              leastMoves = this.game.state.players[winner[j]-1].turns;
            }
          }
          for (let j = winner.length-1; j >= 0; j--){
            if (this.game.state.players[winner[j]-1].turns > leastMoves){
              winner.splice(j,1);
            }
          }
        }
        if (winner.length == 1){
          this.endGame(this.game.players[winner[0]-1], reason);
        }else{
          this.endGame(winner.map(x=>this.game.players[x-1]), reason);  
        }
        
        return 0;
      }

      if (mv[0] == "turn"){
        if (!this.browser_active) {return 0;}

        //For the beginning of the game only...
        if (this.game.state.welcome == 0) {
          try {
            this.overlay.show(this.app, this, this.returnWelcomeOverlay());
            document.querySelector(".welcome_overlay").onclick = () => { this.overlay.hide(); };
          } catch (err) {}
          this.game.state.welcome = 1;
        }

        let player = parseInt(mv[1]);
        if (this.game.player == player){
          this.playerTurn();
        }else{
          this.sortHand();
          this.updateStatusAndListCards(`Waiting for Player ${player} to play a card`);
        }

        return 0;
      }

      if (mv[0] == "DISCARD"){
        let deckidx = parseInt(mv[1]);
        let card = mv[2];

        let handidx = this.game.deck[deckidx-1].hand.indexOf(card);
        if (handidx > -1){
          this.game.deck[deckidx-1].hand.splice(handidx,1);
        }
        this.game.deck[deckidx-1].discards[card] = this.game.deck[deckidx-1].cards[card];
        if (deckidx == this.game.player){
          this.last_discard = this.game.deck[deckidx-1].cards[card];
        }
        this.game.queue.splice(qe, 1);
        return 1;
      }

      if (mv[0] == "trash"){
        this.game.queue.splice(qe, 1);
        let player = parseInt(mv[1]);
        let ckey = mv[2];
        let cvalue = mv[3];
        if (!mv[4]){
          this.updateLog(`Player ${player} trashes a ${this.cardToText(cvalue)}`);
        }
        this.game.deck[player-1].removed[ckey] = cvalue;
        delete this.game.deck[player-1].cards[ckey];

        //Do a bit of extra processing to remember each players deck
        if (this.deck[cvalue].type == "victory"){
          let cobj = this.deck[cvalue];
          if (cvalue == "curse"){
            this.game.state.players[player-1].curses--;
          }else if (cvalue == "gardens"){
            this.game.state.players[player-1].gardens--;
          }else{
            this.game.state.players[player-1].vp -= parseInt(cobj.text);
          }
          this.updateScore();
        }

        return 1;        
      }

      if (mv[0] == "cleanup"){
        let player = parseInt(mv[1]);
        //Functions like resolve + end round
        this.game.queue.splice(qe-1, 2); //Get rid of turn
        this.game.state.players[player-1].turns++; //Marked that this player finished a turn
        this.game.state.buys = 1;
        this.game.state.actions = 1;
        this.game.state.coins = 0;
        this.game.state.shuffled = false;
        this.game.state.merchant = false;
        this.game.state.throneroom = false;
        
        console.log(this.game.player,player,JSON.parse(JSON.stringify(this.game.deck[player-1])));
        //Check for end game
        if (this.gameOver()){
          this.game.queue.push("gameover");
          for (let p = 1; p <= this.game.players.length; p++){
            this.game.queue.push(`reportdeck\t${p}`);
            this.game.queue.push(`SAFEDEAL\t${p}\t${p}\t${Object.keys(this.game.deck[p-1].discards).length + this.game.deck[p-1].crypt.length}`);
          }
          this.updateStatus("Game over, determining winner...");
          return 1;
        }else{
          if (this.game.player == player){
            this.updateStatus(this.formatStatusHeader("Discarding hand and drawing new cards..."));
            this.addMove("turn\t"+this.returnNextPlayer(player));
            //Deal 5 New Cards
            this.addMove(`SAFEDEAL\t${player}\t${player}\t5`);
                 
            //Discard all cards in hand
            for (let c of this.cards_in_play){
              this.addMove(`DISCARD\t${player}\t${c}`);
            }
            for (let c of this.game.deck[player-1].hand){
              this.addMove(`DISCARD\t${player}\t${c}`);
            }
            this.cards_in_play = [];
            this.endTurn();  
          }
          return 0;
          
        }

      }

      if (mv[0] == "reportdeck"){
        let player = parseInt(mv[1]);
        this.game.queue.splice(qe, 1);
        if (this.game.player == player){
          this.addMove("resolve");
          let numCards = this.game.deck[player-1].hand.length;
          for (let i = 0; i < numCards; i++){
            this.addMove(this.game.deck[player-1].cards[this.game.deck[player-1].hand[i]]);
          }
          this.addMove(`mycards\t${mv[1]}\t${numCards}`);
          this.endTurn();
        }
        return 0;
      }

      if (mv[0] == "mycards"){
        let player = parseInt(mv[1]);
        let expectedCount = parseInt(mv[2]);
        this.game.queue.splice(qe, 1);
        if (!this.game.state.decks){
          this.game.state.decks = {};
        }
        this.game.state.decks[player] = {};

        let card = this.game.queue.pop();
        let cnt = 1;
        while (card != "resolve"){
          cnt++;
          if (!this.game.state.decks[player][card]){
            this.game.state.decks[player][card] = 0;
          }
          this.game.state.decks[player][card]++;
          card = this.game.queue.pop();
        }
        return 1;
      }

      if (mv[0] == "create"){
        this.game.state.supply[mv[1]]++; //Increase supply in game
        this.game.queue.splice(qe, 1);
        return 1;        
      }

      if (mv[0] == "buy"){
        this.game.queue.splice(qe, 1);
        let player = parseInt(mv[1]);
        let card_to_buy = mv[2];
        let direct_to_hand = (mv[3] == "hand");
        let add_to_deck = (mv[3] == "deck");

        let code = this.getNextCardCode(player);
        //Manuall insert card into players discard pile
        this.game.deck[player-1].cards[code.toString()] = card_to_buy;
        if (direct_to_hand){
          this.game.deck[player-1].hand.push(code);
        }else if (add_to_deck){
          let cobj = {};
          cobj[code] = card_to_buy;
          this.game.queue.push(`PUSHONDECK\t${mv[1]}\t${JSON.stringify(cobj)}`);
        }else{
          this.game.deck[player-1].discards[code.toString()] = card_to_buy;
        }

        this.game.state.supply[card_to_buy]--; //Decrease supply in game

        //Do a bit of extra processing to remember each players deck
        if (this.deck[card_to_buy].type == "victory"){
          let cobj = this.deck[card_to_buy];
          if (card_to_buy == "curse"){
            this.game.state.players[player-1].curses++;
          }else if (card_to_buy == "gardens"){
            this.game.state.players[player-1].gardens++;
          }else{
            this.game.state.players[player-1].vp += parseInt(cobj.text);
          }
          this.updateScore();
        }
        return 1;
      }

      if (mv[0] == "play"){
        this.game.queue.splice(qe, 1);
        let player = parseInt(mv[1]);
        let card_to_play = mv[2];

        this.updateLog(`Player ${player} played ${this.cardToText(card_to_play)}`);
        return this.playCard(player, card_to_play);
      }

      if (mv[0] == "draw"){
        this.game.queue.splice(qe, 1);
        let player = parseInt(mv[1]);
        let number = parseInt(mv[2]) - this.game.deck[player-1].hand.length;
        if (number > 0){
          this.game.queue.push(`SAFEDEAL\t${player}\t${player}\t${number}`);  
        }
        return 1;
      }

      if (mv[0] == "hand"){
        this.game.queue.splice(qe, 1);
        let player = parseInt(mv[1]);
        let number = parseInt(mv[2]);
        let target = mv[3];
        let optional = (mv[4]=="1");

        if (this.game.player == player){
          let card_list = [];
          if (number <= 0){
            this.endTurn();
            return 0;
          }
          this.updateStatusAndListCards(`Select (${number}) cards to move to ${target}:`,[],optional);
          if (optional){
            this.bindBackButtonFunction(()=>{
              if (card_list.length > 0){
                we_self.addMove(`NOTIFY\tPlayer ${player} moved ${we_self.cardsToText(card_list)} to the their ${target}.`);  
              }
              we_self.endTurn();
              we_self.updateStatusAndListCards(`Finished moving cards to ${target}...`);
            });
          }
          this.attachCardboxEvents(function(card){
            number--;
            card_list.push(card);
            we_self.removeCardFromHand(card);
            let div = document.querySelector("#status #"+card);
            if (div){ div.remove(); }
            switch(target){
              case "deck": we_self.addMove(`PUSHONDECK\t${mv[1]}\t${JSON.stringify(we_self.returnLastCard())}`); break;
              case "trash": we_self.addMove(`trash\t${mv[1]}\t${we_self.lastCardKey}\t${we_self.lastCardValue}\t1`); break;
              case "discards": we_self.addMove(`DISCARD\t${mv[1]}\t${we_self.lastCardKey}`); break;
            }     
            if (number <= 0){
              we_self.addMove(`NOTIFY\tPlayer ${player} moved ${we_self.cardsToText(card_list)} to the their ${target}.`);
              we_self.endTurn();
            }
          });
        }
        return 0;
      }

      //Attack -- counter
      if (mv[0] == "attack"){
        let player = parseInt(mv[1]);
        let victim = parseInt(mv[2]);
        let card_to_play = mv[3];
        this.game.queue.splice(qe, 1);


        if (this.game.player == victim){
          //Spy Affects even the one who played it
          if (card_to_play == "spy"){
            this.overlay.show(this.app, this);
            this.addMove(`spy\t${victim}`);
            this.addMove(`SAFEPOOLDEAL\t${victim}\t1\t${victim}`);
            this.addMove(`POOL\t${victim}`);   
            this.endTurn();
            return 0;
          }        

          //Other attacks only affect other players
          if (victim != player){
            this.overlay.show(this.app, this);
            if (this.hasCardInHand("moat")){
              this.addMove(`augment\tAttack nullified by Moat\tmoat`);
              this.removeCardFromHand("moat");
              this.addMove(`DISCARD\t${victim}\t${this.lastCardKey}`);
              this.addMove(`NOTIFY\tPlayer ${victim} is protected from ${this.cardToText(card_to_play)} by a ${this.cardToText("moat")}.`);
            }else{
              switch(card_to_play){
                case "bandit":
                  this.addMove(`bandit\t${player}\t${victim}`);
                  this.addMove(`SAFEPOOLDEAL\t${victim}\t2\t${victim}`);
                  this.addMove(`POOL\t${victim}`);   
                  break;
                case "bureaucrat":
                  this.addMove(`bureaucrat\t${player}\t${victim}`);
                  break;
                case "militia":
                  this.addMove(`hand\t${victim}\t${this.game.deck[victim-1].hand.length-3}\tdiscards`);  
                  break;
                case "thief":
                  this.addMove(`thief\t${player}\t${victim}\t`);
                  this.addMove(`SAFEPOOLDEAL\t${victim}\t2\t${victim}`);
                  this.addMove(`POOL\t${victim}`);
                  break;
                case "witch":
                  this.addMove(`augment\tPlayer ${victim} gains a curse\tcurse`);
                  this.addMove(`buy\t${victim}\tcurse`);
                  break;
              }
            }
          }
          this.endTurn();
        }
        
        return 0;
      }


      //Specific card instructions
      if (mv[0] == "adventurer"){
        let player = parseInt(mv[1]);
        if (player !== this.game.player){ return 0;}

        if (this.game.pool[player-1].hand.length > 0){
          let c = this.game.pool[player-1].hand.pop();
          let cardname = this.game.pool[player-1].cards[c];
          if (this.deck[cardname].type == "treasure"){ //Move to player's hand
            this.game.deck[player-1].hand.push(c);
          this.game.state.adventurer--;
          }else{ //Put it back
            this.game.pool[player-1].hand.push(c);
          }
        }

        if (this.game.state.adventurer == 0 || (this.game.state.shuffled && this.game.deck[player-1].crypt.length == 0)){
          this.game.queue.splice(qe, 1);
          for (let c of this.game.pool[player-1].hand){
            this.addMove(`DISCARD\t${mv[1]}\t${c}`);
          }
          this.endTurn();
          return 0;
        }

        this.addMove(`POOLDEAL\t${mv[1]}\t1\t${mv[1]}`);
        if (this.game.deck[player-1].crypt.length == 0){
          this.addMove(`SHUFFLEDISCARDS\t${player}`);
          this.game.state.shuffled = true;
        }
        this.endTurn();
        return 0;
      }

      //Bandit will auto select the least value treasure to discard
      if (mv[0] == "bandit"){
        let card_player = parseInt(mv[1]);
        let victim  = parseInt(mv[2]);
        this.game.queue.splice(qe, 1);
        let trash = [];
        let discard = [];
        let top_cards = [];
        for (let c of this.game.pool[victim-1].hand){
          let cardname = this.game.pool[victim-1].cards[c];
          top_cards.push(cardname);
          if (this.deck[cardname].type == "treasure" && cardname !== "copper"){
            //Can Trash
            trash.push(c);
          }else{
            discard.push(c);
          }
        }

        this.augmentAttackOverlay(`Player ${victim}'s top cards:`, ...top_cards);
        if (trash.length > 1){
          if (this.game.pool[victim-1].cards[trash[0]] == "silver"){
            discard.push(trash.shift());
          }else{
            discard.push(trash.pop());
          }
        }
        
        for (let t of trash){
          this.game.queue.push(`trash\t${victim}\t${t}\t${this.game.pool[victim-1].cards[t]}\t1`);
          this.game.queue.push(`NOTIFY\tPlayer ${mv[2]} trashes a ${this.cardToText(this.game.pool[victim-1].cards[t])} because of the ${this.cardToText("bandit")}`);
        }
        for (let t of discard){
          this.game.queue.push(`DISCARD\t${victim}\t${t}`);
          this.game.queue.push(`NOTIFY\tPlayer ${mv[2]} discards a ${this.cardToText(this.game.pool[victim-1].cards[t])} because of the ${this.cardToText("bandit")}`);
        }

        return 1;
      }

      if (mv[0] == "bureaucrat"){
        let card_player = parseInt(mv[1]);
        let victim  = parseInt(mv[2]);
        this.game.queue.splice(qe, 1);
        let vpcards = [];
        let hand = [];
        if (this.game.player !== victim){ return 0;}

        for (let c of this.game.deck[victim-1].hand){
          let cardname = this.game.deck[victim-1].cards[c];
          hand.push(cardname);
          if (this.deck[cardname].type == "victory" && cardname !== "curse"){
            vpcards.push(cardname);
          }
        }
        if (vpcards.length > 0){
          this.removeCardFromHand(vpcards[0]);
          this.addMove(`PUSHONDECK\t${mv[2]}\t${JSON.stringify(this.returnLastCard())}`)
          this.addMove(`augment\tPlayer ${victim}\t${vpcards[0]}`);
          this.addMove(`NOTIFY\t${this.cardToText("bureaucrat")}: Player ${victim} puts a ${this.cardToText(vpcards[0])} back on top of the deck.`);
        }else{
          this.addMove(`augment\tPlayer ${victim} does not have a victory card in their hand\t${JSON.stringify(hand)}`);
          this.addMove(`NOTIFY\t${this.cardToText("bureaucrat")}: Player ${victim} does not have a victory card in their hand.`);
        }
        this.endTurn();
        return 0;
      }

      if (mv[0] == "harbinger"){
        this.game.queue.splice(qe, 1);
        let player = parseInt(mv[1]);
        if (player == this.game.player){
          //Read the discard pile
          let my_keys = [];
          let my_discards = [];
          for (let c in this.game.deck[player-1].discards){
            my_keys.push(c);
            my_discards.push(this.game.deck[player-1].discards[c]);
          }
          if (my_discards.length == 0){
            this.endTurn();
          }
          this.updateStatusAndListCards(`Select a card to put on top of your deck:`,my_discards, false);
          this.attachCardboxEvents(function(oldcard){
            console.log("DECK1:",JSON.parse(JSON.stringify(this.game.deck)));
            let index = my_discards.indexOf(oldcard);
            let card = {};
            card[my_keys[index]] = my_discards[index];
            delete we_self.game.deck[player-1].discards[my_keys[index]];
            this.addMove(`PUSHONDECK\t${player}\t${JSON.stringify(card)}`);
            console.log("DECK2:",JSON.parse(JSON.stringify(this.game.deck)));

            this.endTurn();
          });
        }
        return 0;
      }

      if (mv[0] == "library"){
        let player = parseInt(mv[1]);

        if (this.game.player !== player){
          return 0;
        }


        if (this.game.pool[player-1].hand.length > 0){
          let c = this.game.pool[player-1].hand.pop();
          let cardname = this.game.pool[player-1].cards[c];
          if (this.deck[cardname].type.includes("action")){
            this.updateStatusWithOptions(`You drew ${this.cardToText(cardname)}:`, `<ul><li class="card nocard" id="keep">keep in hand</li><li class="card nocard" id="nope">set aside</li></ul>`);
            this.attachCardboxEvents(function (action){
              if (action == "keep"){
                this.game.deck[player-1].hand.push(c);  
              }else{
                this.game.pool[player-1].hand.unshift(c);  
                this.addMove(`POOLDEAL\t${mv[1]}\t1\t${mv[1]}`);
                this.endTurn();
              }
              this.restartQueue();
            });  
            return 0;
          }else{
            this.game.deck[player-1].hand.push(c);  
          }
        }

        if (this.game.deck[player-1].hand.length == 7 || (this.game.state.shuffled && this.game.deck[player-1].crypt.length == 0)){
          this.game.queue.splice(qe, 1);
          for (let c of this.game.pool[player-1].hand){
            this.addMove(`DISCARD\t${mv[1]}\t${c}`);
          }
          this.endTurn();
          return 0;
        }

        this.addMove(`POOLDEAL\t${mv[1]}\t1\t${mv[1]}`);
        if (this.game.deck[player-1].crypt.length == 0){
          this.addMove(`SHUFFLEDISCARDS\t${player}`);
          this.game.state.shuffled = true;
        }
        this.endTurn();
        return 0;
      }

      if (mv[0] == "sentry"){
        this.game.queue.splice(qe, 1);
        let player = parseInt(mv[1]);
        if (this.game.player == player){
          if (this.game.pool[player-1].hand.length == 0){
            this.endTurn();
            return;
          }
          
          this.addMove(`sentry\t${player}`);
          let html = `<ul>
                        <li class="card nocard" id="deck">deck</li>
                        <li class="card nocard" id="discards">discard</li>
                        <li class="card nocard" id="trash">trash</li>
                      </ul>`;
          this.updateStatusAndListCards("The top cards from your deck:",this.game.pool[player-1].hand.map(x=>this.game.pool[player-1].cards[x]),false);
          this.attachCardboxEvents(function(card){
            we_self.updateStatusWithOptions(`Move ${we_self.cardToText(card)} to:`, html, true);
            we_self.attachCardboxEvents(function(action){
              we_self.removeCardFromPool(card, player);
              if (action == "deck"){
                we_self.addMove(`PUSHONDECK\t${mv[1]}\t${JSON.stringify(we_self.returnLastCard())}`);
              }else if (action == "trash"){
                we_self.addMove(`trash\t${mv[1]}\t${we_self.lastCardKey}\t${we_self.lastCardValue}`);
              }else{
                we_self.addMove(`DISCARD\t${mv[1]}\t${we_self.lastCardKey}`);
              }
              we_self.endTurn();
            });
          });
        }
        return 0;
      }

      if (mv[0] == "spy"){
        this.game.queue.splice(qe, 1);
        let player = parseInt(mv[1]);

        let card = (this.game.pool[player-1].hand.length > 0) ? this.game.pool[player-1].cards[this.game.pool[player-1].hand[0]] : "";
        this.augmentAttackOverlay(`Players ${player}'s top card:`,card);
        this.overlay.show(this.app, this); //Redisplay for other players

        if (this.game.player == player){
          if (this.game.pool[player-1].hand.length == 0){
            this.endTurn();
            return;
          }
          let html = `<ul>
                        <li class="card nocard" id="deck">back to deck</li>
                        <li class="card nocard" id="discards">discard</li>
                      </ul>`;
          we_self.updateStatusWithOptions(`Move top card of your deck (${we_self.cardToText(card)}):`, html, false);
          we_self.attachCardboxEvents(function(action){
            we_self.removeCardFromPool(card, player);
            if (action == "deck"){
              we_self.addMove(`PUSHONDECK\t${mv[1]}\t${JSON.stringify(we_self.returnLastCard())}`);
              we_self.addMove(`NOTIFY\t${we_self.cardToText("spy")}: Player ${player} reveals a ${we_self.cardToText(card)} and puts it back on the deck.`);
            }else{
              we_self.addMove(`DISCARD\t${mv[1]}\t${we_self.lastCardKey}`);
              we_self.addMove(`NOTIFY\t${we_self.cardToText("spy")}: Player ${player} reveals a ${we_self.cardToText(card)} and discards it.`);
            }

            we_self.endTurn();
          });
        }else{
          this.updateStatusAndListCards(`Player ${player} revealing top card for ${this.cardToText("spy")}`);
        }
        return 0;
      }

      if (mv[0] == "thief"){
        this.game.queue.splice(qe, 1);
        let player = parseInt(mv[1]);
        let victim  = parseInt(mv[2]);
        
        let cards = [];
        if (this.game.player !== victim){ return 0;}

        for (let c of this.game.pool[victim-1].hand){
          let cardname = this.game.pool[victim-1].cards[c];
            cards.push(cardname);
        }
        this.addMove(`thief2\t${mv[1]}\t${mv[2]}\t${cards[0]}\t${cards[1]}`);
        this.addMove(`NOTIFY\t${this.cardToText("thief")}: Player ${victim} reveals ${this.cardToText(cards[0])} and ${this.cardToText(cards[1])}`);
        this.endTurn();
        this.updateStatusAndListCards(`A ${this.cardToText("thief")} is rummaging through your deck...`);
        return 0;
      }

      if (mv[0] == "thief2"){
        this.game.queue.splice(qe, 1);
        let player = parseInt(mv[1]);
        let victim  = parseInt(mv[2]);
        let card1 = mv[3];
        let card2 = mv[4];

        this.augmentAttackOverlay(`Players ${victim}'s top two cards:`,card1, card2);        
        if (this.game.player !== player){ return 0;}
        let tcards = [];
        if (this.deck[card1].type == "treasure"){
          tcards.push(card1);
        }
        if (this.deck[card2].type == "treasure"){
          tcards.push(card2);
        }
        if (tcards.length == 0){
          //Tell victim to discard both
          this.removeCardFromPool(card1, victim);
          this.addMove(`DISCARD\t${victim}\t${this.lastCardKey}`);
          this.removeCardFromPool(card2, victim);
          this.addMove(`DISCARD\t${victim}\t${this.lastCardKey}`);
          this.endTurn();
        }else if (tcards.length == 1){
          //Tell victim to discard one and trash one
          this.addMove(`thief3\t${mv[1]}\t${mv[2]}\t${tcards[0]}`);
          this.removeCardFromPool(tcards[0], victim);
          this.addMove(`trash\t${victim}\t${this.lastCardKey}\t${this.lastCardValue}\t1`);
          this.addMove(`NOTIFY\tPlayer ${victim} trashes a ${this.cardToText(this.lastCardValue)} because of the ${this.cardToText("thief")}`);
          if (tcards[0] == card1){
            this.removeCardFromPool(card2, victim);
          }else{
            this.removeCardFromPool(card1, victim);
          }
          this.addMove(`DISCARD\t${victim}\t${this.lastCardKey}`);
          this.endTurn();
        }else{
          this.updateStatusAndListCards(`Choose a card from Player ${victim} to trash:`,tcards);
          this.attachCardboxEvents(function(card){
            this.addMove(`thief3\t${mv[1]}\t${mv[2]}\t${card}`);
            this.removeCardFromPool(card, victim);
            this.addMove(`trash\t${victim}\t${this.lastCardKey}\t${this.lastCardValue}\t1`);
            this.addMove(`NOTIFY\tPlayer ${victim} trashes a ${this.cardToText(this.lastCardValue)} because of the ${this.cardToText("thief")}`);
            if (card == card1){
              this.removeCardFromPool(card2, victim);
            }else{
              this.removeCardFromPool(card1, victim);
            }
            this.addMove(`DISCARD\t${victim}\t${this.lastCardKey}`);
            this.endTurn();
          });
        }

        return 0;
      }

      if (mv[0] == "thief3"){
        this.game.queue.splice(qe, 1);
        let player = parseInt(mv[1]);
        let victim  = parseInt(mv[2]);
        let card = mv[3];
        if (this.game.player == player){

          this.updateStatusWithOptions(`Would you like to keep the ${this.cardToText(card)} from Player ${victim}}?`,
              `<ul><li class="card nocard" id="yes">yes, keep</li><li class="card nocard" id="no">no, trash</li></ul>`);
          this.attachCardboxEvents(function (action){
            if (action == "yes"){
              we_self.addMove(`NOTIFY\tPlayer ${player} decides to keep Player ${victim}'s ${this.cardToText(card)}`);
              we_self.addMove(`buy\t${player}\t${card}`);
              we_self.addMove(`create\t${card}`); //A hack to tell players to increment supply
            }
            we_self.endTurn();
          });
        }
        return 0;
      }


      if (mv[0] == "vassal"){
        this.game.queue.splice(qe, 1);
        let player = parseInt(mv[1]);
        if (this.game.player == player){
          let c = this.game.pool[player-1].hand[0];
          let cname = this.game.pool[player-1].cards[c];
          if (this.deck[cname].type.includes("action")){
            let html = `<ul><li class="card nocard" id="play">play</li><li class="card nocard" id="discards">discard</li></ul>`;
            we_self.updateStatusWithOptions(`Play ${we_self.cardToText(cname)} instead of discarding it?`, html);
            we_self.attachCardboxEvents(function (action){
              we_self.removeCardFromPool(cname, player);
              if (action == "play"){
                we_self.addMove(`play\t${player}\t${cname}`);
              }else{
                we_self.addMove(`DISCARD\t${mv[1]}\t${we_self.lastCardKey}`);
              }
              we_self.endTurn();
            });
          }else{
            we_self.updateStatusWithOptions(`You drew a ${we_self.cardToText(cname)}`, `<ul><li class="card nocard" id="discards">okay</li></ul>`);
            we_self.attachCardboxEvents(function (action){
              we_self.removeCardFromPool(cname, player);
              we_self.addMove(`DISCARD\t${mv[1]}\t${we_self.lastCardKey}`);
              we_self.addMove(`NOTIFY\tPlayer ${mv[1]} discards a ${we_self.cardToText(cname)}`);
              this.endTurn();
            });
          }
        }
        return 0;
      }

      if (mv[0] == "augment"){
        this.game.queue.splice(qe, 1);
        let msg = mv[1];
        let card = mv[2];
        try{
          card = JSON.parse(card);
          this.augmentAttackOverlay(msg, ...card);
        }catch(err){
          this.augmentAttackOverlay(msg, card);
        }
        this.overlay.show(this.app, this);
        return 1;
      }

    } // if cards in queue
    
    return 0;

  }


  playerTurn(){
    let we_self = this;
    if ((this.game.state.throneroom || this.game.state.actions > 0) && this.hasActionCard()){
      this.updateStatusAndListCards(`Pick a card to play${this.game.state.throneroom?" twice":""}`,[],true);
      this.attachCardboxEvents(function(action){
        if (we_self.deck[action].type.includes("action")){
          we_self.removeCardFromHand(action); 
          we_self.cards_in_play.push(we_self.lastCardKey); //In lieau of discard
          we_self.updateStatusAndListCards(`Playing ${we_self.cardToText(action)}...`);
          //we_self.addMove(`DISCARD\t${we_self.game.player}\t${we_self.lastCardKey}`);
          we_self.addMove(`play\t${we_self.game.player}\t${action}`);

          if (this.game.state.throneroom){
            this.game.state.throneroom = false;
            we_self.addMove(`play\t${we_self.game.player}\t${action}`);  
          }else{
            we_self.game.state.actions--;            
          }
          we_self.endTurn();

          $(".dim").removeClass("dim");
        }
      });
      this.bindBackButtonFunction(()=>{
        we_self.game.state.actions = 0;
        we_self.endTurn();
      });
      $(".gameboard .cardpile").addClass('dim');
      return;
    }

    this.game.state.actions = 0;
    
    if (this.game.state.buys > 0){

      let available_coins = this.countMoney();
      this.updateStatusAndListCards(`You have ${available_coins} coins and ${this.game.state.buys} card${(this.game.state.buys>0)?"s":""} to buy`,[],true);
      this.filterBoardDisplay(available_coins);
      this.cardbox.addCardType("cardpile","buy", function(newcard){
        if (we_self.game.state.supply[newcard] <= 0){
          we_self.displayModal(`No ${we_self.cardToText(newcard)} available!`);
          return;
        }
        if (we_self.deck[newcard].cost <= available_coins){
          we_self.cardbox.removeCardType("cardpile");
          we_self.addMove(`buy\t${we_self.game.player}\t${newcard}`);
          we_self.addMove(`NOTIFY\tPlayer ${we_self.game.player} bought a ${we_self.cardToText(newcard)}.`);
          we_self.game.state.buys--;
          available_coins -= we_self.deck[newcard].cost;
          we_self.spendMoney(we_self.deck[newcard].cost);
          we_self.endTurn();
        }
      }, false);
      this.attachCardboxEvents();

      this.bindBackButtonFunction(()=>{
        we_self.game.state.buys = -1;
        we_self.endTurn();
      });

      return;
    }

    this.addMove(`cleanup\t${this.game.player}`);
    this.endTurn();
  }

  getNextCardCode(player){
    let current_max = 0;
    for (let c in this.game.deck[player-1].cards){
      if (parseInt(c)>current_max){
        current_max = parseInt(c);
      }
    }
    return current_max + 1;
  }

  acquireCard(max_value, target = ""){
    let we_self = this;
    this.updateStatus(this.formatStatusHeader(`You may select a card worth up to ${max_value}`));
    this.filterBoardDisplay(max_value);

    this.cardbox.addCardType("cardpile","buy", function(newcard){
      if (we_self.game.state.supply[newcard] <= 0){
        we_self.displayModal(`No ${we_self.cardToText(newcard)} available!`);
        return;
      }
      if (we_self.deck[newcard].cost <= max_value){
        we_self.cardbox.removeCardType("cardpile");
        we_self.addMove(`buy\t${we_self.game.player}\t${newcard}\t${target}`);
        we_self.addMove(`NOTIFY\tPlayer ${we_self.game.player} acquired a ${we_self.cardToText(newcard)}.`);
        we_self.endTurn();
      }
    }, false);
    this.attachCardboxEvents();

  }

  returnAttackOverlay(card){
    let html = `<div class="attack_overlay">
                  <h2>Attack! -- ${this.deck[card].name}</h2>
                  <div class="overlay_content">
                    <div class="overlay-img">${this.returnCardImage(card)}</div>
                    <div class="attack_details"></div>
                  </div>
                </div>`;

    return html;
  }

  augmentAttackOverlay(text, ...cards){
    let rCol = document.querySelector(".attack_details");
    if (!rCol){ return; }
    let html = rCol.innerHTML;
    if (text){
      html += `<div class="overlay-msg">${text}</div>`;
    }
    for (let i = 0; i < cards.length; i++){
      html += `<div class="aoc">${this.returnCardImage(cards[i])}</div>`;
    }
    rCol.innerHTML = html;
  }

  displayBoard(){
    let html = `<div class="cardstacks">`;
    let cardClass = ($("#zoom").hasClass("active"))?" showcard":"";
    for (let c in this.game.state.supply){
      if (c !== "curse"){
        html += `<div class="cardpile tip${cardClass}" id="${c}">`;
        if (this.game.state.supply[c] > 0){
          html += `<img class="passivecard" id="${c}" src="/${this.name.toLowerCase()}/img/cards/${this.deck[c].img}">`;
          html += `<div class="tiptext">Remaining Supply: ${this.game.state.supply[c]}</div>`;
        }else{
          html += `<img class="passivecard" src="/${this.name.toLowerCase()}/img/cards/blank.jpg">`;
          html += `<div class="tiptext">No more ${this.cardToText(c,true)}</div>`;
        }
        html += "</div>";  
      }
    }
    html += "</div>";

    $(".gameboard").html(html);
    this.attachCardboxEvents();
    this.attachBoardEvents();
  }

  filterBoardDisplay(max){
    for (let c in this.game.state.supply){
      if (c !== "curse"){
        if (this.deck[c].cost > max){
          $(`#${c}.cardpile img`).css("filter","brightness(0.15)");
        }else{
          $(`#${c}.cardpile img`).css("filter","brightness(0.95)");
        }
      }
    }
  }

  attachBoardEvents(){
    let we_self = this;
    $("#zoom").off();
    $("#zoom").on("click",function(){
      $("#zoom").toggleClass("active");
      if ($("#zoom").hasClass("active")){
        $(".cardpile").addClass("showcard");
        $(".cardpile").removeClass("tip");
      }else{
        we_self.cardbox.detachCardEvents();
        $(".cardpile").addClass("tip");
        $(".cardpile").removeClass("showcard");
      }
      
      //We don't use attachCardboxEvents because player may have events attached
      //to the HUD that would be wiped out
      we_self.cardbox.attachCardEvents();
    });

    $(".cardstacks").draggable();

  }

  returnPlayerVP(player){
    if (!this.game.deck[player-1]?.cards){return 0;}

    let numCards = Object.keys(this.game.deck[player-1].cards).length;
    return this.game.state.players[player-1].vp + this.game.state.players[player-1].gardens * Math.floor(numCards/10) - this.game.state.players[player-1].curses; 
  }

  updateScore(){
    let html = "";
    for (let i = 1; i <= this.game.players.length; i++){
      html += `<div class="score">${(i==this.game.player)?"Me":`Player ${i}`}: ${this.returnPlayerVP(i)}</div>`;
    }
    this.scoreboard.update(html);
  }

  gameOver(){
    if (this.game.state.supply.province == 0){
      return true;
    }
    let count = 0;
    for (let s in this.game.state.supply){
      if (this.game.state.supply[s]==0){
        count++;
      }
    }

    return (count>=3);
  }

  //Utilities
  hasActionCard(){
    let pi = this.game.player-1;
    for (let c of this.game.deck[pi].hand){
      let cardname = this.game.deck[pi].cards[c];
      if (this.deck[cardname].type.includes("action")){
        return true;
      }
    }
    return false;
  }

  hasCardInHand(cardvalue){
    let pi = this.game.player-1;
    for (let c of this.game.deck[pi].hand){
      console.log(cardvalue, this.game.deck[pi].cards[c]);
      if(this.game.deck[pi].cards[c] == cardvalue){
        return true;
      }
    }
    return false;
  }

   countMoney(){

    let bank = this.game.state.coins;
    let pi = this.game.player-1;
    for (let c of this.game.deck[pi].hand){
      let cardname = this.game.deck[pi].cards[c];
      if (this.deck[cardname].type == "treasure"){
        bank += parseInt(this.deck[cardname].text);
        if (this.game.state.merchant && cardname == "silver"){
          bank++;
          this.game.state.merchant = false;
        }
      }
    }
    return bank;
  }

  spendMoney(price){
    let pi = this.game.player-1;
    let used = [];
    this.sortHand();
    for (let i = this.game.deck[pi].hand.length - 1; i >= 0; i--){
      let cardname = this.game.deck[pi].cards[this.game.deck[pi].hand[i]];
      if (this.deck[cardname].type == "treasure"){
        if (parseInt(this.deck[cardname].text) <= price){
          used.push(cardname);
          price -= parseInt(this.deck[cardname].text);
        }
      }
    }
    if (price>0){
      if (price <= this.game.state.coins){
        this.game.state.coins -= price;
      }else{
        console.error("Overspending");
      }
    }
    for (let bill of used){
      this.removeCardFromHand(bill);
      this.cards_in_play.push(this.lastCardKey);
    }
  }

  cardToText(card, textonly = false){
    try{
      if (textonly){
        return this.deck[card].name;
      }else{
        return `<span class="logcard" id="${card}">${this.deck[card].name}</span>`;
      }
    }catch(err){
      console.log(err);
      console.log(card,this.deck[card]);
    }
  }

  cardsToText(cards){
    if (cards.length == 0){
      return "";
    }
    if (cards.length == 1){
      return this.cardToText(cards[0]);
    }
    let text = "";
    for (let c of cards){
      text += this.cardToText(c) + ", ";
    }
    return text.substring(0, text.length - 2);
  }

  /*
  Get the card out of the hand (but don't add it to the discards ...yet)
  */
  removeCardFromHand(card) {
    console.log("Should remove: " + card);
    if (this.game.player == 0) { return; }
    let pi = this.game.player-1;
    for (let i = 0; i < this.game.deck[pi].hand.length; i++) {
      if (this.game.deck[pi].cards[this.game.deck[pi].hand[i]] == card) {
        this.lastCardKey = this.game.deck[pi].hand[i];
        this.lastCardValue = card;
        this.game.deck[pi].hand.splice(i, 1);
        return; //Only remove one copy
      }
    }
    console.log("Card not found");
  }
  removeCardFromPool(card, pool) {
    if (this.game.player == 0) { return; }
    for (let i = 0; i < this.game.pool[pool-1].hand.length; i++) {
      if (this.game.pool[pool-1].cards[this.game.pool[pool-1].hand[i]] == card) {
        this.lastCardKey = this.game.pool[pool-1].hand[i];
        this.lastCardValue = card;
        this.game.pool[pool-1].hand.splice(i, 1);
        return; //Only remove one copy
      }
    }
  }

 playCard(player, card_to_play){
    console.log("Playing card",player,card_to_play);
    console.log(JSON.parse(JSON.stringify(this.game.state)));
    we_self = this;

    //Attacks
    if (this.deck[card_to_play].type.includes("attack")){
      this.overlay.show(this.app, this, this.returnAttackOverlay(card_to_play));
      for (let i = 1; i <= this.game.players.length; i++){
        this.game.queue.push(`attack\t${player}\t${i}\t${card_to_play}`);
      }
    }

    //**
    if (card_to_play == "bandit"){
      //Gain a gold. Each other player reveals the top 2 cards of their deck, trashes a revealed Treasure other than Copper, and discards the rest.
      this.game.queue.push(`buy\t${player}\tgold`);
    }
    //**
    if (card_to_play == "bureaucrat"){
      //Gain a Silver onto your deck. Each other player reveals a Victory card from their hand and puts it onto their deck (or reveals a hand with no Victory cards)
      this.game.queue.push(`buy\t${player}\tsilver\tdeck`);
    }
   //**
    if (card_to_play == "militia"){
      //+2 Coin, Each other play discards down to 3 cards in hand
      this.game.state.coins += 2;
    }
    //**
    if (card_to_play == "spy"){
      //+1 Card +1 Action, Each player (including you) reveals the top card of their deck and either discards it or puts it back, your choice.
      this.game.state.actions++;
      this.game.queue.push(`SAFEDEAL\t${player}\t${player}\t1`) 
    }
    if (card_to_play == "thief"){
      //Each other player reveals the top 2 cards of their deck. If they revealed any Treasure cards, you choose one to trash. You may gain any and all of these trashed cards. Other revealed cards are discarded.      
    }
    //**
    if (card_to_play == "witch"){
      //+2 Cards, each other player gains a curse
      this.game.queue.push(`SAFEDEAL\t${player}\t${player}\t2`)
    }
 
    //Other Cards

    //**
    if (card_to_play == "adventurer"){
      //Reveal cards from your deck until you reveal 2 Treasure cards. Put those into your hand and discard the other revealed cards.
      this.game.state.shuffled = false;
      this.game.state.adventurer = 2;
      this.game.queue.push(`adventurer\t${player}`);
      this.game.queue.push(`POOL\t${player}`);
    }
    //**
    if (card_to_play == "artisan"){
      //Gain a card to your hand costing up to 5. Put a card from your hand onto your deck.
      this.game.queue.push(`hand\t${player}\t1\tdeck`);
      if (this.game.player == player){
        this.acquireCard(5, "hand");
      }
      return 0;
    }
    //**
    if (card_to_play == "cellar"){
      //+1 Action, Discard any number of cards, then draw that many.
      this.game.state.actions++;
      if (this.game.player == player){
        let number = 0;
        this.updateStatusAndListCards(`Select cards to discard:`,[],true);
        this.bindBackButtonFunction(()=>{
          if (number > 0){
            we_self.prependMove(`SAFEDEAL\t${player}\t${player}\t${number}`);  
          }
          we_self.endTurn();
          we_self.updateStatusAndListCards(`Dealing ${number} cards...`);
        });
        this.attachCardboxEvents(function(card){
          number++;
          we_self.removeCardFromHand(card);
          let div = document.querySelector("#status #"+card);
          if (div){
            div.remove();
          }
          we_self.addMove(`DISCARD\t${player}\t${we_self.lastCardKey}`);
        });
      }
      return 0;
    }
    //**
    if (card_to_play == "chancellor"){
      //+2 coin, You may immediately put your deck into your discard pile.
      this.game.state.coins += 2;
      if (this.game.player == player){
        let html = `<ul><li class="card nocard" id="yes">yes</li><li class="card nocard" id="no">no</li></ul>`;
        this.updateStatusWithOptions("Would you like to discard your deck (for an immediate reshuffle)?", html);
        this.attachCardboxEvents(function(card){
          if (card == "yes"){
            we_self.addMove(`SHUFFLEDISCARDS\t${player}`);
          }
          we_self.endTurn();
        });
      }
      return 0;
    }
    //**
    if (card_to_play == "chapel"){
      //Trash up to 4 cards from your hand.
      this.game.queue.push(`hand\t${player}\t4\ttrash\t1`);
    }
    //**
    if (card_to_play == "councilroom"){
      //+4 Cards +1 Buy, Each other player draws a card
      this.game.state.buys++;
      for (let i = 1; i <= this.game.players.length; i++){
        if (i !== player){
          this.game.queue.push(`SAFEDEAL\t${i}\t${i}\t1`);    
        }
      }
      this.game.queue.push(`SAFEDEAL\t${player}\t${player}\t4`);
    }
    //**
    if (card_to_play == "feast"){
      //Trash this card. Gain a card costing up to 5
      if (this.game.player == player){
        this.addMove(`trash\t${player}\t${this.lastCardKey}\t${this.lastCardValue}`);
        this.acquireCard(5);
      }
      return 0;
    }
    //**
    if (card_to_play == "festival"){
      //+2 Actions, +1 Buy, +2 Coin
      this.game.state.actions += 2;
      this.game.state.buys    += 1;
      this.game.state.coins   += 2;
    }
    //**
    if (card_to_play == "gardens"){
      //+1 VP for 10 cards in deck
    }
    //**
    if (card_to_play == "harbinger"){
      //+1 Card, +1 Action, Look through your discard pile. You may put a card from it onto your deck.
      this.game.state.actions++;
      this.game.queue.push(`harbinger\t${player}`);
      this.game.queue.push(`SAFEDEAL\t${player}\t${player}\t1`);
    }
    //**
    if (card_to_play == "laboratory"){
      //+2 Cards, +1 Action      
      this.game.state.actions++;
      this.game.queue.push(`SAFEDEAL\t${player}\t${player}\t2`)
    }
    //**
    if (card_to_play == "library"){
      //Draw until you have 7 cards in hand, skipping any Action cards you choose to. Set those aside to discard afterwards
      this.game.state.shuffled = false;
      this.game.queue.push(`library\t${player}`);
      this.game.queue.push(`POOL\t${player}`);
    }
    //**
    if (card_to_play == "market"){
      //+1 Card +1 Action +1 Buy +1 Coin
      this.game.state.actions++;
      this.game.state.buys++;
      this.game.state.coins++;
      this.game.queue.push(`SAFEDEAL\t${player}\t${player}\t1`)
    }
    //**
    if (card_to_play == "merchant"){
      //+1 Card +1 Action The first time you play a Silver this turn, +1 Coin
      this.game.state.merchant = true;
      this.game.state.actions++;
      this.game.queue.push(`SAFEDEAL\t${player}\t${player}\t1`)
    }
    //**
    if (card_to_play == "mine"){
      //You may trash a Treasure from your hand. Gain a treasure to your hand costing up to 3 more than it
      if (player == this.game.player){
        let tcards = [];
        for (let c of this.game.deck[player-1].hand){
          let cname = this.game.deck[player-1].cards[c];
          if (this.deck[cname].type == "treasure"){
            tcards.push(cname);
          }
        }
        if (tcards.length == 0){
          this.endTurn();
        }else{
          this.updateStatusAndListCards(`You may trash a treasure to acquire one costing 3 more than it.`, tcards, true);
          this.attachCardboxEvents(function(tc){
            we_self.removeCardFromHand(tc);
            if (tc == "copper"){
              we_self.addMove(`buy\t${player}\tsilver\thand`);
            }else{
              we_self.addMove(`buy\t${player}\tgold\thand`);
            }
            we_self.addMove(`trash\t${player}\t${we_self.lastCardKey}\t${we_self.lastCardValue}`);
            we_self.endTurn();
          });
        }
      }
      return 0;
    }
    //**
    if (card_to_play == "moat"){
      //+2 Cards, When another player plays an Attack card, you may first reveal this from your hand to be unaffected by it
      this.game.queue.push(`SAFEDEAL\t${player}\t${player}\t2`) 
    }
    //**
    if (card_to_play == "moneylender"){
      //You may trash a Copper from your hand for +3 Coin
      if (player == this.game.player){
        if (this.hasCardInHand("copper")){
           let html = `<ul><li class="card nocard" id="yes">yes</li><li class="card nocard" id="no">no</li></ul>`;
           this.updateStatusWithOptions("Would you like to trash a copper for +3 coin this turn?", html);
           this.attachCardboxEvents(function(card){
              if (card == "yes"){
                we_self.game.state.coins += 3;
                we_self.removeCardFromHand("copper");
                we_self.addMove(`trash\t${player}\t${we_self.lastCardKey}\t${we_self.lastCardValue}`);
              }
              we_self.endTurn();
            });
        }else{
          this.endTurn();
        }
      }
      return 0;
    }
    //**
    if (card_to_play == "poacher"){
      //+1 Card, +1 Action, +1 Coin, Discard a card per empty Supply pile
      this.game.state.actions++;
      this.game.state.coins++;
      let num = 0;
      for (let s in this.game.state.supply){
        if (this.game.state.supply[s]==0){
          num++;
        }
      }
      this.game.queue.push(`hand\t${player}\t${num}\tdiscards`);
      this.game.queue.push(`SAFEDEAL\t${player}\t${player}\t1`);
    }
    //**
    if (card_to_play == "remodel"){
      //Trash a card from your hand. Gain a card costing up to 2 more than it
      if (this.game.player == player){
        this.updateStatusAndListCards(`Pick a card to trash in exchange for a new card worth up to 2 more`);
        this.attachCardboxEvents(function(card){
          we_self.removeCardFromHand(card);
          we_self.addMove(`trash\t${player}\t${we_self.lastCardKey}\t${we_self.lastCardValue}`);
          we_self.acquireCard(we_self.deck[card].cost + 2);
        });
      }
      return 0;
    }
    //**
    if (card_to_play == "sentry"){
      //+1 Card +1 Action, Look at the top 2 cards of your deck. Trash and/or discard any number of them. Put the rest back on top in any order
      this.game.queue.push(`sentry\t${player}`);
      this.game.state.actions++;
      this.game.queue.push(`SAFEPOOLDEAL\t${player}\t2\t${player}`);
      this.game.queue.push(`POOL\t${player}`);
      this.game.queue.push(`SAFEDEAL\t${player}\t${player}\t1`)
    }
    //**
    if (card_to_play == "smithy"){
      //+3 Cards      
      this.game.queue.push(`SAFEDEAL\t${player}\t${player}\t3`)
    }
    //**
    if (card_to_play == "throneroom"){
      //You may play an Action card from your hand twice  
      this.game.state.throneroom = true;
    }
    //**
    if (card_to_play == "vassal"){
      //+2 Coin, Discard the top card of your deck. If it's an Action card, you may play it.
      this.game.state.coins += 2;
      this.game.queue.push(`vassal\t${player}`);
      this.game.queue.push(`SAFEPOOLDEAL\t${player}\t1\t${player}`);
      this.game.queue.push(`POOL\t${player}`);
    }
    //**
    if (card_to_play == "village"){
      //+1 Card, +2 Actions
      this.game.state.actions += 2;
      this.game.queue.push(`SAFEDEAL\t${player}\t${player}\t1`)
    }
    //**
    if (card_to_play == "woodcutter"){
      //+1 Buy, +2 Coins
      this.game.state.buys++;
      this.game.state.coins+=2;
    }
    //**
    if (card_to_play == "workshop"){
      //Gain a card costing up to 4
      if (this.game.player == player){
        this.acquireCard(4);
      }      
      return 0;
    }
 
    return 1;
 }
       

  returnCardList(cardarray = [], deckid = 0) {
    let did = this.game.player - 1;
    if (cardarray.length == 0){
      for (let i = 0; i < this.game.deck[did].hand.length; i++){
        cardarray.push(this.game.deck[did].cards[this.game.deck[did].hand[i]]);
      }  
    }
    return super.returnCardList(cardarray, did);
  }

  returnCardImage(cardname){
    if (this.deck[cardname]?.img){
      return `<img class="cardimg" src="/${this.name.toLowerCase()}/img/cards/${this.deck[cardname].img}" />`;
    }else if (cardname === "my_hand"){
    
      //Draw and discard pile
      let pooled_cards = 0;
      if (this.game.pool?.length >= this.game.player){
        if (this.game.pool[this.game.player-1]?.hand){
          pooled_cards = this.game.pool[this.game.player-1].hand.length;
        }
      }
      let html = `<div id="mydecks">
               <div class="drawdeck">Deck: ${this.game.deck[this.game.player-1].crypt.length}</div>
               <div class="drawdeck">Hand: ${this.game.deck[this.game.player-1].hand.length}</div>
               <div class="drawdeck">Used: ${this.cards_in_play.length + pooled_cards}</div>
               <div class="discardpile">Discards: ${Object.keys(this.game.deck[this.game.player-1].discards).length}</div>
               <div class="drawdeck">Total: ${Object.keys(this.game.deck[this.game.player-1].cards).length}</div>`;
      if (this.last_discard){
        html += `<div>Last: ${this.cardToText(this.last_discard)}</div>`;
      }
      html += `</div>`;
      return html;
    }else{
      return ""
    }
  }



  ////////////////////
  // Core Game Data //
  ////////////////////
  returnState() {

    let state = {};
    state.supply = { };
    
    let numPlayers = this.game.players.length;
    state.supply.copper = 60 - 7*numPlayers;
    state.supply.silver = 40;
    state.supply.gold = 30;
    state.supply.estate = 12;
    state.supply.duchy = 12;
    state.supply.province = 12;
    state.supply.curse = 10 * (numPlayers-1); 

    state.buys = 1;
    state.actions = 1;
    state.coins = 0;

    state.welcome = 0;
    state.players = [];
    for (let i = 0; i < this.game.players.length; i++){
      let stats = {vp:3, gardens:0, curses:0, turns:0};
      state.players.push(stats);
    }
  
    return state;

  }

  returnFirstEd(){
    return ["cellar", "chapel", "moat", "chancellor", "woodcutter", "feast", "village", "workshop",
            "bureaucrat", "gardens", "militia", "moneylender", "spy", "remodel", "smithy",
            "throneroom", "thief", "councilroom", "festival", "laboratory", "library", 
            "market", "mine", "witch", "adventurer"];
  }

  returnSecondEd(){
    return ["cellar", "chapel", "moat", "harbinger", "merchant", "vassal", "village", "workshop",
            "bureaucrat", "gardens", "militia", "moneylender", "poacher", "remodel", "smithy",
            "throneroom", "bandit", "councilroom", "festival", "laboratory", "library", 
            "market", "mine", "sentry", "witch", "artisan"];
  }

  returnInitialHand(){
    let hand = {};
    for (let i = 1; i <= 7; i++){
      hand[i.toString()] = "copper";
    }
    for (let i = 8; i <= 10; i++){
      hand[i.toString()] = "estate";
    }

    return hand;
  }

  returnLastCard(){
    var deck = {};
    deck[this.lastCardKey] = this.lastCardValue;
    return deck;
  }

  returnCards() {

    var deck = {};

    deck['copper']    = { img : "copper.jpg" , name : "Copper", type : "treasure" , cost : 0 , text: "+1 Coin"};
    deck['silver']    = { img : "silver.jpg" , name : "Silver", type : "treasure" , cost : 3 , text: "+2 Coin"};
    deck['gold']      = { img : "gold.jpg" , name : "Gold", type : "treasure" , cost : 6 , text: "+3 Coin"};
    deck['estate']    = { img : "estate.jpg" , name : "Estate", type : "victory" , cost : 2 , text:"+1 VP"};
    deck['duchy']     = { img : "duchy.jpg" , name : "Duchy", type : "victory" , cost : 5 , text:"+3 VP"};
    deck['province']  = { img : "province.jpg" , name : "Province", type : "victory" , cost : 8 , text: "+6 VP"};
    deck['curse']     = { img : "curse.jpg" , name : "Curse", type : "victory" , cost : 0 , text: "-1 VP"};
    deck['adventurer']= { img : "adventurer.jpg" , name : "Adventurer", type : "action" , cost : 6 , text: "Reveal cards from your deck until you reveal 2 Treasure cards. Put those into your hand and discard the other revealed cards."};
    deck['artisan']   = { img : "artisan.jpg" , name : "Artisan", type : "action" , cost : 6 , text: "Gain a card to your hand costing up to 5. Put a card from you hand onto your deck."};
    deck['bandit']    = { img : "bandit.jpg" , name : "Bandit", type : "action - attack" , cost : 5 , text: "Gain a gold. Each other player reveals the top 2 cards of their deck, trashes a revealed Treasure other than Copper, and discards the rest."};
    deck['bureaucrat']= { img : "bureaucrat.jpg" , name : "Bureaucrat", type : "action - attack" , cost : 4 , text: "Gain a Silver onto your deck. Each other player reveals a Victory card from their hand and puts it onto their deck (or reveals a hand with no Victory cards)."};
    deck['cellar']    = { img : "cellar.jpg" , name : "Cellar", type : "action" , cost : 2 , text: "+1 Action, Discard any number of cards, then draw that many."};
    deck['chancellor']= { img : "chancellor.jpg" , name : "Chancellor", type : "action" , cost : 3 , text: "+2 coin, You may immediately put your deck into your discard pile."};
    deck['chapel']    = { img : "chapel.jpg" , name : "Chapel", type : "action" , cost : 2 , text: "Trash up to 4 cards from your hand."};
    deck['councilroom'] = { img : "councilroom.jpg" , name : "Council Room", type : "action" , cost : 5 , text: "+4 Cards +1 Buy, Each other player draws a card"};
    deck['feast']       = { img : "feast.jpg" , name : "Feast", type : "action" , cost : 4 , text: "Trash this card. Gain a card costing up to 5"};
    deck['festival']    = { img : "festival.jpg" , name : "Festival", type : "action" , cost : 5 , text: "+2 Actions, +1 Buy, +2 Coin"};
    deck['gardens']     = { img : "gardens.jpg" , name : "Gardens", type : "victory" , cost : 4 , text: "+1 VP for 10 cards in deck"};
    deck['harbinger']   = { img : "harbinger.jpg" , name : "Harbinger", type : "action" , cost : 3 , text: "+1 Card, +1 Action, Look through your discard pile. You may put a card from it onto your deck."};
    deck['laboratory']  = { img : "laboratory.jpg" , name : "Laboratory", type : "action" , cost : 5 , text: "+2 Cards, +1 Action"};
    deck['library']     = { img : "library.jpg" , name : "Library", type : "action" , cost : 5 , text: "Draw until you have 7 cards in hand, skipping any Action cards you choose to. Set those aside to discard afterwards"};
    deck['market']      = { img : "market.jpg" , name : "Market", type : "action" , cost : 5 , text: "+1 Card +1 Action +1 Buy +1 Coin"};
    deck['merchant']    = { img : "merchant.jpg" , name : "Merchant", type : "action" , cost : 3 , text: "+1 Card +1 Action The first time you play a Silver this turn, +1 Coin"};
    deck['militia']     = { img : "militia.jpg" , name : "Militia", type : "action - attack" , cost : 4 , text: "+2 Coin, Each other play discards down to 3 cards in hand"};
    deck['mine']        = { img : "mine.jpg" , name : "Mine", type : "action" , cost : 5 , text: "You may trash a Treasure from your hand. Gain a treasure to your hand costing up to 3 more than it"};
    deck['moat']        = { img : "moat.jpg" , name : "Moat", type : "action - reaction" , cost : 2 , text: "+2 Cards, When another player plays an Attack card, you may first reveal this from your hand to be unaffected by it"};
    deck['moneylender'] = { img : "moneylender.jpg" , name : "Moneylender", type : "action" , cost : 4 , text: "You may trash a Copper from your hand for +3 Coin"};
    deck['poacher']     = { img : "poacher.jpg" , name : "Poacher", type : "action" , cost : 4 , text: "+1 Card, +1 Action, +1 Coin, Discard a card per empty Supply pile"};
    deck['remodel']     = { img : "remodel.jpg" , name : "Remodel", type : "action" , cost : 4 , text: "Trash a card from your hand. Gain a card costing up to 2 more than it"};
    deck['sentry']      = { img : "sentry.jpg" , name : "Sentry", type : "action" , cost : 5 , text: "+1 Card +1 Action, Look at the top 2 cards of your deck. Trash and/or discard any number of them. Put the rest back on top in any order"};
    deck['smithy']      = { img : "smithy.jpg" , name : "Smithy", type : "action" , cost : 4 , text: "+3 Cards"};
    deck['spy']         = { img : "spy.jpg" , name : "Spy", type : "action - attack" , cost : 4 , text: "+1 Card +1 Action, Each player (including you) reveals the top card of their deck and either discards it or puts it back, your choice."};
    deck['thief']       = { img : "thief.jpg" , name : "Thief", type : "action - attack" , cost : 4 , text: "Each other player reveals the top 2 cards of their deck. If they revealed any Treasure cards, you choose one to trash. You may gain any and all of these trashed cards. Other revealed cards are discarded."};
    deck['throneroom']  = { img : "throneroom.jpg" , name : "Throne Room", type : "action" , cost : 4 , text: "You may play an Action card from your hand twice"};
    deck['vassal']      = { img : "vassal.jpg" , name : "Vassal", type : "action" , cost : 3 , text: "+2 Coin, Discard the top card of your deck. If it's an Action card, you may play it."};
    deck['village']     = { img : "village.jpg" , name : "Village", type : "action" , cost : 3 , text: "+1 Card, +2 Actions"};
    deck['witch']       = { img : "witch.jpg" , name : "Witch", type : "action - attack" , cost : 5 , text: "+2 Cards, each other player gains a curse"};
    deck['woodcutter']  = { img : "woodcutter.jpg" , name : "Woodcutter", type : "action" , cost : 3 , text: "+1 Buy, +2 Coins"};
    deck['workshop']    = { img : "workshop.jpg" , name : "Workshop", type : "action" , cost : 3 , text: "Gain a card costing up to 4"};

    return deck;

  }

  sortHand(){
    if (this.game.player == 0){ return; }
    this.game.deck[this.game.player-1].hand.sort((a,b) =>{
      let c_a = this.deck[this.game.deck[this.game.player-1].cards[a]];
      let c_b = this.deck[this.game.deck[this.game.player-1].cards[b]];
      if (c_a.type < c_b.type){
        return -1;
      }
      if (c_a.type > c_b.type){
        return 1;
      }
      if (c_a.cost < c_b.cost){
        return -1;
      }
      if (c_a.cost > c_b.cost){
        return 1;
      }
      return 0;
    });
    
  }


  returnGameRulesHTML(){
    let html = `<div class="rules-overlay">
    <h1>${this.name}</h1>
    <p>You are the ruler of a small kingdom with grand hopes and dreams. In all directions lie small tracts of land on the verge of a nervous breakdown. Pacify these lands under your banner and expand your kingdom, and do it quickly as other principalities are looking to expand. Hire minions, construct buildings, and fill the coffers of your treasury.</p>
    <h2>How to Play</h2>
    <p>Players take turns, playing an <em>action</em> card from their hand, then buying a card from the supply pile with their <em>treasure</em>. Each player begins with seven COPPER and 3 ESTATES, so in the first two turns the player will not have any ACTION cards to play. Playing an action card or buying a card is optional, but each player is guaranteed one play or purchase per turn. Some action cards give players additional actions, purchases, or temporary treasure to spend that turn. All cards in the players hand are discarded at the end of the turn. </p>
    <h2>How to Win</h2>
    <p>The game ends when all the PROVINCE cards are purchased or any three supply stacks are emptied. (The game begins with 10 copies of each playing card). Players go through their deck summing up their total number of VICTORY POINTS to determine the winner. There are 3 TREASURE cards and 3 VICTORY cards also in the supply. All cards are put on top of your discards and shuffled back into your deck, even VICTORY cards which have no associated value for playing or purchasing.</p>
    `;
    
    return html;
  }

  returnGameOptionsHTML(){
      let html = `
      <h1 class="overlay-title">${this.name} Options</h1>
        <div class="overlay-input">
          <label for="card_set">Prearranged Supplies:</label>
          <select name="card_set">
            <option value="random" selected default>None (Random)</option>
            <option value="firstgame">First Game</option>
            <option value="bigmoney">Big Money</option>
            <option value="interaction">Interaction</option>
            <option value="sizedistortion">Size Distortion</option>
            <option value="villagesquare">Village Square</option>
          </select>
        </div>
        <div class="overlay-input">
          <input type="checkbox" name="second" />
          <label for"second">Use Second Edition Cards</label>
        </div>
    `;
    return html;
  }






} // end Monarchy class

module.exports = Monarchy;



