//= require ./underscore-min
//= require ./backbone-min
//= require ./backbone.mutators.min
//= require ./mustache
//= require ./rivets.min

(function(global) {

  // Configure Rivets to work with Backbone.
  rivets.configure({
    adapter: {
      subscribe: function(obj, keypath, callback) {
        obj.on('change:' + keypath, callback);
      },
      unsubscribe: function(obj, keypath, callback) {
        obj.off('change:' + keypath, callback);
      },
      read: function(obj, keypath) {
        return obj.get(keypath);
      },
      publish: function(obj, keypath, value) {
        obj.set(keypath, value);
      }
    }
  });

  function template(name) {
    var text = $('#' + name + '-template').text();
    return Mustache.compile(text);
  }

  function GithubAPI(user) {
    this.baseURL = 'https://api.github.com/';
    this.user = user;
  };

  GithubAPI.prototype = {
    get: function(path, callback, propogateErrors) {
      $.ajax({
        url: this.baseURL + path,
        dataType: 'json',
        success: callback,
        error: function (a, s, error) {
          if (propogateErrors) {callback({error: error});}
        }
      });
    },

    post: function() {},
    put: function() {},
    delete: function() {}
  };

  var Project = Backbone.Model.extend({

  });

  var Projects = Backbone.Collection.extend({
    model: Project
  });

  var Ticket = Backbone.Model.extend({

  });

  var Tickets = Backbone.Collection.extend({
    model: Ticket
  });

  var Comment = Backbone.Model.extend({

  });

  var User = Backbone.Model.extend({
    initialize: function() {
      _.bindAll(this, '_getTokenSuccess', '_getTokenSuccess');
      /* this.set('token', localStorage.getItem('token')); */
      this.set('checking', false);
      this.set('error', undefined);
    },

    getToken: function(code) {
      this.set('error', null);
      this.set('checking', true);
      $.ajax({
        url: App.url('proxy'),
        type: 'POST',
        data: {code: code},
        success: this._getTokenSuccess,
        error: this._getTokenError
      });
    },

    _getTokenSuccess: function(res) {
      this.set('checking', false);
      if (res.error && res.error === 'Unauthorized') {
        this.set('error', res.error);
      }
      else {
        this.set('error', null);
        this.set('token', res.access_token);
        localStorage.setItem('token', res.access_token);
      }
    },

    _getTokenError: function(x, y, err) {
      this.set('error', err);
    }
  });

  var Views = {};
  
  Views.GetToken = Backbone.View.extend({
    tagName: 'div',
    className: 'get-token',
    template: template('get-token'),

    render: function() {
      this.$el.append(this.template());
      rivets.bind(this.$el, {user: this.model});
      return this;
    }
  });

  window.Router = Router = Backbone.Router.extend({
    states: {},

    initialize: function() {
      this.views = {};

      _.each(this.states, function(state, path) {
        this.route(path, state, function() {this._runCallbacks(state);});
      }, this);
    },

    _runCallbacks: function(state) {
      // Redirect if the user isn't logging in, but does not have a token.
      if (state !== 'login' && state !== 'login_auth' && !App.user.has('token')) {
        this.navigate('login', {trigger: true, replace: true});
      }
      else {
        if (this._state) {
          var outFunc = this[this._state]['out'];
          if (outFunc) {outFunc.call(this);}
        }
        this._state = state;
        var inFunc = this[state]['in'];
        if (inFunc) {inFunc.call(this);}
      }
    }
  },

  {
    state: function(name, url, opts) {
      this.prototype.states[url] = name;
      this.prototype[name] = opts;
      return this;
    }
  });

  Router.state('root', '', {

  });

  Router.state('login', 'login', {
    in: function() {
      window.location = App.url('githubAuth');
    }
  });

  Router.state('login_auth', 'login/auth', {
    in: function() {
      this.views.auth = new Views.GetToken({model: App.user});
      $('#content').append(this.views.auth.render().el);

      var code = window.location.search.match(/\?code=(\w+)/)[1];
      App.user.getToken(code);

      App.user.once('change:token', _.debounce(function() {
        App.router.navigate('', {trigger: true, replace: true});
      }, 3000));
    },

    out: function() {
      this.views.auth.remove();
    }
  });

  var URLS = {
    githubAuth: "GITHUB_AUTH_URL",
    proxy: "PROXY_URL"
  };

  var App = {
    url: function(name) {return URLS[name];}
  };

  $(function() {
    App.api = new GithubAPI();
    App.user = new User();
    App.router = new Router();
    Backbone.history.start({pushState: true});
  });

})(window);


