var app = {}; // criar namespaces para o app

//--------------
// Models
//--------------
app.Todo = Backbone.Model.extend({
  defaults: {
    title: '',
    completed: false
  },
  toggle: function(){
    this.save({ completed: !this.get('completed')});
  }
}); // Modelo de uma tarefa

//--------------
// Collections
//--------------
app.TodoList = Backbone.Collection.extend({
  model: app.Todo, //Modelo referente
  localStorage: new Store("backbone-todo"), // Estancia do localstorage
  completed: function() {
    return this.filter(function( todo ) {
      return todo.get('completed');
    });
  },
  remaining: function() {
    return this.without.apply( this, this.completed() );
  }      
}); //Coleção

// instancia da Collection
app.todoList = new app.TodoList();

//--------------
// Views
//--------------

// renderiza a lista de itens de tarefas individuais (li)
app.TodoView = Backbone.View.extend({
  tagName: 'li', //Tag HTML
  template: _.template($('#item-template').html()), //Utilizando função da biblioteca underscore
  render: function(){
    this.$el.html(this.template(this.model.toJSON()));
    this.input = this.$('.edit');
    return this; // habilitar chamadas encadeadas
  },
  initialize: function(){
    this.model.on('change', this.render, this);
    this.model.on('destroy', this.remove, this); // remove: Função do Backbone de conveniência para remover a visualização do DOM.
  },      
  events: { //lista de eventos presentes na aplicação
    'dblclick label' : 'edit',
    'keypress .edit' : 'updateOnEnter',
    'blur .edit' : 'close',
    'click .toggle': 'toggleCompleted',
    'click .destroy': 'destroy'
  },
  edit: function(){
    this.$el.addClass('editing');
    this.input.focus();
  }, // Função para adicionar a classe editing em uma tarefa
  close: function(){
    var value = this.input.val().trim();
    if(value) {
      this.model.save({title: value});
    }
    this.$el.removeClass('editing');
  }, // Salva a edição
  updateOnEnter: function(e){
    if(e.which == 13){
      this.close();
    } //Faz a verificação se o enter foi precionado
  },
  toggleCompleted: function(){
    this.model.toggle();
  },
  destroy: function(){
    this.model.destroy();
  }      
});

// renderiza a lista completa de itens de tarefas chamando TodoView para cada um.
app.AppView = Backbone.View.extend({
  el: '#todoapp', // seleciona o elemento HTML por ID
  initialize: function () {
    this.input = this.$('#new-todo'); // Seleciona o input de nova task
    app.todoList.on('add', this.addAll, this);
    app.todoList.on('reset', this.addAll, this);
    app.todoList.fetch(); // Carega a lista do LocalStorage
  },
  events: { // Eventos da View
    'keypress #new-todo': 'createTodoOnEnter'
  },
  createTodoOnEnter: function(e){
    if ( e.which !== 13 || !this.input.val().trim() ) { // ENTER_KEY = 13 Verifica se foi precionado o Enter para salvar uma nova tarefa
      return;
    }
    app.todoList.create(this.newAttributes());
    this.input.val(''); // limpa o input box
  },
  addOne: function(todo){ // Adiciona um novo item
    var view = new app.TodoView({model: todo});
    $('#todo-list').append(view.render().el);
  },
  addAll: function(){
    this.$('#todo-list').html(''); // limpar a lista de tarefas
    // filtrar lista de itens de tarefas
    switch(window.filter){ //Verifica qual é o filtro da url
      case 'pending': // Mostra somente as tarefas pendentes
        _.each(app.todoList.remaining(), this.addOne);
        break;
      case 'completed': // Mostra somente as tarefas completas
        _.each(app.todoList.completed(), this.addOne);
        break;            
      default: // Por default mostra todas as tarefas
        app.todoList.each(this.addOne, this);
        break;
    }
  },
  newAttributes: function(){
    return {
      title: this.input.val().trim(),
      completed: false
    }
  }
});

//--------------
// Routers
//--------------

app.Router = Backbone.Router.extend({ //Uma rota que recebe os parametros ou completed ou pending
  routes: {
    '*filter' : 'setFilter'
  },
  setFilter: function(params) { //Pega o parametro da Rota e seta como filtro
    console.log('app.router.params = ' + params);
    window.filter = params.trim() || '';
    app.todoList.trigger('reset');
  }
});     

//--------------
// Initializers
//--------------   

app.router = new app.Router();
Backbone.history.start();    
app.appView = new app.AppView();