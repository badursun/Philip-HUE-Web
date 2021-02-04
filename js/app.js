"use strict";

var app = {
    settings: {
        animation: 190, // css value is 200, much better to use 190?
        animationPanel: 500,
        navigation: {
            detectAuto: true, 
            closeOther: true,
            fixNavAlwaysDropUp: false
        },        
        headerHeight: 60,
        containerHeight: 60,
        boxedPaddings: 100,
        indentPaddings: 60,
        logo: '<div class="logo-text"><strong class="text-primary">#</strong> THE <strong>RIGHT WAY</strong></div>',
        backToTop: true,
        backToTopHeight: 200,
        responsiveState: false,
        breakpoints: {xs: 0, sm: 576, md: 768, lg: 1024, xl: 1200}
    },
    
    layout: {
        responsive: function(){
                
            var pageContent     = $("#page-content");
            var pageAside       = $("#page-aside");
            var pageSidepanel   = $("#page-sidepanel");
            
            if(!app.settings.responsiveState){
            
                if(window.innerWidth <= app.settings.breakpoints.md){
                    // aside responsive control
                    if(pageAside){
                        pageContent.addClass("page-aside--hidden");
                        pageAside.addClass("page-aside--hidden");
                    }

                    // sidepanel
                    if(pageSidepanel){
                        pageContent.addClass("page-sidepanel--hidden");
                        pageSidepanel.addClass("page-sidepanel--hidden");                    
                    }
                }

                if(window.innerWidth <= app.settings.breakpoints.xl){
                    // sidepanel
                    if(pageSidepanel){
                        pageContent.addClass("page-sidepanel--hidden");
                        pageSidepanel.addClass("page-sidepanel--hidden");                    
                    }
                }
                
            }else{
                app.settings.responsiveState = false;              
            }                        
            
        },
        controls: function(){
            
            var pageAside               = $("#page-aside");
            var pageSidepanel           = $("#page-sidepanel");

            var pageAsideMinimizeButton = $("[data-action='aside-minimize']");
            var pageAsideHideButton     = $("[data-action='aside-hide']");
            var pageSidepanelHideButton = $("[data-action='sidepanel-hide']");
            var pageHorizontalNavMobile = $("[data-action='horizontal-show']");
            
            // minimize aside event
            if(pageAsideMinimizeButton.length > 0)
                app._controlPanelEvent(pageAsideMinimizeButton,pageAside,"page-aside-animation-show","page-aside--minimized", false, app.settings.breakpoints.md, "group1", $("#content"));
            // end minimize aside event

            // hide aside event
            if(pageAsideHideButton.length > 0)
                app._controlPanelEvent(pageAsideHideButton,pageAside,"page-aside-animation-show","page-aside--hidden", $("#content"), app.settings.breakpoints.md, "group1");        
            // end hide aside event

            // hide sidepanel event
            if(pageSidepanelHideButton.length > 0)
                app._controlPanelEvent(pageSidepanelHideButton,pageSidepanel,"page-sidepanel-animation-show","page-sidepanel--hidden", $("#content"), app.settings.breakpoints.xl, "group2");
            // end hide sidepanel event
            
            // show horizontal navigation on mobiles
            if(pageHorizontalNavMobile){
                pageHorizontalNavMobile.click(function(e){
                    var nav = $(this).parent();
                    nav.toggleClass("horizontal-navigation--show");
                });
            }
            // end
            
        },
        aside_fixed: function(){
            
            // helper for aside fixed layout. adds/romoves class with paddings.
            var pageContent = $("#page-content");

            if(pageContent.hasClass("page__content--w-aside-fixed")){
                                
                $(window).on("scroll", app._debouncer( function(){
                    
                    var totalHeight = 0; 
                    
                    if($(".page__header").length > 0){
                        totalHeight += app.settings.headerHeight;
                    }
                    if($(".page__container").length > 0){
                        totalHeight += app.settings.containerHeight;
                    }
                    
                    if(window.pageYOffset > totalHeight){
                        pageContent.addClass("page-aside-scrolled");
                    }else{
                        pageContent.removeClass("page-aside-scrolled");
                    }
                    
                    if($(".page-aside > .scroll").length > 0){
                        setTimeout(function(){
                            $(".page-aside > .scroll").mCustomScrollbar("update");
                        },50);
                    }                                        
                    
                }, 100));
                
            }
            
        },
        fixed_panel: function(){
           
            //fixed panel
            var fixed_panel             = $("#fixed_panel");
            var fixedPanelToggleButtons = $("[data-action='fixedpanel-toggle']");
            
            if(fixed_panel.length > 0){                
                fixedPanelToggleButtons.each(function(index, btn){                    
                    $(btn).on("click", function(){
                        
                        if(!fixed_panel.hasClass("show")){
                            app._backdrop.show(true);
                            fixed_panel.addClass("show");
                        }else{
                            app._backdrop.hide();
                            fixed_panel.removeClass("show");
                        }
                        
                    });
                });
            }
            
        }
    },
    header_search: function(){
        // header search feature
        var form      = $("#header_search");
        
        if(form.length === 0) return false;
        
        var input     = form.find("input");
        var button    = form.find("div");

        // add focus state on search form(not only input)
        input.on("focus", function(){
            form.addClass("page-header-search--focus");
        });
        
        // cleanup search field
        button.on("mouseup", function(){
            input.value = "";
            input.focus();
        });
        
        // removes focus state on search form
        input.on("blur", function(){            
            form.removeClass("page-header-search--focus");
        });
        
    },
    navigation_detect_auto: function(){
        
        // this feature will find link with same path 
        // and set it(and parents) to active
        if(app.settings.navigation.detectAuto){
            
            var path        = window.location.pathname,
                pathArray   = path.split("/"),
                page        = pathArray[pathArray.length - 1];
                
                page = page !== "" ? page : "index.html";
                
            $(".navigation a[href='"+page+"']").parent("li").addClass("active").parents(".openable").addClass("open active");            
        }

    },
    navigation_quick_build: function(container, prefix){
        
        // this function used to buid quick navigation depends on same id prefixes
        var ids         = $("[id^='"+prefix+"']");
        var container   = $("#"+container);
        
        if(ids.length > 0){
            
            app._loading.show(container.parent(),{spinner: true});
            
            ids.each(function(index, id){
                container.append($("<li><a href=\"#"+id.getAttribute("id")+"\">"+id.innerHTML+"</a></li>"));
            });
            
            setTimeout(function(){
                app._loading.hide(container.parent());
            },1000);
            
        }                
        
    },
    navigation: function(){
        
        // loop all navigations
        $(".navigation").each(function() {                        
                                                
            // current navigation
            var nav = $(this);
                        
            nav.find("a").each(function(){
                
                // add event to each link
                $(this).click(function(e) {                                        

                    // navigations in quick mode                    
                    if($(this).attr("href").charAt(0) === "#" && nav.hasClass("navigation--quick")){

                        e.preventDefault();
                        
                        if($(this).attr("href").length <= 1){
                            return false;
                        }
                        
                        var target = $($(this).attr("href"));
                        var card   = target.parents(".card");
                                                                        
                        if(card.length > 0){
                            
                            card.removeClass("keepAttentionTo");
                            void card.offsetWidth;                                                                                   
                           
                            // jquery scroll to element for html template
                            $('html, body').animate({
                                scrollTop: card.offset().top - 20
                            }, app.settings.animation, function(){
                                card.addClass("keepAttentionTo");
                            });

                        }else{
                            
                            window.scroll({
                                top: target.offset().top - 20, 
                                left: 0, 
                                behavior: 'smooth'
                            });
                        }                                                
                                                
                        return false;
                    }
                    // end navigations quick mode
                    
                    // if link has sublevel navigation
                    if($(this).next().is("UL")){                        
                        e.preventDefault();
                        
                        var li = $(this).parent();
                        
                        // close if clicked on already opened
                        if(li.hasClass("open")){
                            li.removeClass("open");
                            return false;
                        }
                        
                        // close other if needed
                        if(app.settings.navigation.closeOther){
                            var parentsLi = $(this).parents("li");                            
                            $(this).parents("ul").find("> li").not(parentsLi).removeClass("open");                                                                                   
                        }                                                
                        
                        li.addClass("open");
                        
                        app.settings.responsiveState = true;
                        app._crt();            
                        
                        li.trigger("mouseenter");                        
                        
                        return false;
                    }
                    
                });

            });                        
            
            // fix navigation in case if view port is smaller then popup
            app._navigationFix(nav);
            
        });
        
    },    
    file_tree: function(){
        // get all file tree navigations
        var trees = $(".file-tree");
       
       // loop all of them
        trees.each(function(){
            
            var f_links = $(this).find("li.folder > a");
            
            // loop all links
            f_links.each(function(){
                
                // add event listener to each link
                $(this).click(function(e){
                    e.preventDefault();
                    
                    var folder = $(this).parent();
                    var icon   = $(this).find(".icon");
                    
                    if(folder.hasClass("open")){
                        folder.removeClass("open");
                        
                        if(icon.length > 0){
                            icon.removeClass("fa-folder-open-o");
                            icon.addClass("fa-folder-o");
                        }
                    }else{
                        folder.addClass("open");
                        if(icon){                            
                            icon.removeClass("fa-folder-o");
                            icon.addClass("fa-folder-open-o");
                        }
                    }
                    
                    app._crt();
                    
                    return false;
                });
                
            });            
        });        
        
    },
    card: {
        remove: function(elm, fn){
            
            elm.addClass("fadeOut","animated");
            
            setTimeout(function(){
                elm.remove();
            },app.settings.animation);
            
            if(typeof fn === "function") fn();
            
            app._crt();
            
            return false;
        }
    },
    _navigationFix: function(nav){
        // !Important fix
        // minimized vertical navigation fix in case if sublevel 
        // bigger then content height

        // get all lis in current navigation
        var lis   = nav.find("li"); 

        // loop them all
        lis.each(function(){
            
            var li = $(this);
            
            // add event listener
            li.mouseenter(function(e){
                
                e.preventDefault();

                var parentContainer = nav.parent();

                // use if navigation minimzed only
                if(parentContainer.hasClass("page-aside--minimized") || parentContainer.hasClass("navigation--minimized")){

                    var visibleHeight   = $("#page-aside").offsetHeight;
                    var submenu         = li.find("UL")[0];

                    if(submenu){
                        submenu.removeClass("height-control");
                        submenu.height("auto");

                        var freeSpaceBottom = visibleHeight - li.offsetTop,
                            freeSpaceTop    = li.offsetTop,
                            freeSpace       = 0, 
                            drop            = 0;
                        
                        if(freeSpaceBottom > freeSpaceTop){
                            freeSpace = freeSpaceBottom;
                        }else{
                            freeSpace = freeSpaceTop;
                            drop      = 1;
                        }
                        
                        if(drop === 1){
                            if(app.settings.navigation.fixNavAlwaysDropUp){
                                submenu.addClass("dropup");
                            }else{
                                if(freeSpaceBottom < submenu.offsetHeight){
                                    submenu.addClass("dropup");
                                }
                            }
                        }
                        
                        // add scroll in case if submenu bigger then free space
                        if(freeSpace - submenu.offsetHeight < 0){
                            submenu.addClass("height-control");
                            submenu.height(freeSpace + "px");
                        }
                        
                    }

                }

            });
            
            // remove height from sublevel on mouseleave
            li.mouseleave(function(e){

                e.preventDefault();

                var submenu = $(this).find("UL");                                
                
                if(submenu){
                    submenu.removeClass("height-control dropup");                    
                    submenu.css({top: "auto", height: "auto"});
                }

            });

        });
        // end fix
    },
    _controlPanelEvent: function(buttons, panel, animation, classname, hideContentMobile, breakRule, group, ignore){
        // get page content wrapper
        var pageContent = $("#page-content");

        buttons.each(function(){

            // add new event event listener to button
            $(this).click(function(e){
                e.preventDefault;                               
                
                // remove animation if exists
                panel.removeClass(animation);
                
                // toggle class active(state) to button
                $(this).toggleClass("active");

                // animation lifehack 
                void panel.offsetWidth;

                if(panel.hasClass(classname)){
                    
                    panel.removeClass(classname);
                    panel.addClass(animation);        
                    pageContent.removeClass(classname);
                                        
                    if(hideContentMobile !== false){                        
                        
                        if(panel.hasClass("page-aside--minimized")){
                            return false;
                        }
                        
                        if(window.innerWidth <= breakRule){
                            hideContentMobile.addClass("hideContainerContent");
                            
                            app._loading.show(hideContentMobile,{id: group, spinner: true, solid: true});
                        }
                    }
                    
                }else{
                    
                    panel.addClass(classname,animation);
                    pageContent.addClass(classname);                                        

                    if(hideContentMobile !== false){
                        
                        setTimeout(function(){
                            if(hideContentMobile.children(".loading").length <= 1)
                                hideContentMobile.removeClass("hideContainerContent");                            
                            
                            app._loading.hide(hideContentMobile, app.settings.animation, group);
                        },app.settings.animation);                    
                        
                    }else{
                        
                        setTimeout(function(){
                            if(ignore.children(".loading").length <= 1)
                                ignore.removeClass("hideContainerContent");                            
                            
                            app._loading.hide(ignore, app.settings.animation, group);
                        },app.settings.animation);                                            
                        
                    }
                    
                }

                app.settings.responsiveState = true;
                app._crt();                

            });
        
        });
        
    },
    _fireResize: function(){
        
        // fire default window resize event // should be tested
        if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) {
            var evt = document.createEvent('UIEvents');
            evt.initUIEvent('resize', true, false, window, 0);
            window.dispatchEvent(evt);
        } else {
            window.dispatchEvent(new Event('resize'));
        }       
        
    },
    _crt: function(timeout){
        // get timeout
        var timeout = (typeof timeout === "undefined") ? app.settings.animationPanel : 0;                
        
        console.log("crt");
        
        // content resize trigger. use this function to avoid content size problems               
        setTimeout(function(){
            app._fireResize();
        },timeout);
        
    },
    _backdrop: {
        show: function(mtransparent){                        
            
            var backdrop = $("<div>");
                backdrop.addClass("backdrop");
                
                if(typeof mtransparent !== "undefined"){
                    backdrop.addClass("backdrop--mtransparent");    
                }
            
            $("body").append(backdrop);
            
        },
        hide: function(){
            var backdrop = $("body").find(".backdrop");
                backdrop.addClass("fadeOut");
            
            setTimeout(function(){
                backdrop.remove();
            },app.settings.animation);
        }
    },
    _loading: {
        // loading layer feature
        // container: where to add loading layer
        // options: spinner, dark, spinner
        
        show: function(container, options){
            
            // default options
            var classes = ["loading"],
                id      = false,
                text    = false,
                spinner = false,
                solid   = false;
            
            // get new options from options var
            if(typeof options === 'object'){
                if(typeof options.spinner !== 'undefined' && options.spinner === true){
                    classes.push("loading--w-spinner");
                    spinner = true;
                }
                
                if(typeof options.dark !== 'undefined' && options.dark === true)
                    classes.push("loading--dark");
                
                if(typeof options.text !== 'undefined' && options.text.length > 0){
                    classes.push("loading--text");
                    text = options.text;
                }
                
                if(typeof options.solid !== 'undefined' && options.solid === true){                    
                    classes.push("loading--solid");
                }
                
                if(typeof options.id !== 'undefined'){
                    id = options.id;
                }
            }
            
            // build loading layer
            if(container){

                // add loading class to container
                container.addClass("loading-process");
                
                // create html elements
                var layer            = $("<div>"),
                    optionsContainer = $("<div>"),
                    spinnerBox       = $("<div>");
                
                // add text to optionsContainer if exists
                if(text){
                    optionsContainer.html(text);                    
                }
                
                // add id if exists
                if(id){
                    layer.attr("id", "loading_layer_"+id);
                }
                
                // add spinner top optionsContainer if needed
                if(spinner){
                    spinnerBox.addClass("loading-spinner");                    
                    optionsContainer.append(spinnerBox);
                }
                
                // append optionsContainer if needed
                if(spinner || text){
                    layer.append(optionsContainer);
                }
                
                // set classes for loading layer
                for(var i = 0; i < classes.length; i++) {
                    layer.addClass(classes[i]);
                }
                
                // add class loaded if preloading exists
                if(container.hasClass("preloading")){
                   container.addClass("loaded");
                   
                   setTimeout(function(){
                       container.removeClass("preloading","loaded");
                   },app.settings.animation);
                }
                
                // add loading layer to container
                container.append(layer);
            }
            
        },
        hide: function(container, timeout, id){            
            
            // remove loading layer if exists
            if(container){                                
                
                if(typeof timeout === "undefined"){
                    timeout = 0;
                }
                
                setTimeout(function(){
                    var loadings = container.find(".loading");
                    
                    if(loadings.length > 0){
                        
                        loadings.each(function(){
                            
                            var loading = $(this);
                                                        
                            if(typeof loading.attr("id") !== 'undefined'){
                                if(loading.attr("id") !== "loading_layer_"+id){;
                                    return;
                                }                                
                            }
                                                        
                            loading.addClass("fadeOut");
                            
                            setTimeout(function(){
                                loading.remove();

                                if((loadings.length - 1) === 0){
                                    container.removeClass("loading-process");
                                }
                            },app.settings.animation);
                            
                        });                                                                                                                                                
                    
                    }
                    
                },timeout);                                
                                
            }
            
        }
    },
    _page_loading: {
        show: function(options){
            
            // page loading feature            
            var body    = document.body,
                layer   = document.createElement("div");
                layer.classList.add("page-loader");
                
            if(typeof options === "object"){
                
                if(typeof options.logo !== "undefined"){
                    
                    var logo = document.createElement("div");
                        logo.classList.add("logo-holder","logo-holder--xl");
    
                    if(typeof options.logo === "boolean"){
                        logo.innerHTML = app.settings.logo;
                    }else{
                        logo.innerHTML = options.logo;
                    }
                    
                    if(typeof options.logoAnimate !== "undefined"){
                        if(typeof options.logoAnimate === "boolean"){
                            logo.classList.add("zoomIn","animated");
                        }else{
                            logo.classList.add(options.logoAnimate,"animated");
                        }
                    }
                    
                    layer.appendChild(logo);
                }
                
                if(typeof options.spinner !== "undefined"){
                    var spinner = document.createElement("div");
                        spinner.classList.add("page-loader__spinner");
                        
                    layer.appendChild(spinner);    
                }
                
                if(typeof options.animation !== "undefined"){
                    if(typeof options.animation === "boolean"){
                        layer.classList.add("page-loader--animation");
                    }else{
                        layer.classList.add(options.animation);
                    }
                }
            }
                
            body.classList.add("page-loading");
            body.appendChild(layer);
            
        },
        hide: function(){
            
            var body = document.body;                                
                body.querySelector(".page-loader").classList.add("fadeOut");
                
                setTimeout(function(){
                    body.classList.remove("page-loading");
                    
                    $(body).find(".page-loader").remove();
                    
                },app.settings.animation);                 
                
        }
    },
    _backToTop: function(){
        
        if(!app.settings.backToTop) return false;
        
        var button = document.createElement("div");
            button.classList.add("back_to_top");
        
        button.addEventListener("click",function(){
            window.scroll({top: 0, left: 0, behavior: 'smooth'});
        });
            
        document.body.appendChild(button);
        
        window.addEventListener("scroll", function(){
            if(window.pageYOffset > app.settings.backToTopHeight){
                button.classList.add("show");
            }else{
                button.classList.remove("show");
            }
        });
        
    },
    _rwProgress: function(){

        $(".rw-progress").each(function(index, item){
            
            var value = item.dataset.value;
            
            if(value){
                
                var valToBars = Math.round(value / 10);
                
                for(var i=0; i <= 9; i++){
                    var bar = document.createElement("div");
                    
                    if(i < valToBars){
                        bar.classList.add("active");
                    }
                    
                    item.appendChild(bar);                                                            
                }                                
                
                if(item.classList.contains("rw-progress--animation")){
                    
                    var divs = item.querySelectorAll("div");
                    
                    $(divs).each(function(index, bar){
                        setTimeout(function(){                
                            bar.classList.add("animate");    
                        }, index * app.settings.animation);
                    });
                }
                
            }                                                
            
        });
        
    },
    _rwAccordion: function() {
        
        $(".rw-accordion").each(function(){
            
            $(this).find(".rw-accordion__item").each(function(){
                
                var item   = $(this);
                var header = item.find(".rw-accordion__header");
                
                header.on("click",function(){
                    item.toggleClass("open");                    
                });
                
            });
            
        });
        
    },
    _rwCompactGallery: {
                
        init: function(){
            
            this.controlHeight();

            $(".rw-compact-gallery").on("click","> li:first",function(){
                
                var gallery = $(this).parents(".rw-compact-gallery");
                
                $(this).appendTo(gallery);
                
            });                
            
        },
        controlHeight: function(){                
            
            $(".rw-compact-gallery").each(function(){                    
                
                var felm = $(this).find("> li:first");                    
                
                $(this).height(Math.round(app._getTotalHeight(felm.children())));     
                
            });                
        } 
        
    },
    _getTotalHeight: function(elm){
        var totalHeight = 0;
        
        elm.each(function(){            
            totalHeight += $(this).innerHeight();
        });
        
        return totalHeight;
    },
    _debouncer:  function(func, timeout) {
        
        var timeoutID, timeout = timeout || 200;
        
        return function () {
            var scope = this, args = arguments;
            
            clearTimeout(timeoutID);
                timeoutID = setTimeout(function () {
                func.apply(scope, Array.prototype.slice.call(args));
            }, timeout);
        };
    },
    run: function(){
        app.layout.controls();    
        app.layout.aside_fixed();
        app.layout.fixed_panel();    
        app.layout.responsive();

        app.navigation_detect_auto();
        app.navigation_quick_build("navigation-quick","rw-");    

        app.navigation();
        app.file_tree();        

        app.header_search();    
        app._backToTop();
        app._rwProgress();
        app._rwAccordion();
        app._rwCompactGallery.init();
    }
};

document.addEventListener("DOMContentLoaded", function() {    
    app.run();
});

window.addEventListener("resize", function(){
       
    app.layout.responsive();
    app._rwCompactGallery.controlHeight();
    
}, true);