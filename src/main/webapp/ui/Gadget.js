Ext.onReady(function() {
		    
    lore.ore.ontologyManager = new lore.ore.model.OntologyManager();
    lore.ore.cache = new lore.ore.model.CompoundObjectCache();  
    lore.ore.controller = new lore.ore.Controller({
        currentURL: "http://austlit.edu.au"
    });
    lore.ore.ui.vp = new lore.ore.ui.Viewport();
    
	var searchStore = new Ext.ux.data.PagingJsonStore({
        idProperty : "uri",
        sortInfo: {
          field: "modified",
          direction: "desc"
        },
        storeId: "search",
        'data': [],
        lastOptions : {
            params : {
                start : 0,
                limit : 5
            }
        },
        fields : [{
            "name" : "uri"
        }, {
            "name" : "title"
        }, {
            "name" : "creator"
        }, {
            "name" : "modified",
            "type" : "date"
        }, {
            "name" : "accessed",
            "type" : "date"
        }, {
            "name" : "match"
        }, {
            "name" : "isPrivate"
        }]
    });
	
	lore.ore.controller.getCompoundObjects(null, null, null, searchStore);

	var tpl = new Ext.XTemplate(               
        '<tpl for=".">',
        '<div class="coListing" onclick="lore.ore.controller.loadCompoundObjectFromURL(\'{uri}\')">',
            '<table><tr valign="top"><td>{[this.genNumber(values.uri)]}</td><td>',
            '<div style="float:left;padding:2px;">',
            '<img src="http://localhost:8080/lore/oaioreicon-sm.png"/>',
            '</div>',
            '<div>{title}</div>',
            '<div class="detailText">{creator}',
                '<tpl if="typeof modified != \'undefined\' && modified != null">, last modified {[fm.date(values.modified,\'j M Y, g:ia\')]}</tpl>',
                '<tpl if="typeof accessed != \'undefined\' && accessed != null">Last accessed {[fm.date(values.accessed,\'j M Y, g:ia\')]}</tpl>',
            '</div>',
            '</td></tr></table>',
        '</div>',
        '</tpl>',
        {
            dv: this,
            genNumber: function(uri){
                var idx = searchStore.find('uri',uri);
                return searchStore.lastOptions.params.start + idx + 1;
            }
        }
    );
	
    var action1 = new Ext.Action({
        text: '<b>Search</b>',
        handler: function(){
        	lore.ore.controller.getCompoundObjects(null, null, Ext.getCmp("kwsearchval").getValue(), searchStore);
        }
    });	
    
    var action2 = new Ext.Action({
        text: '<b>Search</b>',
        handler: function(){
        	var searchuri = Ext.getCmp("advsearchform").getForm().findField("searchuri").getValue();
        	var searchpred = Ext.getCmp("advsearchform").getForm().findField("searchpred").getValue();
        	var searchval = Ext.getCmp("advsearchform").getForm().findField("searchval").getValue();
        	lore.ore.controller.getCompoundObjects(searchuri, searchpred, searchval, searchStore);
        }
    });
    
	new Ext.Viewport({
		layout: 'border',
        items: [
	        /*{
	            region: 'center',
        		html: '<p id="centerPanel">north - generally for menus, toolbars and/or advertisements</p>'
	        },*/
	        {
	        	region: 'center',
	        	items: [
					new Ext.TabPanel({
		                id : "loreviews",
					    renderTo: 'tabs3',
					    activeTab: 0,
					    frame:true,
					    defaults:{autoHeight: true},
					    applyTo: 'tabs3',
					    border : false,
					    itemTpl: new Ext.XTemplate(
		                    '<li class="{cls}" id="{id}"><a class="x-tab-strip-close"></a>',
		                    '<tpl if="menuHandler">',
		                        '<a title="{text} Menu" href="#" onclick="{menuHandler}" class="x-tab-strip-menu"></a>',
		                    '</tpl>',
		                    '<a class="x-tab-right" href="#"><em class="x-tab-left">',
		                    '<span class="x-tab-strip-inner"><span class="x-tab-strip-text {iconCls}">{text}</span></span>',
		                    '</em></a>',
		                    '</li>'
		                ),
		                /** 
		                 * Override to allow menuHandler to be passed in as config
		                 */
		                getTemplateArgs: function(item) {
		                    var result = Ext.TabPanel.prototype.getTemplateArgs.call(this, item);
		                    if (item.menuHandler){
		                        result.cls = result.cls + " x-tab-strip-with-menu";
		                    }
		                    return Ext.apply(result, {
		                        closable: item.closable,
		                        menuHandler: item.menuHandler
		                    });
		                },
		                /** Override to allow mouse clicks on menu button */
		                onStripMouseDown: function(e){
		                    var menu = e.getTarget('.x-tab-strip-active a.x-tab-strip-menu', this.strip);
		                    if (menu || e.button !== 0){
		                        // default onclick behaviour will result
		                        return;
		                    }
		                    e.preventDefault();
		                    var t = this.findTargets(e);
		                    if(t.close){
		                        if (t.item.fireEvent('beforeclose', t.item) !== false) {
		                            t.item.fireEvent('close', t.item);
		                            this.remove(t.item);
		                        }
		                        return;
		                    }
		                    if(t.item && t.item != this.activeTab){
		                        this.setActiveTab(t.item);
		                    }
		                },
		                enableTabScroll : true,
		                // Ext plugin to change hideMode to ensure tab contents are not reloaded
		                plugins : new Ext.ux.plugin.VisibilityMode({
		                            hideMode : 'nosize',
		                            bubble : false
		                }),
					    items : [
							{
								title: 'Raw RDF',
								html: '<p id="centerPanel"></p>',
								iconCls: "code-icon"
							},{
	                            title : "Graphical Editor",
	                            tabTip: "View or edit the Resource Map graphically",
	                            id : "drawingarea",
	                            xtype : "grapheditor",
	                            iconCls: "graph-icon"
	                        },{
	                            title : "Resource List",
	                            tabTip: "View or edit the list of resources in the Resource Map",
	                            xtype : "resourcepanel",
	                            id : "remlistview",
	                            iconCls: "list-icon"
	                        },  {
	                            title : "Details",
	                            id: "remdetailsview",
	                            tabTip: "View detailed description of Resource Map contents including properties and relationships",
	                            xtype: "detailspanel",
	                            iconCls: "detail-icon"
	                        },  {
	                            layout : 'fit',
	                            id : "remslideview",
	                            title : "Slideshow",
	                            iconCls: "slide-icon",
	                            tabTip: "View Resource Map contents as a slideshow",
	                            items : [{
                                    id : 'newss',
                                    xtype : "slideshowpanel",
                                    autoScroll : true
                                }]
	                        },	{
	                            title : "Explore",
	                            tabTip: "Discover related resources from the repository",
	                            id : "remexploreview",
	                            xtype : "explorepanel",
	                            iconCls: "explore-icon"
	                        }
			            ]
					})        
	        	]
	        },{
	            region : "south",
	            height : 25,
	            xtype : "statusbar",
	            id : "lorestatus",
	            defaultText : "",
	            autoClear : 6000,
	            items: [
	                '-',
	                {
	                    xtype:'label',
	                    id:'currentCOMsg', 
	                    text: 'New Resource Map'
	                },
	                ' ',
	                {
	                    xtype: 'label',
	                    id:'currentCOSavedMsg',
	                    text:'',
	                    style: 'color:red'
	                },
	                ' ',
	                {
	                    xtype: 'button',
	                    hidden: true,
	                    id: 'lockButton',
	                    icon: '../skin/icons/ore/lock.png',
	                    tooltip: 'Resource Map is locked',
	                    scope: lore.ore.controller
	                }
	            ]
	        },{
		        region: 'west',
		        width: 350,
                split:true,
		        items: [
			        new Ext.TabPanel({
				        renderTo: 'tabs1',
				        activeTab: 0,
				        frame:true,
			            id : "propertytabs",
				        defaults:{autoHeight: true},
				        applyTo: 'tabs1',
			            border : false,
				        items : [
							new Ext.Panel({
								title: 'Search',
					            border : false,
                                items:[
	                                new Ext.TabPanel({
									    renderTo: 'tabs2',
									    activeTab: 0,
									    frame:true,
									    defaults:{autoHeight: true},
									    applyTo: 'tabs2',
									    items : [ 
									        new Ext.Panel({
									         	layout : "hbox",
									             title : "Keyword",
									             tabTip: "Search by keyword across all fields",
									             id : "kwsearchform",
									             padding : 3,
									             layoutConfig : {
									                 pack : 'start',
									                 align : 'stretchmax'
									             },
									             border : false,
									             autoHeight : true,
									             items : [{
									                    xtype : "textfield",
									                    id : "kwsearchval",
									                    flex : 1
									                },
									                new Ext.Button(action1)
									             ]
									        }), 
									        new Ext.FormPanel({
									            url:'save-form.php',
									            frame:true,
									            width: 250,
									            defaults: {width: 245},
									            defaultType: 'textfield',
									            
									            title : "Advanced",
									            tabTip: "Search specific fields",
									            autoHeight : true,
									            autoWidth : true,
									            id : "advsearchform",
									            border : false,
									            bodyStyle : "padding: 0 10px 4px 4px",
									            labelWidth : 75,
									            items: [{
									                    xtype : "label",
									                    id : "find-co-label",
									                    text : "Find Resource Maps",
									                    style : "font-family: arial, tahoma, helvetica, sans-serif; font-size:11px;line-height:2em"
									                },{
									                    fieldLabel: 'containing',
									                    id : "searchuri",
									                    allowBlank:false,
									                    emptyText : "any resource URI"
									                },{
									                	xtype:          'combo',
									                    mode:           'local',
									                    triggerAction:  'all',
									                    forceSelection: true,
									                    editable:       false,
									                    fieldLabel : "having",
									                    id : "searchpred",
									                    displayField : 'curie',
									                    valueField : 'uri',
									                    emptyText : "any property or relationship",
									                    store : new Ext.data.ArrayStore({
									                        storeId: 'advancedSearchPredStore',
									                        fields : ['uri', 'curie'],
									                        data : []
									                    })
									                },{
									                    fieldLabel: 'matching',
									                    id : "searchval",
									                    allowBlank:false,
									                    emptyText : ""
									                }
									            ],
									
									            buttons: [
									                new Ext.Button(action2)
											    ]
									        })
										]
									}),
	    				            {
	    							    minHeight: 0,
	    							    normal: false,
	    							    border : false,
	    							    layout: "anchor",
	    							    "id": "searchResultPanel",
	    							    autoScroll: true, 
	    							    "tbar": {
	    							        "xtype": "pagingToolbar",
	    							        "store": searchStore,
	    							        "id": "spager"		                    
	    							    }
	    								,
	    							    items: [
	    									new Ext.DataView({
	    									    store: searchStore,
	    									    tpl: tpl,
	    	    							    border : false,
	    									    autoHeight:true,
	    									    itemSelector:'div.coListing',
	    									    emptyText: 'No images to display',
	    									    plugins: [],
	    									    prepareData: function(data){
	    									        return data;
	    									    },
	    							            loadingText: "Loading Resource Maps...",
	    							            singleSelect: true,
	    							            style: "overflow-y:auto;overflow-x:hidden",
	    									    listeners: {}
	    									})
	    							    ]
	    							}
	                            ]
                            })
							,
					        new Ext.Panel({
					        	id: 'properties',
				                title: 'Properties',
				                layout:'anchor',
				                height: "500px",
				                items: [
									{
	                                    title : 'Resource Map Properties',
	                                    id : "remgrid",
	                                    propertyType: "property",
	                                    xtype : "propertyeditor"
	                                }
									, 
									{
	                                    title : "Resource Properties",
	                                    id : "nodegrid",
	                                    propertyType: "property",
	                                    xtype : "propertyeditor"
	                                }
	                                , 
	                                {
	                                    title: "Relationships",
	                                    id: "relsgrid",
	                                    propertyType: "relationship",
	                                    xtype: "relationshipeditor"
	                                }
								]
				            })
	                	]
			        })
			    ]
	        }	        
	    ]
    });
	
    lore.ore.ui.grid = Ext.getCmp("remgrid");
    lore.ore.ui.nodegrid = Ext.getCmp("nodegrid");
    lore.ore.ui.relsgrid = Ext.getCmp("relsgrid");
    lore.ore.ui.status = Ext.getCmp("lorestatus");
	
	var searchproplist = [];
    var om = lore.ore.ontologyManager;
    for (var p = 0; p < om.METADATA_PROPS.length; p++) {
        var curie = om.METADATA_PROPS[p];
        var splitprop = curie.split(":");
        searchproplist.push([
            "" + lore.constants.NAMESPACES[splitprop[0]]
            + splitprop[1], curie]);
    }
    Ext.getCmp("searchpred").getStore().loadData(searchproplist);
        
    lore.ore.ui.graphicalEditor = Ext.getCmp("drawingarea");
	
});