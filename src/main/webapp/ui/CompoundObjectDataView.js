Ext.onReady(function() {
			
	Ext.reg('codataview', Ext.extend(Ext.DataView, {
	    initComponent : function(){
	        Ext.apply(this, { 
	            tpl :  new Ext.XTemplate(               
	                '<tpl for=".">',
	                '<div class="coListing" onclick="lore.ore.controller.loadCompoundObjectFromURL(\'{uri}\')">',
	                    '<table><tr valign="top"><td>{[this.genNumber(values.uri)]}</td><td>',
	                    '<div style="float:left;padding:2px;">',
	                    '<tpl if="lore.ore.reposAdapter && uri.match(lore.ore.reposAdapter.idPrefix)"><img src="../../skin/icons/oaioreicon-sm.png"></tpl>',
	                    '<tpl if="lore.ore.reposAdapter && !uri.match(lore.ore.reposAdapter.idPrefix)"><img src="../../skin/icons/oaioreicon-grey.png"></tpl>',
	                    '<tpl if="isPrivate"><img style="float:left;position:absolute;left:11px" src="../lore/skin/icons/eye.png"></tpl>',
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
	                        var idx = this.dv.store.find('uri',uri);
	                        return this.dv.store.lastOptions.params.start + idx + 1;
	                    }
	                }
	            ),
	            loadingText: "Loading Resource Maps...",
	            singleSelect: true,
	            autoScroll: false,
	            style: "overflow-y:auto;overflow-x:hidden",
	            itemSelector : "div.coListing"
	        });
	        this.on('contextmenu',this.onContextMenu,this);
	        
	        // When data is loaded, refresh view to reset numbering
	        this.store.on("load", 
	            function(){
	                this.refresh();
	                // auto raise browse view when results are loaded
	                if (this.id == 'cobview'){
	                    if (!this.parentPanel) {
	                        this.parentPanel = this.findParentByType('panel');
	                    }
	                    if (this.parentPanel){
	                        Ext.getCmp("propertytabs").activate(this.parentPanel.id);
	                    }
	                }
	            },
	            this
	        );
	    },
	    onContextMenu: function (e, node, obj){ 
	        var elem = e.getTarget(this.itemSelector, 10);
	        this.sel = this.getRecord(elem);
	        try{
	            if (!this.contextMenu){
	                var cm = new Ext.menu.Menu({
	                    id : this.id + "-context-menu",
	                    showSeparator: false
	                });
	                this.contextMenu = cm;
	                cm.remoteMsg = new Ext.form.Label({
	                        text : "Resource Map is not from default repository",
	                        cls: 'underlined'
	                 });
	                cm.add(cm.remoteMsg);
	                cm.localLoad = new Ext.menu.Item({
	                    text: "Edit Resource Map",
	                       iconCls: "edit-icon",
	                       scope: this,
	                       handler: function(obj,evt) {
	                            lore.ore.controller.loadCompoundObjectFromURL(this.sel.data.uri);
	                        }
	                    });
	                 cm.remoteLoad = new Ext.menu.Item({
	                    text: "View Resource Map in editor (read-only)",
	                       iconCls: "edit-icon",
	                       scope: this,
	                       handler: function(obj,evt) {
	                            lore.ore.controller.loadCompoundObjectFromURL(this.sel.data.uri);
	                        }
	                    });
	                 
	                 cm.add(cm.localLoad);
	                 cm.add(cm.remoteLoad);
	                 cm.localDelete = new Ext.menu.Item({
	                    text : "Delete Resource Map",
	                    iconCls: "delete-icon",
	                    scope: this,
	                    handler : function(obj,evt) {
	                        lore.ore.controller.deleteCompoundObjectFromRepository(this.sel.data.uri, this.sel.data.title);
	                    }
	                 });
	                 
	                 cm.add(cm.localDelete);
	                 
	                 cm.add({
	                    text : "Add as nested Resource Map",
	                    iconCls: "add-icon",
	                    scope: this,
	                    handler : function(obj, evt) {
	                        lore.ore.ui.graphicalEditor.addFigure({url:this.sel.data.uri,
	                            props:{
	                            "rdf:type_0": lore.constants.RESOURCE_MAP,
	                            "dc:title_0": this.sel.data.title}});
	                 }});
	                 if (this.id == 'cohview'){
	                    cm.add({
	                       text: "Do not show in history",
	                       icon: "../../skin/icons/ore/cross.png",
	                       iconCls: "no-icon",
	                       scope: this,
	                       handler: function(obj,evt) {
	                            if (lore.ore.historyManager){
	                                lore.ore.historyManager.deleteFromHistory(this.sel.data.uri);
	                            }
	                        }
	                    });
	                 }
	                 
	                 
	                 cm.on('beforeshow',function(menu){
	                    if(lore.ore.reposAdapter && this.sel.data.uri.match(lore.ore.reposAdapter.idPrefix)){
	                        menu.localLoad.show();
	                        menu.localDelete.show();
	                        menu.remoteMsg.hide();
	                        menu.remoteLoad.hide();
	                    } else {
	                        menu.remoteLoad.show();
	                        menu.remoteMsg.show();
	                        menu.localDelete.hide();
	                        menu.localLoad.hide();
	                    }
	                 },this);
	                        
	            }
	            this.contextMenu.showAt(e.xy);
	        } catch (ex){
	            lore.debug.ore("Error in onContextMenu",ex);
	        }
	    }
	}));
	    
});