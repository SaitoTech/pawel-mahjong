
module.exports = RedSquareMenuTemplate = (app, mod) => {

  return `
    <div class="redsquare-menu">
          <div>
            <div class="saito-menu-list dense ">
              <ul>
                <li>
                  <i class="fas fa-home"></i>
                  <span> Home </span>
                </li>
                <li>
                  <i class="fas fa-calendar"></i>
                  <span> Events</span>
                </li>
                <li class="redsquare-menu-invites">
                  <i class="far fa-id-card"></i>
                  <span> Invites</span>
                </li>
                <li>
                  <i class="fas fa-user"></i>
                  <span> Profile</span>
                </li>
                <li>
                  <i class="fas fa-gamepad"></i>
                  <span> Games</span>
                </li>
                <li>
                  <i class="fas fa-address-book"></i>
                  <span>Contacts</span>
                </li>
              </ul>
            </div>
          </div>
    </div>
  `;

}
