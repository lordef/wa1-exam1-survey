// 'use strict';

function Message(msg = "Impossible to load something! Please, try again later...", type = 'danger') {
  this.msg = msg;
  this.type = type;

  this.toString = () => {
    return `Message: msg: ${this.msg}, type: ${this.type}`;
  }

  // { msg: "Impossible to load your tasks! Please, try again later...", type: 'danger' }
}

module.exports = { Message };