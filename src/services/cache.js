//cache class imitates a caching system to prevent frequent calls to the database
//It can be replaced by any other caching system such as redis or memcached
class Cache {
  datasource = Promise;
  storage = null;
  ttl = 10000;
  expireAt = new Date();
  constructor({
    source = () => {
      return new Promise((resolve, reject) => {
        resolve([]);
      });
    },
    ttl = 10000
  }) {
    this.datasource = source();
    this.ttl = ttl;
  }
  data = (refresh = false) => {
    return new Promise((resolve, reject) => {
      if (this.expireAt < new Date() || refresh || !this.storage) {
        this.datasource
          .then(data => {
            if (data) {
              this.storage = data;
              this.expireAt = new Date(new Date().getTime() + this.ttl);
              resolve(this.storage);
            }
          })
          .catch(err => {
            reject(err);
          });
      } else {
        console.log("STALE")
        resolve(this.storage);
      }
    });
  };
  flush = () => {
    this.storage = null;
  };
}

module.exports = Cache;
