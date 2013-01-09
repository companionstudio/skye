(function(global) {
  // localStorage.setItem(...)
  // localStorage.getItem(...)
  //


  function template(name) {
    var text = $('#' + name + '-template').text();
    return Mustache.compile(text);
  }

  function state(name) {
    return function() {
      App.state.is(name)
    };
  }

  function GithubAPI(user) {
    this.baseURL = 'https://api.github.com/';
    this.user = user;
  };

  GithubAPI.prototype = {
    get: function(path, callback, propogateErrors) {
      $.ajax({
        url: 'https://api.github.com/notifications',
        dataType: 'json',
        xhrFields: {withCredentials: true},
        headers: {'Authorization': 'Basic what:what'},
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
    mutators: {
      validatable: function() {
        return !_.isEmpty(this.username) && !_.isEmpty(this.password);
      }
    },

    initialize: function() {
      _.bindAll(this, '_checkCallback');
      this.set('username', localStorage.getItem('username'));
      this.set('password', localStorage.getItem('password'));
      this.set('checking', false);
      this.set('valid', false);
      this.set('error', undefined);
    },

    check: function() {
      if (this.get('validatable')) {
        this.set('error', null);
        this.set('checking', true);
        App.api.get('notifications', this._checkCallback, true);
      }
    },

    _checkCallback: function(res) {
      this.set('checking', false);
      if (res.error && res.error === 'Unauthorized') {
        this.set('error', res.error);
      }
      else {
        this.set('error', null);
        this.set('valid', true);
        localStorage.setItem('username', this.get('username'));
        localStorage.setItem('password', this.get('password'));
      }
    }
  });

  var Views = {};
  
  Views.Login = Backbone.View.extend({
    tagName: 'form',
    className: 'login',
    template: template('login'),
    events: {
      'click button': 'submit',
      'submit': 'submit'
    },

    submit: function(e) {
      this.model.check();
      e.preventDefault();
    },

    render: function() {
      this.$el.append(this.template());
      rivets.bind(this.$el, {user: this.model});
      return this;
    }
  });

  var Router = Backbone.Router.extend({
    states: {
      "": "root",
      "login": "login"
    },

    login: {
      in: function() {
        if (this.login) {
          this.login.$el.show();
        }
        else {
          this.login = new Views.Login({model: App.user});
          $("#content").append(this.login.render().el);
        }
      },

      out: function() {
        if (this.login) {this.login.$el.hide();}
      }
    },

    initialize: function() {
      _.each(this.states, function(state, path) {
        this.route(path, state, function() {this._runCallbacks(state);});
      }, this);
    },

    _runCallbacks: function(state) {
      if (this._state) {
        var outFunc = this[this_.state]['out'];
        if (outFunc) {outFunc();}
      }
      this._state = state;
      var inFunc = this[state]['in'];
      if (inFunc) {inFunc();}
    }
  });

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

  var App = {};

  $(function() {
    App.api = new GithubAPI();
    App.user = new User();
    App.router = new Router();
    Backbone.history.start({pushState: true});
  });

})(window);


