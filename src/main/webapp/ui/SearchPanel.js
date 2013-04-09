Ext.onReady(function() {
		
    getCompoundObjects = function(matchuri, matchpred, matchval, store){ 
    	if (matchuri == null && matchpred == null && matchval == null) {
    		return;
    	}
        var ra = this;
        try {
        	var escapedURL = "";
        	var altURL = "";
        	if (matchuri){
        		escapedURL = encodeURIComponent(matchuri.replace(/}/g,'%257D').replace(/{/g,'%257B'));
        	}
           
        	var predicate = "?p";
	   	   	if (matchpred != null || matchpred) {
	   	   		matchpred = String(matchpred);
	   	   		if (matchpred.length != 0) {
	   	   			predicate = "<" + matchpred + ">";
	   	   		}
	   	   	}
           
	   	   	var queryURL = "http://localhost:3030/ds/query?query=";
	   	   	queryURL += encodeURIComponent("SELECT DISTINCT ?g ?a ?m ?t ?priv ");
	   	   	queryURL += encodeURIComponent("WHERE { GRAPH ?g {");
	   	   	queryURL += encodeURIComponent("?g <http://www.openarchives.org/ore/terms/describes> ?r.");
	   	   	if (matchuri) {
	   	   		queryURL += encodeURIComponent("?r <http://www.openarchives.org/ore/terms/aggregates> <" + matchuri + ">.");
	   	   	}
	   	   	queryURL += encodeURIComponent("?s " + predicate + " ?o .");
	   	   	queryURL += encodeURIComponent("OPTIONAL {?g <http://purl.org/dc/elements/1.1/creator> ?a}.");
	   	   	queryURL += encodeURIComponent("OPTIONAL {?g <http://purl.org/dc/terms/modified> ?m}.");
	   	   	queryURL += encodeURIComponent("OPTIONAL {?g <http://purl.org/dc/elements/1.1/title> ?t}.");
	   	   	queryURL += encodeURIComponent("OPTIONAL {?g <http://auselit.metadata.net/lorestore/isPrivate> ?priv}.");
	   	   	queryURL += encodeURIComponent("OPTIONAL {?g <http://auselit.metadata.net/lorestore/isPrivate> ?user}.");
		   
		   	if (matchval != null) {
			    matchval = String(matchval);
				if (matchval[0] == "\"" && matchval[matchval.length - 1] == "\"") {
					var temp = matchval.substring(1, matchval.length - 1);
					queryURL += encodeURIComponent("FILTER regex(str(?o), \"" + temp + "\", \"i\").");
				} else if (matchval.indexOf(" ") != -1) {
					var terms = matchval.split(" ");
					for (var i = 0; i < terms.length; i++) {
						queryURL += encodeURIComponent("FILTER regex(str(?o), \"" + terms[i] + "\", \"i\"). ");
					}
				} else {
					queryURL += encodeURIComponent("FILTER regex(str(?o), \"" + matchval + "\", \"i\").");
				}
		   	}
		   
		   	queryURL += encodeURIComponent("}}");
		   	queryURL += "&output=xml";   	
            
            var xhr = new XMLHttpRequest();
            xhr.open('GET', queryURL);
            xhr.onreadystatechange = function(aEvt) {
                if (xhr.readyState == 4) {
                    if (xhr.responseText && xhr.status != 204 && xhr.status < 400) {
                        var xmldoc = xhr.responseXML;
                        var result = {};
                        if (xmldoc) {
                            result = xmldoc.getElementsByTagNameNS("http://www.w3.org/2005/sparql-results#", "result");
                        }

                        store.removeAll();
                        
                        if (result.length > 0){
                            var coList = [];
                            var processed = {};
                            for (var i = 0; i < result.length; i++) {
                                var theobj = parseCOFromXML(result[i]);
                                var resultIndex = processed[theobj.uri];
                                var existing = theobj; 
                                if (resultIndex >= 0){
                                    existing = coList[resultIndex];
                                    if (existing && !existing.creator.match(theobj.creator)){
                                        existing.creator = existing.creator + " &amp; " + theobj.creator;
                                    }
                                } else {
                                   if (matchval) {theobj.searchval = matchval;}
                                   coList.push(theobj);
                                   processed[theobj.uri] = coList.length - 1; 
                                }    
                            }
                            
                            store.lastOptions={params:{start: 0,limit:5}};
                            store.loadData(coList,true);  
                        } 
                    } else if (xhr.status == 404){
                        alert("E4");
                    	alert(ex);
                    }
                }
            };
            xhr.send(null);
        } catch (e) {
            alert("E3");
        	alert(e);
        }
    };
    
    safeGetFirstChildValue = function(node) {
      return ((node.length > 0) && (node[0]) && node[0].firstChild) ?
               node[0].firstChild.nodeValue : '';
    };
    
    /**
    * Parses Resource Map details from a SPARQL XML result
    * @param {XMLNode} XML node to be parsed
    * Returns an object with the following properties:
    *  {string} uri The identifier of the Resource Map 
    *  {string} title The (Dublin Core) title of the Resource Map 
    *  {string} creator The (Dublin Core) creator of the Resource Map 
    *  {Date} modified The date on which the Resource Map was modified (from dcterms:modified) 
    *  {string} match The value of the subject, predicate or object from the triple that matched the search 
    *  {Date} acessed The date this Resource Map was last accessed (from the browser history) 
    * */
   parseCOFromXML = function(/*Node*/result){
        var props = {};
        var bindings, node, attr, nodeVal;
        props.title = "Untitled";
        props.creator = "Anonymous";
        try {  
           bindings = result.getElementsByTagName('binding');
           for (var j = 0; j < bindings.length; j++){  
            attr = bindings[j].getAttribute('name');
            if (attr =='g'){ //graph uri
                node = bindings[j].getElementsByTagName('uri'); 
                props.uri = safeGetFirstChildValue(node);
            } else if (attr == 'v'){
                node = bindings[j].getElementsByTagName('literal');
                nodeVal = safeGetFirstChildValue(node);
                if (!nodeVal){
                    node = bindings[j].getElementsByTagName('uri');
                }
                props.match = safeGetFirstChildValue(node);
            } else {
            	
                node = bindings[j].getElementsByTagName('literal');
                nodeVal = safeGetFirstChildValue(node);
                if (attr == 't' && nodeVal){ //title
                    props.title = nodeVal;
                } else if (attr == 'a' && nodeVal){// dc:creator
                    props.creator = nodeVal;
                } else if (attr == 'priv' && nodeVal) { // isPrivate
                    props.isPrivate = nodeVal;
                }
                else if (attr == 'm' && nodeVal){ // dcterms:modified
                    props.modified = nodeVal;
                    try {
                        var modDate = Date.parseDate(props.modified,'c') || Date.parseDate(props.modified,'Y-m-d');
                        if (modDate){
                            props.modified = modDate;
                        }
                    } catch (e){
                        alert("E1");
                    	alert(ex);
                    }
                } 
            }
           }
        } catch (ex) {
            alert("E2");
        	alert(ex);
        }
        return props;
    };
		
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
	
	getCompoundObjects(null, null, null, searchStore);

	var tpl = new Ext.XTemplate(               
        '<tpl for=".">',
        '<div class="coListing" onclick="loadCompoundObjectFromURL(\'{uri}\')">',
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
        	getCompoundObjects(null, null, Ext.getCmp("kwsearchval").getValue(), searchStore);
        }
    });	
    
    var action2 = new Ext.Action({
        text: '<b>Search</b>',
        handler: function(){
        	var searchuri = Ext.getCmp("advsearchform").getForm().findField("searchuri").getValue();
        	var searchpred = Ext.getCmp("advsearchform").getForm().findField("searchpred").getValue();
        	var searchval = Ext.getCmp("advsearchform").getForm().findField("searchval").getValue();
        	getCompoundObjects(searchuri, searchpred, searchval, searchStore);
        }
    });
    
    formatXML = function(xml) {
        var formatted = '';
        var reg = /(>)(<)(\/*)/g;
        xml = xml.replace(reg, '$1\r\n$2$3');
        var pad = 0;
        jQuery.each(xml.split('\r\n'), function(index, node) {
            var indent = 0;
            if (node.match( /.+<\/\w[^>]*>$/ )) {
                indent = 0;
            } else if (node.match( /^<\/\w/ )) {
                if (pad != 0) {
                    pad -= 1;
                }
            } else if (node.match( /^<\w[^>]*[^\/]>.*$/ )) {
                indent = 1;
            } else {
                indent = 0;
            }

            var padding = '';
            for (var i = 0; i < pad; i++) {
                padding += '  ';
            }

            formatted += padding + node + '\r\n';
            pad += indent;
        });

        return formatted;
    }
    
    loadCompoundObject = function(rdf) {
    	Ext.get('centerPanel').update('<pre>' + formatXML(rdf)
    			.replace(/&/g, "&amp;")
    			.replace(/>/g, "&gt;")
    			.replace(/</g, "&lt;")
    			.replace(/"/g, "&quot;") + '</pre>');
    	
        lore.ore.ui.graphicalEditor.initGraph();
        
        var rdfDoc;
        if (typeof rdf != 'object') {
            rdfDoc = new DOMParser().parseFromString(rdf, "text/xml");
        } else {
            showInHistory = true;
            rdfDoc = rdf.responseXML;
        }
        // lore.debug.timeElapsed("creating databank");
        var databank = jQuery.rdf.databank();
        for (ns in lore.constants.NAMESPACES) {
            databank.prefix(ns, lore.constants.NAMESPACES[ns]);
        }
        databank.load(rdfDoc);
        var loadedRDF = jQuery.rdf({
                    databank : databank
        });
        // Display the properties for the Resource Map
        var remQuery = loadedRDF.where('?aggre rdf:type ore:Aggregation')
                .where('?rem ore:describes ?aggre');
        var aggreurl, remurl;
        var res = remQuery.get(0);
        var isPrivate = false;
        
        if (res) {
            remurl = res.rem.value.toString();
            aggreurl = res.aggre.value.toString();
            this.loadedCO = new lore.ore.model.CompoundObject();
            this.loadedCO.load({
                        format : 'application/rdf+xml',
                        content : rdfDoc
            });
            /*if (this.loadedCO.properties.getProperty(lore.constants.NAMESPACES["lorestore"] + "isLocked")){
                lore.ore.controller.setLockCompoundObject(true);
            } else {
                lore.ore.controller.setLockCompoundObject(false);
            }*/
            isPrivate = this.loadedCO.properties.getProperty(lore.constants.NAMESPACES["lorestore"] + "isPrivate");
            lore.ore.cache.add(remurl, this.loadedCO);
            lore.ore.cache.setLoadedCompoundObjectUri(remurl);
            lore.ore.cache.setLoadedCompoundObjectIsNew(false);
            lore.ore.cache.setLoadedCompoundObjectUri(remurl);
            lore.ore.controller.bindViews(lore.ore.cache.getLoadedCompoundObject());
            
        } else {
            lore.ore.ui.vp.warning("No Resource Map found");
            lore.debug.ore("Error: no remurl found in RDF", loadedRDF);
            return;
        }

        // lore.debug.timeElapsed("create figure for each resource ");
        // create a node figure for each aggregated resource, restoring the layout
        var counter = 0;
        var numResources = 
        loadedRDF.where('<' + aggreurl + '> ore:aggregates ?url')
                .optional('?url layout:x ?x')
                .optional('?url layout:y ?y')
                .optional('?url layout:width ?w')
                .optional('?url layout:height ?h')
                .optional('?url layout:originalHeight ?oh')
                .optional('?url layout:highlightColor ?hc')
                .optional('?url layout:orderIndex ?order')
                .optional('?url layout:abstractPreview ?abstractPreview')
                .optional('?url layout:isPlaceholder ?placeholder')
                .optional('?url dc:format ?format')
                .optional('?url rdf:type ?rdftype')
                .optional('?url dc:title ?title')
                .each(function() {
                    var resourceURL = this.url.value.toString();
                    var fig;
                    var opts = {
                        batch : true,
                        url : resourceURL
                    };
                    if (this.x && this.y) {
                        for (prop in this) {
                            if (prop != 'url' && prop != 'format'
                                    && prop != 'rdftype' && prop != 'title'
                                    && prop != 'hc') {
                                opts[prop] = parseInt(this[prop].value);
                            } else {
                                opts[prop] = this[prop].value.toString();
                            }
                        }
                        if (opts.x < 0) {
                            opts.x = 0;
                        }
                        if (opts.y < 0) {
                            opts.y = 0;
                        }
                    }
                    if (counter < lore.ore.controller.MAXSIZE){
                     fig = lore.ore.ui.graphicalEditor.addFigure(opts);
                    }
                    counter++;
                });
        var ccounter = 0;
        // iterate over all predicates to create node connection figures
        loadedRDF.where('?subj ?pred ?obj')
        .filter(function() {
            // filter out the layout properties and predicates about the
            // resource map as well as literals
            if (this.pred.value.toString()
                    .match(lore.constants.NAMESPACES["layout"])
                    || this.pred.value.toString() === (lore.constants.NAMESPACES["dc"] + "format")
                    || this.subj.value.toString().match(remurl)) {
                return false;
            } else {
                return true;
            }
        }).each(function() {
            
            var connopts = {
                subject: this.subj.value.toString(),
                obj : this.obj.value.toString(),
                pred: this.pred.value.toString()
            };
            
            if (ccounter <= lore.ore.controller.MAXCONNECTIONS){
                var fig = lore.ore.ui.graphicalEditor.addConnection(connopts);
                if (fig) {
                    ccounter ++;
                }
            }
            
            
        });
        
        // Temporary workaround to set drawing area size on load
        // problem still exists if a node is added that extends the boundaries
        lore.ore.ui.graphicalEditor.coGraph.resizeMask();

        if (counter > lore.ore.controller.MAXSIZE){
            lore.ore.ui.vp.error("Resource Map is too big for LORE graphical editor! " + (counter - lore.ore.controller.MAXSIZE) + " resources not shown");
        }
        if (ccounter >= lore.ore.controller.MAXCONNECTIONS){
            lore.ore.ui.vp.error("Resource Map has too many connections for graphical editor! Some connections not displayed");
        }
        Ext.Msg.hide();
        
        // preload nested Resource Maps to cache
        lore.ore.cache.cacheNested(loadedRDF, 0);
        
        var title = lore.ore.ui.grid.getPropertyValue("dc:title")
		        || lore.ore.ui.grid.getPropertyValue("dcterms:title");
		if (!title) {
		    title = "Untitled";
		}
        
        /*// lore.ore.populateResourceDetailsCombo();
        // lore.debug.timeElapsed("show in history");
        if (showInHistory) {
            lore.ore.historyManager.addToHistory(remurl, title, (isPrivate && isPrivate.value == true ? true: false));
        }*/
        if (lore.ore.ui.topView
                && lore.ore.ui.graphicalEditor.lookup[lore.ore.controller.currentURL]) {
            lore.ore.ui.topView.hideAddIcon(true);
        } else if (lore.ore.ui.topView) {
            lore.ore.ui.topView.hideAddIcon(false);
        }
        // lore.debug.timeElapsed("done");
        var readOnly = true;
        Ext.getCmp('currentCOMsg').setText(
                Ext.util.Format.ellipsis(title, 50)
                        + (readOnly ? ' (read-only)' : ''), false);
        Ext.getCmp("currentCOSavedMsg").setText("");
        lore.ore.controller.isDirty = false;
        lore.ore.controller.wasClean = true;
    }
    
    loadCompoundObjectFromURL = function(rdfURL){    	
        var xhr = new XMLHttpRequest();
        xhr.open('GET', "http://localhost:3030/ds/data?graph=" + rdfURL);
        xhr.onreadystatechange = function(aEvt) {
            if (xhr.readyState == 4) {
                if (xhr.responseText && xhr.status != 204 && xhr.status < 400) {
                	loadCompoundObject(xhr.responseText);
                }
            }
        };
        xhr.send(null);
    };
    
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
							}
							,
							{
	                            title : "Graphical Editor",
	                            tabTip: "View or edit the Resource Map graphically",
	                            id : "drawingarea",
	                            xtype : "grapheditor",
	                            iconCls: "graph-icon"
	                        },
	                        {
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
	    							//							,
	    							//			                {
	    							//			                    "xtype": "codataview",
	    							//			                    "store": searchStore,
	    							//			                    "id": "cosview"
	    							//			                }
	    							    ]
	    							}
	                            ]
                            })
							,
					        new Ext.Panel({
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
//	        ,
//        	new Ext.grid.GridPanel({
//                store: myStore,
//                region: 'east',
//                bbar: new Ext.PagingToolbar({
//                    store: myStore, 
//                    displayInfo: true,
//                    pageSize: 5,
//                    prependButtons: true,
//                    items: [
//                        'text 1'
//                    ]
//                })
//            })
	    ]
    });
        
    var NAMESPACES = {
        "dc"      : "http://purl.org/dc/elements/1.1/",
        "dc10"    : "http://purl.org/dc/elements/1.1/",
        "dcterms" : "http://purl.org/dc/terms/",
        "ore"     : "http://www.openarchives.org/ore/terms/",
        "foaf"    : "http://xmlns.com/foaf/0.1/",
        "layout"  : "http://maenad.itee.uq.edu.au/lore/layout.owl#",
        "rdf"     : "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
        "xhtml"   : "http://www.w3.org/1999/xhtml",
        "annotea" : "http://www.w3.org/2000/10/annotation-ns#",
        "annotype": "http://www.w3.org/2000/10/annotationType#",
        "thread"  : "http://www.w3.org/2001/03/thread#",
        "annoreply"  : "http://www.w3.org/2001/12/replyType#",
        "vanno"   : "http://austlit.edu.au/ontologies/2009/03/lit-annotation-ns#",
        "sparql"  : "http://www.w3.org/2005/sparql-results#",
        "http"    : "http://www.w3.org/1999/xx/http#",
        "xsd"     : "http://www.w3.org/2001/XMLSchema#",
        "oac"     : "http://www.openannotation.org/ns/",
        "owl"     : "http://www.w3.org/2002/07/owl#",
        "rdfs"    : "http://www.w3.org/2000/01/rdf-schema#",
        "austlit" : "http://austlit.edu.au/owl/austlit.owl#",
        "danno"   : "http://metadata.net/2009/09/danno#",
        "lorestore" : "http://auselit.metadata.net/lorestore/",
        "cnt"     : "http://www.w3.org/2011/content#"
    };
    
    var METADATA_PROPS = ["dcterms:abstract", "dcterms:audience", "dc:creator",
           "dc:contributor", "dc:coverage", "dcterms:created", "dc:description",
           "dc:identifier", "dc:language", "dcterms:modified",
           "dc:publisher", "dc:relation", "dc:rights", "dc:source",
           "dc:subject", "dc:title", "dc:type"];
    
    // populate search combo with dublin core fields
    try {
        var searchproplist = [];
        for (var p = 0; p < METADATA_PROPS.length; p++) {
            var curie = METADATA_PROPS[p];
            var splitprop = curie.split(":");
            searchproplist.push([
                "" + NAMESPACES[splitprop[0]]
                + splitprop[1], curie]);
        }
        Ext.getCmp("searchpred").getStore().loadData(searchproplist);
    } catch (e) {
        alert(e);
    };
    
    //alert('123');
    //lore.ore.ui.vp = Ext.getCmp("viewport");
    //lore.ore.ui.vp.show();
    //alert('789');
    
    lore.ore.cache = new lore.ore.model.CompoundObjectCache();  
    lore.ore.controller = new lore.ore.Controller({
        currentURL: "http://austlit.edu.au"
    });
    
    lore.ore.ui.graphicalEditor = Ext.getCmp("drawingarea");
    
    lore.ore.ui.grid = Ext.getCmp("remgrid");
    lore.ore.ui.nodegrid = Ext.getCmp("nodegrid");
    lore.ore.ui.relsgrid = Ext.getCmp("relsgrid");
    lore.ore.ui.status = Ext.getCmp("lorestatus");
});