// Minimal email module stub to allow server to start
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `App <noreply@example.com>`;
  }

  async sendWelcome() {
    console.log(`Would send welcome email to ${this.to}`);
  }

  async sendPasswordReset() {
    console.log(`Would send password reset email to ${this.to}`);
  }
};
