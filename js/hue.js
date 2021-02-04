let $lightsTicker;
let RepeatTimingLights=600;
var SettingsReady=false;
var HueNetwork=false;
var HueUser=false;
var noCallback=null, noTime=null, noFooter=null, lazyLoadInstance=null, ProxyUse=true, ProxyNo=false;
var HueAPP = {
	colorToHueHsv: function (color) {
		var jqc = $.Color(color);
		return {
			"hue" : Math.floor(65535 * jqc.hue() / 360),
			"sat": Math.floor(jqc.saturation() * 255),
			"bri": Math.floor(jqc.lightness() * 255)
		}
	},
    /*
		AJAX BINDER
    */
    ajaxBinder: function(){

    },
    /*
    * ###############################################################
    * Settings
    * ###############################################################
    */
    settings: {
    	app_api_user	: '',
    	app_api_ip		: '',
    	app_api_key 	: '',
    	app_api_lights  : {},
    	app_api_base 	: '',
    	app_api_lights_count: 0,
        animation: 190,
        animationPanel: 500,
        navigation: {
            detectAuto: true, 
            closeOther: true,
            fixNavAlwaysDropUp: false
        },
        hueDiscoverURI: "https://discovery.meethue.com/",   
        headerHeight: 60,
        containerHeight: 60,
        boxedPaddings: 100,
        indentPaddings: 60,
        logo: '<div class="logo-text"><strong class="text-primary">#</strong> <strong>VET</strong>Ropin</div>',
        backToTop: true,
        backToTopHeight: 200,
        responsiveState: false,
        breakpoints: {xs: 0, sm: 576, md: 768, lg: 1024, xl: 1200},
        swal: {
            background: 'rgba(255, 255, 255, 1)',
            customClass: {
              closeButton       : 'btn btn-seconary',
              confirmButton     : 'btn btn-success', 
              cancelButton      : 'btn btn-seconary'
            }
        }
    },
    /*
    * ###############################################################
    * GoodUI Alert
    * ###############################################################
    */
    alert: function(type="", title="", message="", footerhtml="", tTimer=null, callBack=noCallback, buttons={confirm:false, cancel:true}){ 
      Swal.fire({
        type                : type,
        title               : title,
        html                : message,
        footer              : footerhtml,
        showCancelButton    : buttons.cancel,
        showConfirmButton   : buttons.confirm,
        allowOutsideClick   : false,
        allowEscapeKey      : false,
        allowEnterKey       : false,
        buttonsStyling      : false,
        reverseButtons      : true,
        background          : HueAPP.settings.swal.background,
        customClass         : HueAPP.settings.swal.customClass,
        timer               : tTimer
      }).then(function(result){
        if (result.value || result.dismiss=='timer'){
          let CheckTypefn = typeof(result);
          console.log('CheckTypefn: ' + CheckTypefn );
          if( CheckTypefn == 'function' || CheckTypefn == 'object' ){ 
            try {
              callBack(result); 
            }
            catch(error) {
              console.log('app=>systems=>alert=>callbackfn');
            }
          };
        }
      }).catch(swal.noop);
    },
    SetAjax: function(url, method, data, callback, globalMi=true, Proxy=ProxyNo){
        //console.log('app=>SetAjax('+globalMi+')');
        return new Promise(function(resolve, reject) {
            console.log('withCredentials=false');
        	if(Proxy==true){
        		url = 'https://cors-anywhere.herokuapp.com/' + url;
        	};

            $.ajax({
                type        : method,
                global      : globalMi,
                beforeSend  : function (request) {
                    request.withCredentials = false;
                },
                url         : url,
                data        : data,
                success     : function(result) {
                	console.log(result)
                    return resolve(result);
                },
                error       : function(e) {
                    reject(e);
                    HueAPP.alert('error', 'İşlem Başarısız', 'Bir Hata Oluştu<br />'+e+'', null, null);
                }
            });
        });
    },
    PhilipsHUE:{
    	Lights: function(){
    		console.log('HueAPP=>PhilipsHUE=>Lights(ticker)');
    		let LightsAPI = HueAPP.settings.app_api_base + '/lights/';
    		let LightsContainer = $('#hue_elements');

            HueAPP.SetAjax(LightsAPI, "GET", {}, null, false, ProxyNo)
                .then(function(v) {
                	app_api_lights = v;
                	app_api_lights_count = Object.keys(app_api_lights).length;
                	//console.log( 'Lamba Sayısı: ' + app_api_lights_count );

                    let $total = v.length;
					$.each( v, function( key, value ) {
						// console.log( 'DATA: '+ key )
                    	LightsContainer.append( HueAPP.PhilipsHUE.LightsTemplate( v[key], key ) );
					});
                })
                .catch(function(v) {
                	// console.log('Error')
                })
                .finally(function(v) {
                	// console.log('Finally')
                    HueAPP.PhilipsHUE.CheckLightsData();

                    if(typeof $lightsTicker=='undefined'){
                        console.log('ticker set: ', RepeatTimingLights);
                        $lightsTicker = setInterval( function(){ HueAPP.PhilipsHUE.Lights() }, RepeatTimingLights);
                    }
                	HueAPP.PhilipsHUE.LoadFormController();
                });
    	},
    	SerializeForm: function(id){
    		let FormData = HueAPP.PhilipsHUE.serializeToJson( $('#light_'+id).serializeArray() );
    		//let FormData = JSON.stringify( $('#light_'+id).serializeArray() );
    		console.log( FormData );
    		let HueData = '{"on":'+ FormData.state +', "bri":'+ FormData.bri +', "xy":['+ FormData.xy +']}'
    		console.log( HueData );

			let LightStateApi = HueAPP.settings.app_api_base +'/lights/'+ id +'/state';
			$.ajax({
				url         :  LightStateApi,
				type        : "PUT",
				data        : HueData,
                beforeSend  : function (request) {
                    request.withCredentials = false;
                }
			});
    	},
		serializeToJson: function(serializer){
		    var _string = '{';
		    for(var ix in serializer)
		    {
		        var row = serializer[ix];
		        _string += '"' + row.name + '":"' + row.value + '",';
		    }
		    var end =_string.length - 1;
		    _string = _string.substr(0, end);
		    _string += '}';
		    console.log('_string: ', _string);
		    return JSON.parse(_string);
		},
    	LoadFormController: function(){
    		$('form.settings_form').each(function(index, el) {
    			let FormID = $(this).attr('data-id');

    			/* Aç Kapat */
    			$('#state_'+FormID).click(function(event) {
    				let status = $(this).is(":checked");
    				$('form#light_'+FormID+' input[name="state"]').val( status );
    				HueAPP.PhilipsHUE.SerializeForm(FormID);
    			});
    			
    			/* Parlaklık */
			    $("#bri_"+FormID).ionRangeSlider({
			    	skin: "round",
			        onFinish: function(data){
						// let hue   = data.from / 182;
						// let sat   = "100%";
						// let light = "50%";

						// let LightId 	= $(data.input).attr('data-light-id');
						// let LightStatus = $(data.input).attr('data-light-status');

						$('form#light_'+FormID+' input[name="bri"]').val(data.from);
						HueAPP.PhilipsHUE.SerializeForm(FormID);
						//console.log( 'LightSettings: '+ $(data.input).closest().find('form').attr('data-id') );
// // let my_range = $('input[id="2"]').data("ionRangeSlider");
// // my_range.destroy()

// 						var lightState = {"on": true, "bri": parseInt(data.from), "sat": 254};
// 						// setLightState($(this).parent().data("id"), lightState);

// 						$("color_"+LightId).css("background-color", "hsl(" + [hue, sat, light].join(',') + ")");

// 						let LightStateApi = 'https://'+HueAPP.settings.app_api_ip+'/api/'+ HueAPP.settings.app_api_key +'/lights/'+ LightId +'/state';
// 						$.ajax({
// 							url:  LightStateApi,
// 							type: "PUT",
// 							data: JSON.stringify(lightState)
// 						});
			        }
			    });

    			/* Renklendirme */
			    let x 	= $("#color_"+FormID).attr('data-x');
			    let y 	= $("#color_"+FormID).attr('data-y');
			    let bri = $("#color_"+FormID).attr('data-bri');
			    let hsl = HueAPP.PhilipsHUE.getHEX(x,y, bri);
				$("#color_"+FormID).spectrum({
				    preferredFormat: "hsl",
				    color: hsl,
				    showInput: false,
				    showPalette: false
				}).on('change.spectrum', function(e, tinycolor) {
					let NewColor = tinycolor.toRgb();
					let XYColor = HueAPP.PhilipsHUE.getXY( NewColor.r, NewColor.g, NewColor.b );
					// let XYColor = HueAPP.colorToHueHsv( tinycolor.toRgb() )
					//console.log( NewColor );
					//console.log( HueAPP.PhilipsHUE.getXY( NewColor.r, NewColor.g, NewColor.b ) )
					$('form#light_'+FormID+' input[name="xy"]').val(XYColor);
					HueAPP.PhilipsHUE.SerializeForm(FormID);
				});

    		});
    	},
    	getHEX: function(x, y, bri){
		    z = 1.0 - x - y;

		    Y = bri / 255.0; // Brightness of lamp
		    X = (Y / y) * x;
		    Z = (Y / y) * z;
		    r = X * 1.612 - Y * 0.203 - Z * 0.302;
		    g = -X * 0.509 + Y * 1.412 + Z * 0.066;
		    b = X * 0.026 - Y * 0.072 + Z * 0.962;
		    r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, (1.0 / 2.4)) - 0.055;
		    g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, (1.0 / 2.4)) - 0.055;
		    b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, (1.0 / 2.4)) - 0.055;
		    maxValue = Math.max(r,g,b);
		    r /= maxValue;
		    g /= maxValue;
		    b /= maxValue;
		    r = r * 255;   if (r < 0) { r = 255 };
		    g = g * 255;   if (g < 0) { g = 255 };
		    b = b * 255;   if (b < 0) { b = 255 };

		    r = Math.round(r).toString(16);
		    g = Math.round(g).toString(16);
		    b = Math.round(b).toString(16);

		    if (r.length < 2)
		        r="0"+r;        
		    if (g.length < 2)
		        g="0"+g;        
		    if (b.length < 2)
		        b="0"+r;        
		    rgb = "#"+r+g+b;

		    return rgb;             
		},
		getXY: function(red, green, blue) {

		    if (red > 0.04045) {
		        red = Math.pow((red + 0.055) / (1.0 + 0.055), 2.4);
		    } else red = (red / 12.92);

		    if (green > 0.04045) {
		        green = Math.pow((green + 0.055) / (1.0 + 0.055), 2.4);
		    } else green = (green / 12.92);

		    if (blue > 0.04045) {
		        blue = Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4);
		    } else blue = (blue / 12.92);

		    var X = red * 0.664511 + green * 0.154324 + blue * 0.162028;
		    var Y = red * 0.283881 + green * 0.668433 + blue * 0.047685;
		    var Z = red * 0.000088 + green * 0.072310 + blue * 0.986039;
		    var x = X / (X + Y + Z);
		    var y = Y / (X + Y + Z);
		    return new Array(x, y);
		},
    	LightsStatusText: function(vState){
    		console.log('HueAPP=>PhilipsHUE=>LightsStatusText('+vState.on+' && '+vState.reachable+')');
    		if(vState.on==true && vState.reachable==true){
    			return '<span class="badge badge-pill badge-success">Açık</span>';
    		};
    		if(vState.on==true && vState.reachable==false){
    			return '<span class="badge badge-pill badge-primary">Açık/Erişilemez</span>';
    		};
    		if(vState.on==false && vState.reachable==true){
    			return '<span class="badge badge-pill badge-warning">Kapalı</span>';
    		};
    		if(vState.on==false && vState.reachable==false){
    			return '<span class="badge badge-pill badge-danger">Kapalı/Erişilemez</span>';
    		};
    	},
        CheckLightsData: function(){
            $('.lightsJson').each(function(index, el) {
                let LightsJson = JSON.parse( $(this).val() );
                let $lightId        = LightsJson.uniqueid
                let LightStatus     = LightsJson.state.on ? 'text-warning' : 'text-dark';
                let Status          = LightsJson.state.on ? 'checked' : '';
                let LightReachable  = LightsJson.state.reachable;
                let LightColored    = LightsJson.state.xy ? '' : 'disabled'

                let $lightContainer = $('[data-id="'+ $lightId +'"]');
                    $lightContainer.find('[data-LightStatus]').removeClass('text-warning text-dark').addClass(LightStatus);
                    $lightContainer.find('input[name="bri"]').val(LightsJson.state.bri);
                    $lightContainer.find('input[name="xy"]').val(LightsJson.state.sat);
                    $lightContainer.find('input[name="state"]').val(LightsJson.state.on);
                //console.log('CheckLightsData')
            });
        },
    	LightsTemplate: function(LightsJson, Id){
            // console.log('HueAPP=>PhilipsHUE=>LightsTemplate');
            // console.log('Fetched: ' + LightsJson.name);
            let $lightId        = LightsJson.uniqueid
            let LightStatus     = LightsJson.state.on ? 'text-warning' : 'text-dark';
            let Status          = LightsJson.state.on ? 'checked' : '';
            let LightReachable  = LightsJson.state.reachable;
            let LightColored    = LightsJson.state.xy ? '' : 'disabled'

            if( $('[name="'+ $lightId +'"]')[0] ){
                $('[name="'+ $lightId +'"]').val( JSON.stringify(LightsJson) );
                // console.log('Input Update');
            }else{
                // console.log('Input Append');
                $('<input type="hidden" class="lightsJson" name="'+ $lightId +'" value=\''+ JSON.stringify(LightsJson) +'\' />').appendTo('#hue_elements');
            };

            // console.log('Check: #hue_elements > div[data-id="'+ $lightId +'"]');
            
            if( $('div[data-id="'+ $lightId +'"]').length == 0 ){
                console.log('Template Added');
                let LT = '' +
                '<div class="col-12 col-md-6 col-lg-3 lighttemplate" data-id="'+ $lightId +'">' +
                '    <div class="card invert">' +
                '        <div class="page-heading">' +
                '            <div class="page-heading__container page-heading__container--center">' +
                '                <h1 class="title">'+ LightsJson.name +'</h1>' +
                '                <p class="caption">'+ HueAPP.PhilipsHUE.LightsStatusText( LightsJson.state ) +'</p>' +
                '            </div>' +
                '        </div>' +
                '        <div class="card-body text-center">' +
                '            <div data-LightStatus="" class="icon-box icon-box--xlg icon-box--inline icon-box--bordered '+ LightStatus +'"><span class="li-lamp"></span></div>' +
                '        </div>' +
                '        <div class="card-body padding-top-0">' +

                '            <form id="light_'+ Id +'" data-id="'+ Id +'" class="settings_form">' +
                '               <input type="hidden" name="bri" value="'+ LightsJson.state.bri +'">' +
                // '                <input type="hidden" name="hue" value="'+ LightsJson.state.hue +'">' +
                // '                <input type="hidden" name="sat" value="'+ LightsJson.state.sat +'">' +
                '               <input type="hidden" name="xy" value="'+ LightsJson.state.sat +'">' +
                '               <input type="hidden" name="state" value="'+ LightsJson.state.on +'">' +
                '            </form>' +

                '            <div class="row">' +
                '                <div class="col-9">' +
                '                    <input type="text" data-min="0" data-max="254" data-from="'+ LightsJson.state.bri +'" data-light-id="'+ Id +'" data-light-status="'+ LightsJson.state.on +'" data-light-reachable="'+LightReachable+'" name="bri" id="bri_'+ Id +'" class="slider" value="'+ LightsJson.state.bri +'"> ' +
                '                </div>' +
                '                <div class="col-3 text-right">';
                if(LightsJson.state.xy){
                    LT+='                   <input type="text" class="hsl" id="color_'+ Id +'" data-x="'+ LightsJson.state.xy[0] +'" data-y="'+LightsJson.state.xy[1]+'" data-bri="'+LightsJson.state.bri+'" '+LightColored+' />';
                }

                LT+='<label class="switch switch-sm">';
                LT+='<input type="checkbox" id="state_'+ Id +'" name="switch_8" '+Status+' />';
                LT+='<span></span> </label>';
                LT+='                </div>' +
                '            </div>' +
                '        </div>' +
                '    </div>' +
                '</div>';

                return LT;
            }
    	},
    	/*
    		HUE APP
			Network Kontrol Et
    	*/
    	check_hue_network: function(){
    		console.log('HueAPP=>PhilipsHUE=>check_hue_network');
    		// İlk Önce Kayıtlımı Bakalım.
    		if( localStorage["hue-bridge-ip"] !== undefined ){
    			return true;
    		}else{
    			return false;
    		}

    	},
    	CheckAppRegister: function(){
    		console.log('HueAPP=>PhilipsHUE=>CheckAppRegister');
    		if( !localStorage["hue-bridge-key"] ){
	            Swal.fire({
	                title               : 'Uygulama Kaydı',
	                text                : "Ağınızda bulunan HUE Bridge ile güvenli iletişim için Bridge tarafından API anahtarı alınması gerekli. Anahtarınız varsa Manuel Gir butonuna tıklayın. Yoksa yeni anahtar oluşturmak için Devam butonuna tıklayın",
	                type                : 'info',
	                showCancelButton    : true,
	                confirmButtonColor  : '#28a745',
	                cancelButtonColor   : '#d33',
	                confirmButtonText   : 'Devam',
	                cancelButtonText    : 'Manuel Gir',
			        background          : HueAPP.settings.swal.background,
			        customClass         : HueAPP.settings.swal.customClass
	            }).then((result) => {
					if (result.value) {
					    HueAPP.PhilipsHUE.CreateRegister();
					} else if(result.dismiss === Swal.DismissReason.cancel){
					    HueAPP.PhilipsHUE.MigrateApp();
					}
	            });


    		};
    	},
    	CreateRegister: function(){
    		console.log('HueAPP=>PhilipsHUE=>CreateRegister');
            Swal.fire({
                title: 'Anahtar Oluşturuluyor',
                text: 'Sizin içi yeni bir anahtar oluşturuluyor. Bu işlem ağınıza bağlı olarak bir kaç saniye sürebilir.',
                type: "info",
                showConfirmButton: false,
                allowEscapeKey: false,
                allowOutsideClick:false,
            });

            let AppName = 'hue_appjans';
            let AppUser = 'MyPrivateUser';
            let $data 	= '{"devicetype":"'+AppName+'#'+AppUser+'"}'
            let AppRegistred=false;
            let DiscoverMsg = [];
            let TryAgain = false;

	        HueAPP.SetAjax( 'http://'+localStorage["hue-bridge-ip"]+'/api' , "POST", $data, null, false, ProxyNo)
	            .then(function(v) {
	            	/* Cevap Gelmediyse */
	            	if( (typeof v) != "object" ){
	                	AppRegistred = false;
	                	DiscoverMsg = ['error','İşlem Başarısız', 'Bridge beklenmeyen bir yanıt döndürdü.'];
	                	return false;
	            	};

	            	/* Veri Gelmediyse */
	            	if(v.length==0){
	            		DiscoverStatus=false;
	                	DiscoverMsg = ['error', 'İşlem Başarısız', 'Bridge geçersiz bir yanıt döndürdü'];
	            		return false;
	            	};

	            	/* Error Döndüyse */
	            	if( v[0].error ){
	            		if( v[0].error.type == 2 ){
		            		DiscoverStatus=false;
		                	DiscoverMsg = ['warning', 'Yazılım Hatası', 'Bridge Şöyle Dedi: '+ v[0].error.description +''];
		            		return false;
	            		}
	            		if( v[0].error.type == 101 ){
		            		DiscoverStatus=false;
		                	DiscoverMsg = ['warning', 'Link Butonuna Basın', 'Birdge üstünde bulunan link butonuna basmanız gerekmektedir. Butona basıp Tekrar Dene ye tıklayın.'];
		            		TryAgain = true;
		            		return false;
	            		}

	            		DiscoverStatus=false;
	                	DiscoverMsg = ['error', 'İşlem Başarısız', 'Bridge geçersiz bir yanıt döndürdü'];
	            		return false;
	            	};

	            	/* Aksi Halde [{"success":{"username":"21nLusJKpz9Unr2VRT31giMKpvHCSH0ufrluBj-E"}}] */
	            	if( v[0].success ){
		            	let NewAPIKey = v[0].success.username;

	            		HueAPP.PhilipsHUE.saveCredentials('hue-bridge-key', NewAPIKey);

            			DiscoverStatus=true;
                		DiscoverMsg = ['success', 'İşlem Başarılı', 'HUE Bridge bağlantınız tarayıcınıza kayıt edildi.'];
                	}
	            })
	            .catch(function(v) {
	                HueAPP.alert('error', 'İşlem Başarısız', 'Bir Hata Oluştu, işlem yapılamadı.', null, null);
	            })
	            .finally(function(v) {
	            	/* Link Butonuna Basılmamış*/
	            	if(TryAgain==true){
			            Swal.fire({
			                title               : 'Link Butonuna Basın',
			                text                : "Birdge üstünde bulunan link butonuna basmanız gerekmektedir. Butona basıp Tekrar Dene ye tıklayın.",
			                type                : 'warning',
			                showCancelButton    : true,
			                confirmButtonColor  : '#28a745',
			                cancelButtonColor   : '#d33',
			                confirmButtonText   : 'Bastım',
					        background          : HueAPP.settings.swal.background,
					        customClass         : HueAPP.settings.swal.customClass,
			                cancelButtonText    : 'Vazgeç'
			            }).then((result) => {
			                if (result.value) {
								let timerInterval
								Swal.fire({
								    title: 'Tekrar Deneniyor',
								    html: '<b></b> Saniye İçinde Tekrar Deneniyor',
								    timer: 5000,
								    timerProgressBar: true,
								    onBeforeOpen: () => {
								        Swal.showLoading()
								        timerInterval = setInterval(() => {
								            const content = Swal.getContent()
								            if (content) {
								                const b = content.querySelector('b')
								                if (b) {
								                    b.textContent = Math.round( Swal.getTimerLeft() / 1000)
								                }
								            }
								        }, 100)
								    },
								    onClose: () => {
								        clearInterval(timerInterval);
								    }
								}).then((result) => {
								    if (result.dismiss === Swal.DismissReason.timer) {
								        HueAPP.PhilipsHUE.CreateRegister();
								    }
								});
			                }
			            });
	            	}else{
	            		HueAPP.PhilipsHUE.Lights();
	                	//HueAPP.alert( DiscoverMsg[0] , DiscoverMsg[1], DiscoverMsg[2], null, null);
	            	}
	            });
    	},
    	MigrateApp: function(){
    		console.log('HueAPP=>PhilipsHUE=>MigrateApp');
			Swal.fire({
			    title: 'API Anahtarınızı Girin',
			    input: 'text',
			    inputValue: '',
			    showCancelButton: true,
			    inputValidator: (value) => {
			        if (!value) {
			            return 'Anahtar kodu girmeniz gerekli.'
			        }else if(value.length < 28 ) {
			            return 'Girilen değer anahtar kodu değil'
			        }else{
			        	HueAPP.PhilipsHUE.saveCredentials('hue-bridge-key', value);
			        	HueAPP.PhilipsHUE.Lights();
			        }
			    }
			})
    	},

    	/*
    		HUE APP
			Bridge nupnp
			https://www.meethue.com/api/nupnp
    	*/
        DiscoverNetwork: function(){
        	console.log('HueAPP=>PhilipsHUE=>DiscoverNetwork');
	        /* Loader*/
            Swal.fire({
                title: 'nuPNP Deneniyor',
                text: 'meethue Ağı Sorgulanırken lütfen bekleyin.',
                type: "info",
                showConfirmButton: false,
                allowEscapeKey: false,
                allowOutsideClick:false,
            });

            /* Wait For Stabilize */
            setTimeout(function(){
		        /* Servisi Başlat */
				var DiscoverStatus 	= false;
		        var DiscoverMsg 	= [];
		        
		        HueAPP.SetAjax( HueAPP.settings.hueDiscoverURI , "GET", {}, null, false, ProxyNo)
		            .then(function(v) {
                        console.log('hueDiscoverURI:', v);

		            	/* Cevap Gelmediyse */
		            	if( (typeof v) != "object" ){
		                	DiscoverStatus = false
		                	DiscoverMsg = ['error','İşlem Başarısız', 'nuPNP sorgulamasından cevap alınamadı. İnternet bağlantınızı kontrol edin.'];
		                	return false;
		            	};

		            	/* Veri Gelmediyse */
		            	if(v.length==0){
		            		DiscoverStatus=false;
		                	DiscoverMsg = ['error', 'İşlem Başarısız', 'IP adresiniz nuPNP sorgulamasında bulunamadı. Bridge bağlantınızı kontrol edin.'];
		            		return false;
		            	};

		            	/* Aksi Halde */
		            	let BridgeIP = v[0].internalipaddress;
		            	let BridgeID = v[0].id;

		            	HueAPP.PhilipsHUE.saveCredentials('hue-bridge-id', BridgeID);
		            	HueAPP.PhilipsHUE.saveCredentials('hue-bridge-ip', BridgeIP);

	            		DiscoverStatus=true;
	                	DiscoverMsg = ['success', 'İşlem Başarılı', 'HUE Bridge bağlantınız tarayıcınıza kayıt edildi.'];
		            })
		            .catch(function(v) {
		                HueAPP.alert('error', 'İşlem Başarısız', 'Bir Hata Oluştu, işlem yapılamadı.', null, null);
		            })
		            .finally(function(v) {
		                HueAPP.alert( DiscoverMsg[0] , DiscoverMsg[1], DiscoverMsg[2], null, {confirm:true, cancel:false});

		                HueAPP.PhilipsHUE.CheckAppRegister();
                        HueAPP.PhilipsHUE.Lights();
		            });
            },1000);
        },
    	/*
    		HUE APP
			API Init
    	*/
        init: function(){
        	console.log('HueAPP=>PhilipsHUE=>Init');
        	if( HueAPP.PhilipsHUE.keyExist() ){
        		HueAPP.PhilipsHUE.updateKeyInput();
        		HueAPP.PhilipsHUE.Lights();
        	}else{
        		if( localStorage["hue-bridge-key"] ){

        		};

        		/* Yan Paneli Göster*/
        		document.querySelector("[data-action='fixedpanel-toggle']").click();

        		/* Bağlantı Uyarısı Gönder */
	            Swal.fire({
	                title               : 'Bağlantı Yapılmamış',
	                text                : "Ağınızda bağlı bir HUE Bridge varsa şimdi tanımlamak ister misiniz? Bu işlemi başlatmadan önce HUE Bridge ile aynı ağda ve ağınızın internet bağlantısı olduğuna emin olun.",
	                type                : 'info',
	                showCancelButton    : true,
	                confirmButtonColor  : '#28a745',
	                cancelButtonColor   : '#d33',
	                confirmButtonText   : 'Başla',
			        background          : HueAPP.settings.swal.background,
			        customClass         : HueAPP.settings.swal.customClass,
	                cancelButtonText    : 'Vazgeç'
	            }).then((result) => {
	                if (result.value) {
	                	HueAPP.PhilipsHUE.DiscoverNetwork();
	                }
	            });
        	}
        },
    	/*
    		HUE APP
			IndexDB Checker
    	*/
        CanIuseIndexedDB: function(){
        	console.log('HueAPP=>PhilipsHUE=>CanIuseIndexDB');
            if (indexedDB) {
              return true;
            } else {
              return false;
            }
        },
        keyExist: function(){
        	console.log('HueAPP=>PhilipsHUE=>keyExist');
        	let str_id 		= localStorage["hue-bridge-id"]; 	// data-key="hue-bridge-id"
        	let str_ip 		= localStorage["hue-bridge-ip"]; 	// data-key="hue-bridge-ip"
        	let str_apikey 	= localStorage["hue-bridge-key"]; 	// data-key="hue-bridge-key"

                if( !(str_id === undefined || str_ip === undefined || str_apikey === undefined) ) {
                	/* Update Settings */
			    	HueAPP.settings.app_api_user 	= str_id;
			    	HueAPP.settings.app_api_ip 		= str_ip;
			    	HueAPP.settings.app_api_key 	= str_apikey;
    				HueAPP.settings.app_api_base 	= 'http://'+str_ip+'/api/'+ str_apikey +'';
                    return true;
                }else{
                    return false;
                }
        },
        updateKeyInput: function(){
        	console.log('HueAPP=>PhilipsHUE=>updateKeyInput');
        	let HueInputs = ['hue-bridge-id', 'hue-bridge-ip', 'hue-bridge-key'];

        	if( HueAPP.PhilipsHUE.CanIuseIndexedDB() ){
	        	$(HueInputs).each(function(index, Key) {
	        		$('input[data-key="'+ Key +'"]').val( localStorage[ Key ] );
	        	});
        	}
        },
    	/*
    		HUE APP
			Control Key Save 
    	*/
        saveCredentials: function(Key, Val) {
        	console.log('HueAPP=>PhilipsHUE=>saveCredentials');
            if( HueAPP.PhilipsHUE.CanIuseIndexedDB() ){
            	localStorage.setItem(Key, Val);
            	if( $('input[data-key="'+Key+'"]').length ){
            		$('input[data-key="'+Key+'"]').val( Val );

			    	if(Key=='hue-bridge-id') HueAPP.settings.app_api_user 	= Val;
			    	if(Key=='hue-bridge-ip') HueAPP.settings.app_api_ip 	= Val;
			    	if(Key=='hue-bridge-key') HueAPP.settings.app_api_key 	= Val;

            	}
            }else{
            	HueAPP.alert('error', 'Hata Oluştu', 'Anahtar Kayıt Edilemedi !', null, null);
            }

            HueAPP.PhilipsHUE.keyExist();
        },

        clearCredentials: function(){
        	console.log('HueAPP=>PhilipsHUE=>clearCredentials');
            Swal.fire({
                title                   : 'Emin Misiniz?',
                text                    : "Özel Şifreleme anahtarınız bilgisayarınızdan silinecektir. Verilerinize ulaşabilmek için tekrar anahtar girmeniz gerekmektedir.",
                type                    : 'warning',
                showCancelButton        : true,
                confirmButtonColor      : '#28a745',
                cancelButtonColor       : '#d33',
                confirmButtonText       : 'Evet!',
                background              : 'rgba(0, 0, 0, 1)',
                cancelButtonText        : 'Vazgeç'
            }).then((result) => {
                if (result.value) {
                    localStorage.removeItem("hue-bridge-id");
                    localStorage.removeItem("hue-bridge-ip");
                    localStorage.removeItem("hue-bridge-key");
                    // $('encrypted.decrypted').each(function(index, el) {
                    //     let $dom = $(this);
                    //         $dom.show();
                    //         $dom.next().remove();
                    // });
                    // for (var i = 0; i < $('input.encryptionKey').length; i++) {
                    //     $('#key'+(i+1)).val('');
                    // }
                    /*Show Business*/
                    HueAPP._loading.show( $('.modal-content')  , {spinner:true, dark: true, text: 'Lütfen Bekleyin...'});
                    setTimeout(function(){
                        HueAPP._loading.hide( $('.modal-content') );
                        location.reload(true);
                    },750);
                }
            });
        }
    },
    Modal: function(Title, Content){
		console.log('HueAPP=>PhilipsHUE=>Modal');
        if( $('#modal_form').length ){
	        $('#modal_form_title').html( Title );
	        $('#modal_form_body').html( Content );
	        $('#modal_form').modal('show');
	        $(document).triggerHandler('ajaxComplete');
        }
    },
    sessionSaver: function(){
        if( $('body[data-encyrption]').length  ){
            setTimeout(function(){
                HueAPP._loading.show( $('.logo-holder')  , {spinner:true, dark: true, text: 'Lütfen Bekleyin...'});

                HueAPP.SetAjax("/ws/?Cmd=session.checker", "GET", {}, null, false, ProxyNo)
                    .then(function(v) {
                        if(v.status==200){

                        }else{
                            HueAPP.alert('error', 'Oturum Sorunu', v.messages, null, null);
                        }
                        HueAPP._loading.hide( $('.logo-holder') );
                        HueAPP.sessionSaver();
                    })
                    .catch(function(v) {
                        HueAPP._loading.hide( $('.logo-holder') );
                    });
            },25000);
        }
    },
    layout: {
        responsive: function(){
                
            var pageContent     = $("#page-content");
            var pageAside       = $("#page-aside");
            var pageSidepanel   = $("#page-sidepanel");
            
            if(!HueAPP.settings.responsiveState){
            
                if(window.innerWidth <= HueAPP.settings.breakpoints.md){
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

                if(window.innerWidth <= HueAPP.settings.breakpoints.xl){
                    // sidepanel
                    if(pageSidepanel){
                        pageContent.addClass("page-sidepanel--hidden");
                        pageSidepanel.addClass("page-sidepanel--hidden");                    
                    }
                }
                
            }else{
                HueAPP.settings.responsiveState = false;              
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
                HueAPP._controlPanelEvent(pageAsideMinimizeButton,pageAside,"page-aside-animation-show","page-aside--minimized", false, HueAPP.settings.breakpoints.md, "group1", $("#content"));
            // end minimize aside event

            // hide aside event
            if(pageAsideHideButton.length > 0)
                HueAPP._controlPanelEvent(pageAsideHideButton,pageAside,"page-aside-animation-show","page-aside--hidden", $("#content"), HueAPP.settings.breakpoints.md, "group1");        
            // end hide aside event

            // hide sidepanel event
            if(pageSidepanelHideButton.length > 0)
                HueAPP._controlPanelEvent(pageSidepanelHideButton,pageSidepanel,"page-sidepanel-animation-show","page-sidepanel--hidden", $("#content"), HueAPP.settings.breakpoints.xl, "group2");
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
                                
                $(window).on("scroll", HueAPP._debouncer( function(){
                    
                    var totalHeight = 0; 
                    
                    if($(".page__header").length > 0){
                        totalHeight += HueAPP.settings.headerHeight;
                    }
                    if($(".page__container").length > 0){
                        totalHeight += HueAPP.settings.containerHeight;
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
                            HueAPP._backdrop.show(true);
                            fixed_panel.addClass("show");
                        }else{
                            HueAPP._backdrop.hide();
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
        if(HueAPP.settings.navigation.detectAuto){
            
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
            
            HueAPP._loading.show(container.parent(),{spinner: true});
            
            ids.each(function(index, id){
                container.append($("<li><a href=\"#"+id.getAttribute("id")+"\">"+id.innerHTML+"</a></li>"));
            });
            
            setTimeout(function(){
                HueAPP._loading.hide(container.parent());
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
                            }, HueAPP.settings.animation, function(){
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
                        if(HueAPP.settings.navigation.closeOther){
                            var parentsLi = $(this).parents("li");                            
                            $(this).parents("ul").find("> li").not(parentsLi).removeClass("open");                                                                                   
                        }                                                
                        
                        li.addClass("open");
                        
                        HueAPP.settings.responsiveState = true;
                        HueAPP._crt();            
                        
                        li.trigger("mouseenter");                        
                        
                        return false;
                    }
                    
                });

            });                        
            
            // fix navigation in case if view port is smaller then popup
            HueAPP._navigationFix(nav);
            
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
                    
                    HueAPP._crt();
                    
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
            },HueAPP.settings.animation);
            
            if(typeof fn === "function") fn();
            
            HueAPP._crt();
            
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
                            if(HueAPP.settings.navigation.fixNavAlwaysDropUp){
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
                            
                            HueAPP._loading.show(hideContentMobile,{id: group, spinner: true, solid: true});
                        }
                    }
                    
                }else{
                    
                    panel.addClass(classname,animation);
                    pageContent.addClass(classname);                                        

                    if(hideContentMobile !== false){
                        
                        setTimeout(function(){
                            if(hideContentMobile.children(".loading").length <= 1)
                                hideContentMobile.removeClass("hideContainerContent");                            
                            
                            HueAPP._loading.hide(hideContentMobile, HueAPP.settings.animation, group);
                        },HueAPP.settings.animation);                    
                        
                    }else{
                        
                        setTimeout(function(){
                            if(ignore.children(".loading").length <= 1)
                                ignore.removeClass("hideContainerContent");                            
                            
                            HueAPP._loading.hide(ignore, HueAPP.settings.animation, group);
                        },HueAPP.settings.animation);                                            
                        
                    }
                    
                }

                HueAPP.settings.responsiveState = true;
                HueAPP._crt();                

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
        var timeout = (typeof timeout === "undefined") ? HueAPP.settings.animationPanel : 0;                
        
        // content resize trigger. use this function to avoid content size problems               
        setTimeout(function(){
            HueAPP._fireResize();
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
            },HueAPP.settings.animation);
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
                   },HueAPP.settings.animation);
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
                            },HueAPP.settings.animation);
                            
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
                        logo.innerHTML = HueAPP.settings.logo;
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
                    
                },HueAPP.settings.animation);                 
                
        }
    },
    _backToTop: function(){
        
        if(!HueAPP.settings.backToTop) return false;
        
        var button = document.createElement("div");
            button.classList.add("back_to_top");
        
        button.addEventListener("click",function(){
            window.scroll({top: 0, left: 0, behavior: 'smooth'});
        });
            
        document.body.appendChild(button);
        
        window.addEventListener("scroll", function(){
            if(window.pageYOffset > HueAPP.settings.backToTopHeight){
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
                        }, index * HueAPP.settings.animation);
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
                
                $(this).height(Math.round(HueAPP._getTotalHeight(felm.children())));     
                
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
        HueAPP.layout.controls();    
        HueAPP.layout.aside_fixed();
        HueAPP.layout.fixed_panel();    
        HueAPP.layout.responsive();

        HueAPP.navigation_detect_auto();
        HueAPP.navigation_quick_build("navigation-quick","rw-");    

        HueAPP.navigation();
        HueAPP.file_tree();        

        HueAPP.header_search();    
        HueAPP._backToTop();
        HueAPP._rwProgress();
        HueAPP._rwAccordion();

        HueAPP.sessionSaver();
    }, 
    specialFunction: {
        validateEmail: function(email) {
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(email).toLowerCase());
        },
        validatePhone: function(tel) {
            var parcalanmisTel = tel.split("");
            if (/[\+905]{4}[0-9]{9}/.test(tel)) {
                if (parcalanmisTel[0] == "+" && parcalanmisTel[1] == "9" &&  parcalanmisTel[2] == "0" && parcalanmisTel[3] == "5" && tel.length == 13)
                    return true;
                else
                    return false;
            } else
                return false;
        }
    }
};

window.addEventListener('load',function(){
    HueAPP.run();
    HueAPP.PhilipsHUE.init();
    HueAPP.ajaxBinder();
    window.addEventListener("resize", function(){
        HueAPP.layout.responsive();
        HueAPP._rwCompactGallery.controlHeight();
        
    }, true);
});




/*!
 * jQuery Color Animations v@VERSION
 * https://github.com/jquery/jquery-color
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * Date: @DATE
 */

( function( root, factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( [ "jquery" ], factory );
	} else if ( typeof exports === "object" ) {
		module.exports = factory( require( "jquery" ) );
	} else {
		factory( root.jQuery );
	}
} )( this, function( jQuery, undefined ) {

	var stepHooks = "backgroundColor borderBottomColor borderLeftColor borderRightColor " +
		"borderTopColor color columnRuleColor outlineColor textDecorationColor textEmphasisColor",

	class2type = {},
	toString = class2type.toString,

	// plusequals test for += 100 -= 100
	rplusequals = /^([\-+])=\s*(\d+\.?\d*)/,

	// a set of RE's that can match strings and generate color tuples.
	stringParsers = [ {
			re: /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,
			parse: function( execResult ) {
				return [
					execResult[ 1 ],
					execResult[ 2 ],
					execResult[ 3 ],
					execResult[ 4 ]
				];
			}
		}, {
			re: /rgba?\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,
			parse: function( execResult ) {
				return [
					execResult[ 1 ] * 2.55,
					execResult[ 2 ] * 2.55,
					execResult[ 3 ] * 2.55,
					execResult[ 4 ]
				];
			}
		}, {

			// this regex ignores A-F because it's compared against an already lowercased string
			re: /#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})/,
			parse: function( execResult ) {
				return [
					parseInt( execResult[ 1 ], 16 ),
					parseInt( execResult[ 2 ], 16 ),
					parseInt( execResult[ 3 ], 16 )
				];
			}
		}, {

			// this regex ignores A-F because it's compared against an already lowercased string
			re: /#([a-f0-9])([a-f0-9])([a-f0-9])/,
			parse: function( execResult ) {
				return [
					parseInt( execResult[ 1 ] + execResult[ 1 ], 16 ),
					parseInt( execResult[ 2 ] + execResult[ 2 ], 16 ),
					parseInt( execResult[ 3 ] + execResult[ 3 ], 16 )
				];
			}
		}, {
			re: /hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,
			space: "hsla",
			parse: function( execResult ) {
				return [
					execResult[ 1 ],
					execResult[ 2 ] / 100,
					execResult[ 3 ] / 100,
					execResult[ 4 ]
				];
			}
		} ],

	// jQuery.Color( )
	color = jQuery.Color = function( color, green, blue, alpha ) {
		return new jQuery.Color.fn.parse( color, green, blue, alpha );
	},
	spaces = {
		rgba: {
			props: {
				red: {
					idx: 0,
					type: "byte"
				},
				green: {
					idx: 1,
					type: "byte"
				},
				blue: {
					idx: 2,
					type: "byte"
				}
			}
		},

		hsla: {
			props: {
				hue: {
					idx: 0,
					type: "degrees"
				},
				saturation: {
					idx: 1,
					type: "percent"
				},
				lightness: {
					idx: 2,
					type: "percent"
				}
			}
		}
	},
	propTypes = {
		"byte": {
			floor: true,
			max: 255
		},
		"percent": {
			max: 1
		},
		"degrees": {
			mod: 360,
			floor: true
		}
	},

	// colors = jQuery.Color.names
	colors,

	// local aliases of functions called often
	each = jQuery.each;

// define cache name and alpha properties
// for rgba and hsla spaces
each( spaces, function( spaceName, space ) {
	space.cache = "_" + spaceName;
	space.props.alpha = {
		idx: 3,
		type: "percent",
		def: 1
	};
} );

// Populate the class2type map
jQuery.each( "Boolean Number String Function Array Date RegExp Object Error Symbol".split( " " ),
	function( _i, name ) {
		class2type[ "[object " + name + "]" ] = name.toLowerCase();
	} );

function getType( obj ) {
	if ( obj == null ) {
		return obj + "";
	}

	return typeof obj === "object" ?
		class2type[ toString.call( obj ) ] || "object" :
		typeof obj;
}

function clamp( value, prop, allowEmpty ) {
	var type = propTypes[ prop.type ] || {};

	if ( value == null ) {
		return ( allowEmpty || !prop.def ) ? null : prop.def;
	}

	// ~~ is an short way of doing floor for positive numbers
	value = type.floor ? ~~value : parseFloat( value );

	if ( type.mod ) {

		// we add mod before modding to make sure that negatives values
		// get converted properly: -10 -> 350
		return ( value + type.mod ) % type.mod;
	}

	// for now all property types without mod have min and max
	return Math.min( type.max, Math.max( 0, value ) );
}

function stringParse( string ) {
	var inst = color(),
		rgba = inst._rgba = [];

	string = string.toLowerCase();

	each( stringParsers, function( _i, parser ) {
		var parsed,
			match = parser.re.exec( string ),
			values = match && parser.parse( match ),
			spaceName = parser.space || "rgba";

		if ( values ) {
			parsed = inst[ spaceName ]( values );

			// if this was an rgba parse the assignment might happen twice
			// oh well....
			inst[ spaces[ spaceName ].cache ] = parsed[ spaces[ spaceName ].cache ];
			rgba = inst._rgba = parsed._rgba;

			// exit each( stringParsers ) here because we matched
			return false;
		}
	} );

	// Found a stringParser that handled it
	if ( rgba.length ) {

		// if this came from a parsed string, force "transparent" when alpha is 0
		// chrome, (and maybe others) return "transparent" as rgba(0,0,0,0)
		if ( rgba.join() === "0,0,0,0" ) {
			jQuery.extend( rgba, colors.transparent );
		}
		return inst;
	}

	// named colors
	return colors[ string ];
}

color.fn = jQuery.extend( color.prototype, {
	parse: function( red, green, blue, alpha ) {
		if ( red === undefined ) {
			this._rgba = [ null, null, null, null ];
			return this;
		}
		if ( red.jquery || red.nodeType ) {
			red = jQuery( red ).css( green );
			green = undefined;
		}

		var inst = this,
			type = getType( red ),
			rgba = this._rgba = [];

		// more than 1 argument specified - assume ( red, green, blue, alpha )
		if ( green !== undefined ) {
			red = [ red, green, blue, alpha ];
			type = "array";
		}

		if ( type === "string" ) {
			return this.parse( stringParse( red ) || colors._default );
		}

		if ( type === "array" ) {
			each( spaces.rgba.props, function( _key, prop ) {
				rgba[ prop.idx ] = clamp( red[ prop.idx ], prop );
			} );
			return this;
		}

		if ( type === "object" ) {
			if ( red instanceof color ) {
				each( spaces, function( _spaceName, space ) {
					if ( red[ space.cache ] ) {
						inst[ space.cache ] = red[ space.cache ].slice();
					}
				} );
			} else {
				each( spaces, function( _spaceName, space ) {
					var cache = space.cache;
					each( space.props, function( key, prop ) {

						// if the cache doesn't exist, and we know how to convert
						if ( !inst[ cache ] && space.to ) {

							// if the value was null, we don't need to copy it
							// if the key was alpha, we don't need to copy it either
							if ( key === "alpha" || red[ key ] == null ) {
								return;
							}
							inst[ cache ] = space.to( inst._rgba );
						}

						// this is the only case where we allow nulls for ALL properties.
						// call clamp with alwaysAllowEmpty
						inst[ cache ][ prop.idx ] = clamp( red[ key ], prop, true );
					} );

					// everything defined but alpha?
					if ( inst[ cache ] && jQuery.inArray( null, inst[ cache ].slice( 0, 3 ) ) < 0 ) {

						// use the default of 1
						if ( inst[ cache ][ 3 ] == null ) {
							inst[ cache ][ 3 ] = 1;
						}

						if ( space.from ) {
							inst._rgba = space.from( inst[ cache ] );
						}
					}
				} );
			}
			return this;
		}
	},
	is: function( compare ) {
		var is = color( compare ),
			same = true,
			inst = this;

		each( spaces, function( _, space ) {
			var localCache,
				isCache = is[ space.cache ];
			if ( isCache ) {
				localCache = inst[ space.cache ] || space.to && space.to( inst._rgba ) || [];
				each( space.props, function( _, prop ) {
					if ( isCache[ prop.idx ] != null ) {
						same = ( isCache[ prop.idx ] === localCache[ prop.idx ] );
						return same;
					}
				} );
			}
			return same;
		} );
		return same;
	},
	_space: function() {
		var used = [],
			inst = this;
		each( spaces, function( spaceName, space ) {
			if ( inst[ space.cache ] ) {
				used.push( spaceName );
			}
		} );
		return used.pop();
	},
	transition: function( other, distance ) {
		var end = color( other ),
			spaceName = end._space(),
			space = spaces[ spaceName ],
			startColor = this.alpha() === 0 ? color( "transparent" ) : this,
			start = startColor[ space.cache ] || space.to( startColor._rgba ),
			result = start.slice();

		end = end[ space.cache ];
		each( space.props, function( _key, prop ) {
			var index = prop.idx,
				startValue = start[ index ],
				endValue = end[ index ],
				type = propTypes[ prop.type ] || {};

			// if null, don't override start value
			if ( endValue === null ) {
				return;
			}

			// if null - use end
			if ( startValue === null ) {
				result[ index ] = endValue;
			} else {
				if ( type.mod ) {
					if ( endValue - startValue > type.mod / 2 ) {
						startValue += type.mod;
					} else if ( startValue - endValue > type.mod / 2 ) {
						startValue -= type.mod;
					}
				}
				result[ index ] = clamp( ( endValue - startValue ) * distance + startValue, prop );
			}
		} );
		return this[ spaceName ]( result );
	},
	blend: function( opaque ) {

		// if we are already opaque - return ourself
		if ( this._rgba[ 3 ] === 1 ) {
			return this;
		}

		var rgb = this._rgba.slice(),
			a = rgb.pop(),
			blend = color( opaque )._rgba;

		return color( jQuery.map( rgb, function( v, i ) {
			return ( 1 - a ) * blend[ i ] + a * v;
		} ) );
	},
	toRgbaString: function() {
		var prefix = "rgba(",
			rgba = jQuery.map( this._rgba, function( v, i ) {
                if ( v != null ) {
                    return v;
                }
				return i > 2 ? 1 : 0;
			} );

		if ( rgba[ 3 ] === 1 ) {
			rgba.pop();
			prefix = "rgb(";
		}

		return prefix + rgba.join() + ")";
	},
	toHslaString: function() {
		var prefix = "hsla(",
			hsla = jQuery.map( this.hsla(), function( v, i ) {
				if ( v == null ) {
					v = i > 2 ? 1 : 0;
				}

				// catch 1 and 2
				if ( i && i < 3 ) {
					v = Math.round( v * 100 ) + "%";
				}
				return v;
			} );

		if ( hsla[ 3 ] === 1 ) {
			hsla.pop();
			prefix = "hsl(";
		}
		return prefix + hsla.join() + ")";
	},
	toHexString: function( includeAlpha ) {
		var rgba = this._rgba.slice(),
			alpha = rgba.pop();

		if ( includeAlpha ) {
			rgba.push( ~~( alpha * 255 ) );
		}

		return "#" + jQuery.map( rgba, function( v ) {

			// default to 0 when nulls exist
			return ( "0" + ( v || 0 ).toString( 16 ) ).substr( -2 );
		} ).join( "" );
	},
	toString: function() {
		return this._rgba[ 3 ] === 0 ? "transparent" : this.toRgbaString();
	}
} );
color.fn.parse.prototype = color.fn;

// hsla conversions adapted from:
// https://code.google.com/p/maashaack/source/browse/packages/graphics/trunk/src/graphics/colors/HUE2RGB.as?r=5021

function hue2rgb( p, q, h ) {
	h = ( h + 1 ) % 1;
	if ( h * 6 < 1 ) {
		return p + ( q - p ) * h * 6;
	}
	if ( h * 2 < 1 ) {
		return q;
	}
	if ( h * 3 < 2 ) {
		return p + ( q - p ) * ( ( 2 / 3 ) - h ) * 6;
	}
	return p;
}

spaces.hsla.to = function( rgba ) {
	if ( rgba[ 0 ] == null || rgba[ 1 ] == null || rgba[ 2 ] == null ) {
		return [ null, null, null, rgba[ 3 ] ];
	}
	var r = rgba[ 0 ] / 255,
		g = rgba[ 1 ] / 255,
		b = rgba[ 2 ] / 255,
		a = rgba[ 3 ],
		max = Math.max( r, g, b ),
		min = Math.min( r, g, b ),
		diff = max - min,
		add = max + min,
		l = add * 0.5,
		h, s;

	if ( min === max ) {
		h = 0;
	} else if ( r === max ) {
		h = ( 60 * ( g - b ) / diff ) + 360;
	} else if ( g === max ) {
		h = ( 60 * ( b - r ) / diff ) + 120;
	} else {
		h = ( 60 * ( r - g ) / diff ) + 240;
	}

	// chroma (diff) == 0 means greyscale which, by definition, saturation = 0%
	// otherwise, saturation is based on the ratio of chroma (diff) to lightness (add)
	if ( diff === 0 ) {
		s = 0;
	} else if ( l <= 0.5 ) {
		s = diff / add;
	} else {
		s = diff / ( 2 - add );
	}
	return [ Math.round( h ) % 360, s, l, a == null ? 1 : a ];
};

spaces.hsla.from = function( hsla ) {
	if ( hsla[ 0 ] == null || hsla[ 1 ] == null || hsla[ 2 ] == null ) {
		return [ null, null, null, hsla[ 3 ] ];
	}
	var h = hsla[ 0 ] / 360,
		s = hsla[ 1 ],
		l = hsla[ 2 ],
		a = hsla[ 3 ],
		q = l <= 0.5 ? l * ( 1 + s ) : l + s - l * s,
		p = 2 * l - q;

	return [
		Math.round( hue2rgb( p, q, h + ( 1 / 3 ) ) * 255 ),
		Math.round( hue2rgb( p, q, h ) * 255 ),
		Math.round( hue2rgb( p, q, h - ( 1 / 3 ) ) * 255 ),
		a
	];
};


each( spaces, function( spaceName, space ) {
	var props = space.props,
		cache = space.cache,
		to = space.to,
		from = space.from;

	// makes rgba() and hsla()
	color.fn[ spaceName ] = function( value ) {

		// generate a cache for this space if it doesn't exist
		if ( to && !this[ cache ] ) {
			this[ cache ] = to( this._rgba );
		}
		if ( value === undefined ) {
			return this[ cache ].slice();
		}

		var ret,
			type = getType( value ),
			arr = ( type === "array" || type === "object" ) ? value : arguments,
			local = this[ cache ].slice();

		each( props, function( key, prop ) {
			var val = arr[ type === "object" ? key : prop.idx ];
			if ( val == null ) {
				val = local[ prop.idx ];
			}
			local[ prop.idx ] = clamp( val, prop );
		} );

		if ( from ) {
			ret = color( from( local ) );
			ret[ cache ] = local;
			return ret;
		} else {
			return color( local );
		}
	};

	// makes red() green() blue() alpha() hue() saturation() lightness()
	each( props, function( key, prop ) {

		// alpha is included in more than one space
		if ( color.fn[ key ] ) {
			return;
		}
		color.fn[ key ] = function( value ) {
			var local, cur, match, fn,
				vtype = getType( value );

			if ( key === "alpha" ) {
				fn = this._hsla ? "hsla" : "rgba";
			} else {
				fn = spaceName;
			}
			local = this[ fn ]();
			cur = local[ prop.idx ];

			if ( vtype === "undefined" ) {
				return cur;
			}

			if ( vtype === "function" ) {
				value = value.call( this, cur );
				vtype = getType( value );
			}
			if ( value == null && prop.empty ) {
				return this;
			}
			if ( vtype === "string" ) {
				match = rplusequals.exec( value );
				if ( match ) {
					value = cur + parseFloat( match[ 2 ] ) * ( match[ 1 ] === "+" ? 1 : -1 );
				}
			}
			local[ prop.idx ] = value;
			return this[ fn ]( local );
		};
	} );
} );

// add cssHook and .fx.step function for each named hook.
// accept a space separated string of properties
color.hook = function( hook ) {
	var hooks = hook.split( " " );
	each( hooks, function( _i, hook ) {
		jQuery.cssHooks[ hook ] = {
			set: function( elem, value ) {
				var parsed;

				if ( value !== "transparent" && ( getType( value ) !== "string" || ( parsed = stringParse( value ) ) ) ) {
					value = color( parsed || value );
					value = value.toRgbaString();
				}
				elem.style[ hook ] = value;
			}
		};
		jQuery.fx.step[ hook ] = function( fx ) {
			if ( !fx.colorInit ) {
				fx.start = color( fx.elem, hook );
				fx.end = color( fx.end );
				fx.colorInit = true;
			}
			jQuery.cssHooks[ hook ].set( fx.elem, fx.start.transition( fx.end, fx.pos ) );
		};
	} );

};

color.hook( stepHooks );

jQuery.cssHooks.borderColor = {
	expand: function( value ) {
		var expanded = {};

		each( [ "Top", "Right", "Bottom", "Left" ], function( _i, part ) {
			expanded[ "border" + part + "Color" ] = value;
		} );
		return expanded;
	}
};

// Basic color names only.
// Usage of any of the other color names requires adding yourself or including
// jquery.color.svg-names.js.
colors = jQuery.Color.names = {

	// 4.1. Basic color keywords
	aqua: "#00ffff",
	black: "#000000",
	blue: "#0000ff",
	fuchsia: "#ff00ff",
	gray: "#808080",
	green: "#008000",
	lime: "#00ff00",
	maroon: "#800000",
	navy: "#000080",
	olive: "#808000",
	purple: "#800080",
	red: "#ff0000",
	silver: "#c0c0c0",
	teal: "#008080",
	white: "#ffffff",
	yellow: "#ffff00",

	// 4.2.3. "transparent" color keyword
	transparent: [ null, null, null, 0 ],

	_default: "#ffffff"
};

} );