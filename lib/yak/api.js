/** Dependencies */
var unirest = require('unirest');
var crypto  = require('crypto');
var qs      = require('querystring');
var util    = require('../util');


/** @const */
var YAK_KEY    = '35FD04E8-B7B1-45C4-9886-94A75F4A2BB4';
var API_BASE   = 'https://yikyakapp.com/api/';
var USER_AGENT = 'Mozilla/5.1 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76B) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.133 Mobile Safari/535.19';
var SIGN_BASE  = '/api/';


/**
 * Yak API
 * 
 * @module
 */
module.exports = {
  
  /**
   * HTTP GET
   *
   * @param {string} page   - Page of request
   * @param {object} params - Request params
   */
  get: function(page, params, cb) {
    // set headers
    var headers = { 
      'User-Agent': USER_AGENT, 
      'Accept-Encoding': 'gzip' 
    };
    
    // sign params
    params = util.deepMerge(params, this.signRequest(page, params));
    
    // do request
    return unirest.get(API_BASE + page)
      .headers(headers)
      .query(util.stringify(params))
      .end(cb);
  },
  
  
  
  /**
   * Sign HTTP Request
   *
   * @param {string} page   - Page of request
   * @param {object} params - Request params
   */
  signRequest: function(page, params) {
    var salt = Math.round(Date.now()/1000).toString();
    var msg  = SIGN_BASE + page;
    
    if (util.isObject(params) && !util.isEmpty(params)) {
      msg += '?' + util.stringify(util.sortObject(params));
    }
    
    var hash = crypto.createHmac('sha1', YAK_KEY).update(msg + salt).digest('base64');
    
    // need hash and salt
    return { hash: hash, salt: salt };
  },
  
  
  
  /**
   * Register Yak Account
   *
   * @param   {string}  user_id  - MD5 user id
   * @param   {object}  location - lat/long coordinates
   * @returns {boolean}
   */
  registerAccount: function(user_id, location) {
    var params = util.deepMerge(location, { userID: user_id });
    
    this.get('registerUser', params, function(res) {
      if (res.error) {
        util.log('Error registering user!');
        return res.error
      }
      util.log('Registered new user: ' + user_id + ' @ ' + location.lat + ', ' + location.long);
    });
  },
  
  
  
  /**
   * List Yaks
   *
   * @param {string} user_id  - MD5 user id
   * @param {object} location - lat/long coordinates
   */
  list: function(user_id, location, cb) {
    var self = this;
    var params = util.deepMerge(location, { userID: user_id });
    this.get('getMessages', params, function(res) {
      cb(self.formatMessages(res.body.messages));
    });
  },
  
  
  
  /**
   * Get Comments
   *
   * @param {string} user_id  - MD5 user id
   * @param {object} location - lat/long coordinates
   * @param {string} message_id
   */
  comments: function(user_id, location, message_id, cb) {
    var self = this;
    var params = util.deepMerge(location, { userID: user_id, messageID: 'R/'+message_id });
    this.get('getComments', params, function(res) {
      cb(self.formatComments(res.body.comments));
    });
  },
  
  
  
  /**
   * Format Yak Messages
   *
   * @param {array} messages
   */
  formatMessages: function(messages) {
    return messages.map(function(m) {
      return {
        _id:          m.messageID.replace('R/', ''),
        content:      m.message,
        latitude:     m.latitude,
        longitude:    m.longitude,
        timestamp:    new Date(m.time),
        likes:        m.numberOfLikes,
        num_comments: m.comments,
        poster_id:    m.posterID,
        handle:       m.handle
      };
    });
  },
  
  
  
  /**
   * Format Yak Comments
   *
   * @param {array} comments
   */
  formatComments: function(comments) {
    return comments.map(function(c) {
      return {
        _id:       c.commentID.replace('R/', ''),
        content:   c.comment,
        timestamp: new Date(c.time),
        likes:     c.numberOfLikes,
        poster_id: c.posterID
      };
    });
  }
  
};