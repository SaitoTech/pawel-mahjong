module.exports = SaitoHeaderTemplate = function (app, mod) {
    var html = "\n\n  <div id=\"saito-header\" class=\"header header-home\">\n    <div class=\"header-wrapper\">\n      <a id=\"header-logo-link\" href=\"/\"><img class=\"logo\" src=\"/saito/img/logo.svg\"></a>\n      <div id=\"header-icon-links\" class=\"header-icon-links\">\n        <div id=\"header-mini-wallet\" class=\"header-mini-wallet\">\n          <span id=\"header-username\" class=\"header-username\"></span>\n        </div>\n        <i id=\"navigator\" class=\"header-icon icon-med fas fa-bars\"></i>\n      </div>\n\n      <div id=\"settings-dropdown\" class=\"header-dropdown\">\n        <div class=\"personal-info\">\n          <img id=\"header-profile-photo\" class=\"header-profile-photo\" />\n          <div class=\"account-info\">\n            <div id=\"profile-public-key\" class=\"profile-public-key\"></div>\n            <div class=\"saito-select\">\n              <select id=\"header-token-select\" class=\"saito-slct\"></select>\n            </div>\n            </div>\n        </div>\n\n        <center><hr width=\"98%\" style=\"color:#888\"/></center>\n\n        <div class=\"wallet-actions\">\n          <!-- faucet disabled \n          div class=\"wallet-action-row\" id=\"header-dropdown-faucet\">\n            <span class=\"scan-qr-info\"><i class=\"settings-fas-icon fas fa-tint\"></i>SAITO testnet faucet</span>\n          </div\n          -->\n          <div class=\"wallet-action-row\" id=\"header-dropdown-backup-wallet\">\n            <span class=\"scan-qr-info\"><i class=\"settings-fas-icon fas fa-copy\"></i> Backup Access Keys</span>\n          </div>\n          <div class=\"wallet-action-row\" id=\"header-dropdown-restore-wallet\">\n            <span class=\"scan-qr-info\"><i class=\"settings-fas-icon fas fa-redo\"></i> Restore Access Keys</span>\n\t    <div style=\"display:none\"><input id=\"saito-header-file-input\" class=\"saito-header-file-input\" type=\"file\" name=\"name\" style=\"display:none;\" /></div>\n          </div>\n          <div class=\"wallet-action-row\" id=\"header-dropdown-settings\">\n            <span class=\"scan-qr-info\"><i class=\"settings-fas-icon fas fa-wrench\"></i> Settings </span>\n          </div>\n          <div class=\"wallet-action-row\" id=\"header-dropdown-scan-qr\">\n            <span class=\"scan-qr-info\"><i class=\"settings-fas-icon fas fa-qrcode\"></i> Scan </span>\n          </div>\n        </div>\n       </div>\n     </div>\n  ";
    return html;
};
//# sourceMappingURL=saito-header.template.js.map