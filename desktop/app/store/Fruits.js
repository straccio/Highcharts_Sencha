Ext.define('Highcharts.store.Fruits', {
  extend : 'Ext.data.Store',
  autoLoad : false,
  model: 'Highcharts.model.Fruits',
  proxy : { 
    type: 'ajax',
    url: './data/fruits.json',
    reader : {
      type: 'json',
      root: 'rows'
    }
  },
  storeId: 'fruits'
});
