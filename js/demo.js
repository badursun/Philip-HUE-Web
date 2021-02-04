"use strict";

var demo = {
    init: function(){
        
        // update card button                
        $("[data-demo-action='update']").each(function(){
            
            var card = $(this).parents(".card");
            
            $(this).click(function(e){                
                
                e.preventDefault();
                
                app._loading.show(card,{spinner: true});                
                
                setTimeout(function(){
                    app._loading.hide(card);
                },2000);                
                
                return false;
            });            
        });
        // end update card button
        
        // expand card button                
        $("[data-demo-action='expand']").each(function(){
            
            var card = $(this).parents(".card");
            
            $(this).click(function(e){
                
                e.preventDefault();                
                
                app._loading.show(card,{spinner: true});
                
                $(this).toggleClass("active");
                card.toggleClass("card--expanded");
                
                app._crt();
                
                setTimeout(function(){
                    app._loading.hide(card);
                },1000);
                
                return false;
            });            
        });
        // end expand card button
        
        // invert card button                
        $("[data-demo-action='invert']").each(function(){
            
            var card = $(this).parents(".card");

            if(card.hasClass("invert")){
                $(this).addClass("active");
            }
            
            $(this).click(function(e){
                e.preventDefault();
                
                $(this).toggleClass("active");
                card.toggleClass("invert");
                
                return false;
            });            
        });
        // end invert card button
        
        // remove card button
        $("[data-demo-action='remove']").each(function(){
            
            var card = $(this).parents(".card");
            
            $(this).click(function(e){
                e.preventDefault();
                app.card.remove(card);
                return false;
            });            
        });
        // end remove card button

    }
};

document.addEventListener("DOMContentLoaded", function () {    
    demo.init();
});