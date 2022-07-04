var saito = require('../../lib/saito/saito');
var InviteTemplate = require('../../lib/templates/invitetemplate');
const InvitesEmailAppspace = require('./lib/email-appspace/email-appspace');


class Invites extends InviteTemplate {

  constructor(app) {
    super(app);

    this.app            = app;
    this.name           = "Invites";
    this.description    = "Demo module with UI for invite display and acceptance";
    this.categories     = "Utilities Education Demo";

    this.invites        = [];
    this.scripts	= ['/saito/lib/jsonTree/jsonTree.js'];
    this.styles		= ['/invites/style.css','/saito/lib/jsonTree/jsonTree.css'];
    return this;
  }


  initialize(app) {
    this.load();
  }



  respondTo(type) {

    if (type == 'email-appspace') {
      super.render(this.app, this); // for scripts + styles
      return new InvitesEmailAppspace(this.app, this);
    }

    return null;
  }


  //
  // InviteTemplate handles
  //
  async onConfirmation(blk, tx, conf, app) {
    super.onConfirmation(blk, tx, conf, app);
  }

}


module.exports = Invites;

