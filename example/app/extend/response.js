module.exports = {
  get isNotFound() {
    return this.status === 404;
  },
};
