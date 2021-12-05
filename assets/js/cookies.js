(function(cookies) {
	if (cookies.hasInitialised) return;

	var util = {

		escapeRegExp: function(str) {
			return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
		},

		hasClass: function(element, selector) {
			var s = ' ';
			return element.nodeType === 1 &&
			(s + element.className + s).replace(/[\n\t]/g, s).indexOf(s + selector + s) >= 0;
		},

		addClass: function(element, className) {
			element.className += ' ' + className;
		},

		removeClass: function(element, className) {
			var regex = new RegExp('\\b' + this.escapeRegExp(className) + '\\b');
			element.className = element.className.replace(regex, '');
		},

		interpolateString: function(str, callback) {
			var marker = /{{([a-z][a-z0-9\-_]*)}}/ig;
			return str.replace(marker, function(matches) {
				return callback(arguments[1]) || '';
			})
		},

		getCookie: function(name) {
			var value = '; ' + document.cookie;
			var parts = value.split('; ' + name + '=');
			return parts.length != 2 ?
			undefined : parts.pop().split(';').shift();
		},

		setCookie: function(name, value, expiryDays, domain, path) {
			var exdate = new Date();
			exdate.setDate(exdate.getDate() + (expiryDays || 365));

			var cookie = [
			name + '=' + value,
			'expires=' + exdate.toUTCString(),
			'path=' + (path || '/')
			];

			if (domain) {
				cookie.push('domain=' + domain);
			}
			document.cookie = cookie.join(';');
		},

		deepExtend: function(target, source) {
			for (var prop in source) {
				if (source.hasOwnProperty(prop)) {
					if (prop in target && this.isPlainObject(target[prop]) && this.isPlainObject(source[prop])) {
						this.deepExtend(target[prop], source[prop]);
					} else {
						target[prop] = source[prop];
					}
				}
			}
			return target;
		},

		throttle: function(callback, limit) {
			var wait = false;
			return function() {
				if (!wait) {
					callback.apply(this, arguments);
					wait = true;
					setTimeout(function() {
						wait = false;
					}, limit);
				}
			}
		},

		hash: function(str) {
			var hash = 0,
			i, chr, len;
			if (str.length === 0) return hash;
			for (i = 0, len = str.length; i < len; ++i) {
				chr = str.charCodeAt(i);
				hash = ((hash << 5) - hash) + chr;
				hash |= 0;
			}
			return hash;
		},

		normaliseHex: function(hex) {
			if (hex[0] == '#') {
				hex = hex.substr(1);
			}
			if (hex.length == 3) {
				hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
			}
			return hex;
		},

		getContrast: function(hex) {
			hex = this.normaliseHex(hex);
			var r = parseInt(hex.substr(0, 2), 16);
			var g = parseInt(hex.substr(2, 2), 16);
			var b = parseInt(hex.substr(4, 2), 16);
			var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
			return (yiq >= 128) ? '#000' : '#fff';
		},

		getLuminance: function(hex) {
			var num = parseInt(this.normaliseHex(hex), 16), 
			amt = 38,
			R = (num >> 16) + amt,
			B = (num >> 8 & 0x00FF) + amt,
			G = (num & 0x0000FF) + amt;
			var newColour = (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255)).toString(16).slice(1);
			return '#'+newColour;
		},

		isMobile: function() {
			return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
		},

		isPlainObject: function(obj) {
			return typeof obj === 'object' && obj !== null && obj.constructor == Object;
		},
	};

	cookies.status = {
		deny: 'deny',
		allow: 'allow',
		dismiss: 'dismiss'
	};

	cookies.transitionEnd = (function() {
		var el = document.createElement('div');
		var trans = {
			t: "transitionend",
			OT: "oTransitionEnd",
			msT: "MSTransitionEnd",
			MozT: "transitionend",
			WebkitT: "webkitTransitionEnd",
		};

		for (var prefix in trans) {
			if (trans.hasOwnProperty(prefix) && typeof el.style[prefix + 'ransition'] != 'undefined') {
				return trans[prefix];
			}
		}
		return '';
	}());

	cookies.hasTransition = !!cookies.transitionEnd;

	var __allowedStatuses = Object.keys(cookies.status).map(util.escapeRegExp);

	cookies.customStyles = {};
	cookies.Popup = (function() {

		var defaultOptions = {

			enabled: true,
			container: null,

			cookie: {
				
				name: 'cookieconsent_status',
				path: '/',
				domain: '',
				expiryDays: 365,
			},

			onPopupOpen: function() {},
			onPopupClose: function() {},
			onInitialise: function(status) {},
			onStatusChange: function(status, chosenBefore) {},
			onRevokeChoice: function() {},

			content: {
				header: 'Cookies used on the website!',
				message: 'This website uses cookies to ensure you get the best experience on our website.',
				dismiss: 'Got it!',
				allow: 'Allow cookies',
				deny: 'Decline',
				link: 'Learn more',
				href: 'http://cookiesandyou.com',
				close: '&#x274c;',
				revoke: 'Cookies',
			},

			elements: {
				header: '<span class="cookies-header">{{header}}</span>&nbsp;',
				message: '<span id="cookieconsent:desc" class="cookies-message">{{message}}</span>',
				messagelink: '<span id="cookieconsent:desc" class="cookies-message">{{message}} <a aria-label="learn more about cookies" role=button tabindex="0" class="cookies-link" href="{{href}}" target="_blank">{{link}}</a></span>',
				dismiss: '<a aria-label="dismiss cookie message" role=button tabindex="0" class="cookies-btn cookies-dismiss">{{dismiss}}</a>',
				allow: '<a aria-label="allow cookies" role=button tabindex="0"  class="cookies-btn cookies-allow">{{allow}}</a>',
				deny: '<a aria-label="deny cookies" role=button tabindex="0" class="cookies-btn cookies-deny">{{deny}}</a>',
				link: '<a aria-label="learn more about cookies" role=button tabindex="0" class="cookies-link" href="{{href}}" target="_blank">{{link}}</a>',
				close: '<span aria-label="dismiss cookie message" role=button tabindex="0" class="cookies-close">{{close}}</span>',

			},
			window: '<div role="dialog" aria-live="polite" aria-label="cookieconsent" aria-describedby="cookieconsent:desc" class="cookies-window {{classes}}"><!--googleoff: all-->{{children}}<!--googleon: all--></div>',
			revokeBtn: '<div class="cookies-revoke {{classes}}">{{revoke}}</div>',

			compliance: {
				'info': '<div class="cookies-compliance">{{dismiss}}</div>',
				'opt-in': '<div class="cookies-compliance cookies-highlight">{{dismiss}}{{allow}}</div>',
				'opt-out': '<div class="cookies-compliance cookies-highlight">{{deny}}{{dismiss}}</div>',
			},

			type: 'info',
			layouts: {
				'basic': '{{messagelink}}{{compliance}}',
				'basic-close': '{{messagelink}}{{compliance}}{{close}}',
				'basic-header': '{{header}}{{message}}{{link}}{{compliance}}',
			},

			layout: 'basic',
			position: 'bottom',
			theme: 'block',
			static: false,
			palette: null,
			revokable: false,
			animateRevokable: true,
			showLink: true,
			dismissOnScroll: false,
			dismissOnTimeout: false,
			autoOpen: true,
			autoAttach: true,
			whitelistPage: [],
			blacklistPage: [],
			overrideHTML: null,
		};

		function CookiePopup() {
			this.initialise.apply(this, arguments);
		}

		CookiePopup.prototype.initialise = function(options) {
			if (this.options) {
				this.destroy();
			}

			util.deepExtend(this.options = {}, defaultOptions);

			if (util.isPlainObject(options)) {
				util.deepExtend(this.options, options);
			}

			if (checkCallbackHooks.call(this)) {
				this.options.enabled = false;
			}

			if (arrayContainsMatches(this.options.blacklistPage, location.pathname)) {
				this.options.enabled = false;
			}
			if (arrayContainsMatches(this.options.whitelistPage, location.pathname)) {
				this.options.enabled = true;
			}

			var cookiePopup = this.options.window
			.replace('{{classes}}', getPopupClasses.call(this).join(' '))
			.replace('{{children}}', getPopupInnerMarkup.call(this));

			var customHTML = this.options.overrideHTML;
			if (typeof customHTML == 'string' && customHTML.length) {
				cookiePopup = customHTML;
			}

			if (this.options.static) {
				var wrapper = appendMarkup.call(this, '<div class="cookies-grower">' + cookiePopup + '</div>');

				wrapper.style.display = '';
				this.element = wrapper.firstChild;
				this.element.style.display = 'none';
				util.addClass(this.element, 'cookies-invisible');
			} else {
				this.element = appendMarkup.call(this, cookiePopup);
			}

			applyAutoDismiss.call(this);

			applyRevokeButton.call(this);

			if (this.options.autoOpen) {
				this.autoOpen();
			}
		};

		CookiePopup.prototype.destroy = function() {
			if (this.onButtonClick && this.element) {
				this.element.removeEventListener('click', this.onButtonClick);
				this.onButtonClick = null;
			}

			if (this.dismissTimeout) {
				clearTimeout(this.dismissTimeout);
				this.dismissTimeout = null;
			}

			if (this.onWindowScroll) {
				window.removeEventListener('scroll', this.onWindowScroll);
				this.onWindowScroll = null;
			}

			if (this.onMouseMove) {
				window.removeEventListener('mousemove', this.onMouseMove);
				this.onMouseMove = null;
			}

			if (this.element && this.element.parentNode) {
				this.element.parentNode.removeChild(this.element);
			}
			this.element = null;

			if (this.revokeBtn && this.revokeBtn.parentNode) {
				this.revokeBtn.parentNode.removeChild(this.revokeBtn);
			}
			this.revokeBtn = null;

			removeCustomStyle(this.options.palette);
			this.options = null;
		};

		CookiePopup.prototype.open = function(callback) {
			if (!this.element) return;

			if (!this.isOpen()) {
				if (cookies.hasTransition) {
					this.fadeIn();
				} else {
					this.element.style.display = '';
				}

				if (this.options.revokable) {
					this.toggleRevokeButton();
				}
				this.options.onPopupOpen.call(this);
			}

			return this;
		};

		CookiePopup.prototype.close = function(showRevoke) {
			if (!this.element) return;

			if (this.isOpen()) {
				if (cookies.hasTransition) {
					this.fadeOut();
				} else {
					this.element.style.display = 'none';
				}

				if (showRevoke && this.options.revokable) {
					this.toggleRevokeButton(true);
				}
				this.options.onPopupClose.call(this);
			}

			return this;
		};

		CookiePopup.prototype.fadeIn = function() {
			var el = this.element;

			if (!cookies.hasTransition || !el)
				return;

			if (this.afterTransition) {
				afterFadeOut.call(this, el)
			}

			if (util.hasClass(el, 'cookies-invisible')) {
				el.style.display = '';

				if (this.options.static) {
					var height = this.element.clientHeight;
					this.element.parentNode.style.maxHeight = height + 'px';
				}

				var fadeInTimeout = 20;

				this.openingTimeout = setTimeout(afterFadeIn.bind(this, el), fadeInTimeout);
			}
		};

		CookiePopup.prototype.fadeOut = function() {
			var el = this.element;

			if (!cookies.hasTransition || !el)
				return;

			if (this.openingTimeout) {
				clearTimeout(this.openingTimeout);
				afterFadeIn.bind(this, el);
			}

			if (!util.hasClass(el, 'cookies-invisible')) {
				if (this.options.static) {
					this.element.parentNode.style.maxHeight = '';
				}

				this.afterTransition = afterFadeOut.bind(this, el);
				el.addEventListener(cookies.transitionEnd, this.afterTransition);

				util.addClass(el, 'cookies-invisible');
			}
		};

		CookiePopup.prototype.isOpen = function() {
			return this.element && this.element.style.display == '' && (cookies.hasTransition ? !util.hasClass(this.element, 'cookies-invisible') : true);
		};

		CookiePopup.prototype.toggleRevokeButton = function(show) {
			if (this.revokeBtn) this.revokeBtn.style.display = show ? '' : 'none';
		};

		CookiePopup.prototype.revokeChoice = function(preventOpen) {
			this.options.enabled = true;
			this.clearStatus();

			this.options.onRevokeChoice.call(this);

			if (!preventOpen) {
				this.autoOpen();
			}
		};

		CookiePopup.prototype.hasAnswered = function(options) {
			return Object.keys(cookies.status).indexOf(this.getStatus()) >= 0;
		};

		CookiePopup.prototype.hasConsented = function(options) {
			var val = this.getStatus();
			return val == cookies.status.allow || val == cookies.status.dismiss;
		};

		CookiePopup.prototype.autoOpen = function(options) {
			!this.hasAnswered() && this.options.enabled && this.open();
		};

		CookiePopup.prototype.setStatus = function(status) {
			var c = this.options.cookie;
			var value = util.getCookie(c.name);
			var chosenBefore = Object.keys(cookies.status).indexOf(value) >= 0;

			if (Object.keys(cookies.status).indexOf(status) >= 0) {
				util.setCookie(c.name, status, c.expiryDays, c.domain, c.path);

				this.options.onStatusChange.call(this, status, chosenBefore);
			} else {
				this.clearStatus();
			}
		};

		CookiePopup.prototype.getStatus = function() {
			return util.getCookie(this.options.cookie.name);
		};

		CookiePopup.prototype.clearStatus = function() {
			var c = this.options.cookie;
			util.setCookie(c.name, '', -1, c.domain, c.path);
		};

		function afterFadeIn(el) {
			this.openingTimeout = null;
			util.removeClass(el, 'cookies-invisible');
		}

		function afterFadeOut(el) {
			el.style.display = 'none';
			el.removeEventListener(cookies.transitionEnd, this.afterTransition);
			this.afterTransition = null;
		}

		function checkCallbackHooks() {
			var complete = this.options.onInitialise.bind(this);

			if (!window.navigator.cookieEnabled) {
				complete(cookies.status.deny);
				return true;
			}

			if (window.CookiesOK || window.navigator.CookiesOK) {
				complete(cookies.status.allow);
				return true;
			}

			var allowed = Object.keys(cookies.status);
			var answer = this.getStatus();
			var match = allowed.indexOf(answer) >= 0;

			if (match) {
				complete(answer);
			}
			return match;
		}

		function getPositionClasses() {
			var positions = this.options.position.split('-');
			var classes = [];

			positions.forEach(function(cur) {
				classes.push('cookies-' + cur);
			});

			return classes;
		}

		function getPopupClasses() {
			var opts = this.options;
			var positionStyle = (opts.position == 'top' || opts.position == 'bottom') ? 'banner' : 'floating';

			if (util.isMobile()) {
				positionStyle = 'floating';
			}

			var classes = [
				'cookies-' + positionStyle,
				'cookies-type-' + opts.type,
				'cookies-theme-' + opts.theme,
				];

				if (opts.static) {
					classes.push('cookies-static');
				}

				classes.push.apply(classes, getPositionClasses.call(this));

			var didAttach = attachCustomPalette.call(this, this.options.palette);

			if (this.customStyleSelector) {
				classes.push(this.customStyleSelector);
			}

			return classes;
		}

		function getPopupInnerMarkup() {
			var interpolated = {};
			var opts = this.options;

			if (!opts.showLink) {
				opts.elements.link = '';
				opts.elements.messagelink = opts.elements.message;
			}

			Object.keys(opts.elements).forEach(function(prop) {
				interpolated[prop] = util.interpolateString(opts.elements[prop], function(name) {
					var str = opts.content[name];
					return (name && typeof str == 'string' && str.length) ? str : '';
				})
			});

			var complianceType = opts.compliance[opts.type];
			if (!complianceType) {
				complianceType = opts.compliance.info;
			}

			interpolated.compliance = util.interpolateString(complianceType, function(name) {
				return interpolated[name];
			});

			var layout = opts.layouts[opts.layout];
			if (!layout) {
				layout = opts.layouts.basic;
			}

			return util.interpolateString(layout, function(match) {
				return interpolated[match];
			});
		}

		function appendMarkup(markup) {
			var opts = this.options;
			var div = document.createElement('div');
			var cont = (opts.container && opts.container.nodeType === 1) ? opts.container : document.body;

			div.innerHTML = markup;

			var el = div.children[0];

			el.style.display = 'none';

			if (util.hasClass(el, 'cookies-window') && cookies.hasTransition) {
				util.addClass(el, 'cookies-invisible');
			}

			this.onButtonClick = handleButtonClick.bind(this);

			el.addEventListener('click', this.onButtonClick);

			if (opts.autoAttach) {
				if (!cont.firstChild) {
					cont.appendChild(el);
				} else {
					cont.insertBefore(el, cont.firstChild)
				}
			}

			return el;
		}

		function handleButtonClick(event) {
			var targ = event.target;
			if (util.hasClass(targ, 'cookies-btn')) {

				var matches = targ.className.match(new RegExp("\\bcookies-(" + __allowedStatuses.join('|') + ")\\b"));
				var match = (matches && matches[1]) || false;

				if (match) {
					this.setStatus(match);
					this.close(true);
				}
			}
			if (util.hasClass(targ, 'cookies-close')) {
				this.setStatus(cookies.status.dismiss);
				this.close(true);
			}
			if (util.hasClass(targ, 'cookies-revoke')) {
				this.revokeChoice();
			}
		}

		function attachCustomPalette(palette) {
			var hash = util.hash(JSON.stringify(palette));
			var selector = 'cookies-color-override-' + hash;
			var isValid = util.isPlainObject(palette);

			this.customStyleSelector = isValid ? selector : null;

			if (isValid) {
				addCustomStyle(hash, palette, '.' + selector);
			}
			return isValid;
		}

		function addCustomStyle(hash, palette, prefix) {
		
			if (cookies.customStyles[hash]) {
				++cookies.customStyles[hash].references;
				return;
			}

			var colorStyles = {};
			var popup = palette.popup;
			var button = palette.button;
			var highlight = palette.highlight;

			if (popup) {
				popup.text = popup.text ? popup.text : util.getContrast(popup.background);
				popup.link = popup.link ? popup.link : popup.text;
				colorStyles[prefix + '.cookies-window'] = [
				'color: ' + popup.text,
				'background-color: ' + popup.background
				];
				colorStyles[prefix + '.cookies-revoke'] = [
				'color: ' + popup.text,
				'background-color: ' + popup.background
				];
				colorStyles[prefix + ' .cookies-link,' + prefix + ' .cookies-link:active,' + prefix + ' .cookies-link:visited'] = [
				'color: ' + popup.link
				];

				if (button) {
				
					button.text = button.text ? button.text : util.getContrast(button.background);
					button.border = button.border ? button.border : 'transparent';
					colorStyles[prefix + ' .cookies-btn'] = [
					'color: ' + button.text,
					'border-color: ' + button.border,
					'background-color: ' + button.background
					];
					
					if(button.background != 'transparent') 
						colorStyles[prefix + ' .cookies-btn:hover, ' + prefix + ' .cookies-btn:focus'] = [
					'background-color: ' + getHoverColour(button.background)
					];

					if (highlight) {
					
						highlight.text = highlight.text ? highlight.text : util.getContrast(highlight.background);
						highlight.border = highlight.border ? highlight.border : 'transparent';
						colorStyles[prefix + ' .cookies-highlight .cookies-btn:first-child'] = [
						'color: ' + highlight.text,
						'border-color: ' + highlight.border,
						'background-color: ' + highlight.background
						];
					} else {
						colorStyles[prefix + ' .cookies-highlight .cookies-btn:first-child'] = [
						'color: ' + popup.text
						];
					}
				}

			}

		
			var style = document.createElement('style');
			document.head.appendChild(style);

			cookies.customStyles[hash] = {
				references: 1,
				element: style.sheet
			};

			var ruleIndex = -1;
			for (var prop in colorStyles) {
				if (colorStyles.hasOwnProperty(prop)) {
					style.sheet.insertRule(prop + '{' + colorStyles[prop].join(';') + '}', ++ruleIndex);
				}
			}
		}

		function getHoverColour(hex) {
			hex = util.normaliseHex(hex);

			if (hex == '000000') {
				return '#222';
			}
			return util.getLuminance(hex);
		}

		function removeCustomStyle(palette) {
			if (util.isPlainObject(palette)) {
				var hash = util.hash(JSON.stringify(palette));
				var customStyle = cookies.customStyles[hash];
				if (customStyle && !--customStyle.references) {
					var styleNode = customStyle.element.ownerNode;
					if (styleNode && styleNode.parentNode) {
						styleNode.parentNode.removeChild(styleNode);
					}
					cookies.customStyles[hash] = null;
				}
			}
		}

		function arrayContainsMatches(array, search) {
			for (var i = 0, l = array.length; i < l; ++i) {
				var str = array[i];
				if ((str instanceof RegExp && str.test(search)) ||
					(typeof str == 'string' && str.length && str === search)) {
					return true;
			}
		}
		return false;
	}

	function applyAutoDismiss() {
		var setStatus = this.setStatus.bind(this);

		var delay = this.options.dismissOnTimeout;
		if (typeof delay == 'number' && delay >= 0) {
			this.dismissTimeout = window.setTimeout(function() {
				setStatus(cookies.status.dismiss);
			}, Math.floor(delay));
		}

		var scrollRange = this.options.dismissOnScroll;
		if (typeof scrollRange == 'number' && scrollRange >= 0) {
			var onWindowScroll = function(evt) {
				if (window.pageYOffset > Math.floor(scrollRange)) {
					setStatus(cookies.status.dismiss);

					window.removeEventListener('scroll', onWindowScroll);
					this.onWindowScroll = null;
				}
			};

			this.onWindowScroll = onWindowScroll;
			window.addEventListener('scroll', onWindowScroll);
		}
	}

	function applyRevokeButton() {

			if (this.options.type != 'info') this.options.revokable = true;
			if (util.isMobile()) this.options.animateRevokable = false;

			if (this.options.revokable) {
				var classes = getPositionClasses.call(this);
				if (this.options.animateRevokable) {
					classes.push('cookies-animate');
				}
				if (this.customStyleSelector) {
					classes.push(this.customStyleSelector)
				}
				var revokeBtn = this.options.revokeBtn.replace('{{classes}}', classes.join(' '));
				this.revokeBtn = appendMarkup.call(this, revokeBtn);

				var btn = this.revokeBtn;
				if (this.options.animateRevokable) {
					var wait = false;
					var onMouseMove = util.throttle(function(evt) {
						var active = false;
						var minY = 20;
						var maxY = (window.innerHeight - 20);

						if (util.hasClass(btn, 'cookies-top') && evt.clientY < minY) active = true;
						if (util.hasClass(btn, 'cookies-bottom') && evt.clientY > maxY) active = true;

						if (active) {
							if (!util.hasClass(btn, 'cookies-active')) {
								util.addClass(btn, 'cookies-active');
							}
						} else {
							if (util.hasClass(btn, 'cookies-active')) {
								util.removeClass(btn, 'cookies-active');
							}
						}
					}, 200);

					this.onMouseMove = onMouseMove;
					window.addEventListener('mousemove', onMouseMove);
				}
			}
		}

		return CookiePopup
	}());

cookies.Location = (function() {

		
		var defaultOptions = {

			
			timeout: 5000,

			services: [
			'freegeoip',
			'ipinfo',
			'maxmind'
				],

				serviceDefinitions: {

					freegeoip: function() {
						return {
						
						url: '//freegeoip.net/json/?callback={callback}',
						isScript: true, 
						callback: function(done, response) {
							try{
								var json = JSON.parse(response);
								return json.error ? toError(json) : {
									code: json.country_code
								};
							} catch (err) {
								return toError({error: 'Invalid response ('+err+')'});
							}
						}
					}
				},

				ipinfo: function() {
					return {
						
						url: '//ipinfo.io',
						headers: ['Acookiesept: application/json'],
						callback: function(done, response) {
							try{
								var json = JSON.parse(response);
								return json.error ? toError(json) : {
									code: json.country
								};
							} catch (err) {
								return toError({error: 'Invalid response ('+err+')'});
							}
						}
					}
				},

				
				ipinfodb: function(options) {
					return {
						
						url: '//api.ipinfodb.com/v3/ip-country/?key={api_key}&format=json&callback={callback}',
						isScript: true,
						callback: function(done, response) {
							try{
								var json = JSON.parse(response);
								return json.statusCode == 'ERROR' ? toError({error: json.statusMessage}) : {
									code: json.countryCode
								};
							} catch (err) {
								return toError({error: 'Invalid response ('+err+')'});
							}
						}
					}
				},

				maxmind: function() {
					return {
						
						url: '//js.maxmind.com/js/apis/geoip2/v2.1/geoip2.js',
						isScript: true,
						callback: function(done) {
				
							if (!window.geoip2) {
								done(new Error('Unexpected response format. The downloaded script should have exported `geoip2` to the global scope'));
								return;
							}

							geoip2.country(function(location) {
								try {
									done({
										code: location.country.iso_code
									});
								} catch (err) {
									done(toError(err));
								}
							}, function(err) {
								done(toError(err));
							});

					
						}
					}
				},
			},
		};

		function Location(options) {

			util.deepExtend(this.options = {}, defaultOptions);

			if (util.isPlainObject(options)) {
				util.deepExtend(this.options, options);
			}

			this.currentServiceIndex = -1;
		}

		Location.prototype.getNextService = function() {
			var service;

			do {
				service = this.getServiceByIdx(++this.currentServiceIndex);
			} while (this.currentServiceIndex < this.options.services.length && !service);

			return service;
		};

		Location.prototype.getServiceByIdx = function(idx) {
			
			var serviceOption = this.options.services[idx];

			
			if (typeof serviceOption === 'function') {
				var dynamicOpts = serviceOption();
				if (dynamicOpts.name) {
					util.deepExtend(dynamicOpts, this.options.serviceDefinitions[dynamicOpts.name](dynamicOpts));
				}
				return dynamicOpts;
			}

			
			if (typeof serviceOption === 'string') {
				return this.options.serviceDefinitions[serviceOption]();
			}

			
			if (util.isPlainObject(serviceOption)) {
				return this.options.serviceDefinitions[serviceOption.name](serviceOption);
			}

			return null;
		};

		
		Location.prototype.locate = function(complete, error) {
			var service = this.getNextService();

			if (!service) {
				error(new Error('No services to run'));
				return;
			}

			this.callbackComplete = complete;
			this.callbackError = error;

			this.runService(service, this.runNextServiceOnError.bind(this));
		};

		
		Location.prototype.setupUrl = function(service) {
			var serviceOpts = this.getCurrentServiceOpts();
			return service.url.replace(/\{(.*?)\}/g, function(_, param) {
				if (param === 'callback') {
					var tempName = 'callback' + Date.now();
					window[tempName] = function(res) {
						service.__JSONP_DATA = JSON.stringify(res);
					}
					return tempName;
				}
				if (param in serviceOpts.interpolateUrl) {
					return serviceOpts.interpolateUrl[param];
				}
			});
		};

		
		Location.prototype.runService = function(service, complete) {
			var self = this;


			if (!service || !service.url || !service.callback) {
				return;
			}

			
			var requestFunction = service.isScript ? getScript : makeAsyncRequest;

			var url = this.setupUrl(service);

			requestFunction(url, function(xhr) {
				
				var responseText = xhr ? xhr.responseText : '';

				if (service.__JSONP_DATA) {
					responseText = service.__JSONP_DATA;
					delete service.__JSONP_DATA;
				}

				
				self.runServiceCallback.call(self, complete, service, responseText);

			}, this.options.timeout, service.data, service.headers);

			
		};

		
		Location.prototype.runServiceCallback = function(complete, service, responseText) {
			var self = this;
			
			var serviceResultHandler = function (asyncResult) {
				if (!result) {
					self.onServiceResult.call(self, complete, asyncResult)
				}
			};

			var result = service.callback(serviceResultHandler, responseText);

			if (result) {
				this.onServiceResult.call(this, complete, result);
			}
		};

		Location.prototype.onServiceResult = function(complete, result) {
		
			if (result instanceof Error || (result && result.error)) {
				complete.call(this, result, null);
			} else {
				complete.call(this, null, result);
			}
		};


		Location.prototype.runNextServiceOnError = function(err, data) {
			if (err) {
				this.logError(err);

				var nextService = this.getNextService();

				if (nextService) {
					this.runService(nextService, this.runNextServiceOnError.bind(this));
				} else {
					this.completeService.call(this, this.callbackError, new Error('All services failed'));
				}
			} else {
				this.completeService.call(this, this.callbackComplete, data);
			}
		};

		Location.prototype.getCurrentServiceOpts = function() {
			var val = this.options.services[this.currentServiceIndex];

			if (typeof val == 'string') {
				return {name: val};
			}

			if (typeof val == 'function') {
				return val();
			}

			if (util.isPlainObject(val)) {
				return val;
			}

			return {};
		};

		Location.prototype.completeService = function(fn, data) {
			this.currentServiceIndex = -1;

			fn && fn(data);
		};

		Location.prototype.logError = function (err) {
			var idx = this.currentServiceIndex;
			var service = this.getServiceByIdx(idx);

			console.error('The service[' + idx + '] (' + service.url + ') responded with the following error', err);
		};

		function getScript(url, callback, timeout) {
			var timeoutIdx, s = document.createElement('script');

			s.type = 'text/' + (url.type || 'javascript');
			s.src = url.src || url;
			s.async = false;

			s.onreadystatechange = s.onload = function() {
				var state = s.readyState;

				clearTimeout(timeoutIdx);

				if (!callback.done && (!state || /loaded|complete/.test(state))) {
					callback.done = true;
					callback();
					s.onreadystatechange = s.onload = null;
				}
			};

			document.body.appendChild(s);

			
			timeoutIdx = setTimeout(function () {
				callback.done = true;
				callback();
				s.onreadystatechange = s.onload = null;
			}, timeout);
		}

		function makeAsyncRequest(url, onComplete, timeout, postData, requestHeaders) {
			var xhr = new(window.XMLHttpRequest || window.ActiveXObject)('MSXML2.XMLHTTP.3.0');

			xhr.open(postData ? 'POST' : 'GET', url, 1);

			xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
			xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

			if (Array.isArray(requestHeaders)) {
				for (var i = 0, l = requestHeaders.length; i < l; ++i) {
					var split = requestHeaders[i].split(':', 2)
					xhr.setRequestHeader(split[0].replace(/^\s+|\s+$/g, ''), split[1].replace(/^\s+|\s+$/g, ''));
				}
			}

			if (typeof onComplete == 'function') {
				xhr.onreadystatechange = function() {
					if (xhr.readyState > 3) {
						onComplete(xhr);
					}
				};
			}

			xhr.send(postData);
		}

		function toError(obj) {
			return new Error('Error [' + (obj.code || 'UNKNOWN') + ']: ' + obj.error);
		}

		return Location;
	}());

cookies.Law = (function() {

	var defaultOptions = {
		
			regionalLaw: true,
			hasLaw: ['AT', 'BE', 'BG', 'HR', 'CZ', 'CY', 'DK', 'EE', 'FI', 'FR', 'DE', 'EL', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'SK', 'SI', 'ES', 'SE', 'GB', 'UK'],
			revokable: ['HR', 'CY', 'DK', 'EE', 'FR', 'DE', 'LV', 'LT', 'NL', 'PT', 'ES'],
			explicitAction: ['HR', 'IT', 'ES'],
		};

		function Law(options) {
			this.initialise.apply(this, arguments);
		}

		Law.prototype.initialise = function(options) {
			util.deepExtend(this.options = {}, defaultOptions);

			if (util.isPlainObject(options)) {
				util.deepExtend(this.options, options);
			}
		};

		Law.prototype.get = function(countryCode) {
			var opts = this.options;
			return {
				hasLaw: opts.hasLaw.indexOf(countryCode) >= 0,
				revokable: opts.revokable.indexOf(countryCode) >= 0,
				explicitAction: opts.explicitAction.indexOf(countryCode) >= 0,
			};
		};

		Law.prototype.applyLaw = function(options, countryCode) {
			var country = this.get(countryCode);

			if (!country.hasLaw) {

				options.enabled = false;
			}

			if (this.options.regionalLaw) {
				if (country.revokable) {
					options.revokable = true;
				}

				if (country.explicitAction) {
					options.dismissOnScroll = false;
					options.dismissOnTimeout = false;
				}
			}
			return options;
		};

		return Law;
	}());

	
	cookies.initialise = function(options, complete, error) {
		var law = new cookies.Law(options.law);

		if (!complete) complete = function() {};
		if (!error) error = function() {};

		cookies.getCountryCode(options, function(result) {

			delete options.law;
			delete options.location;

			if (result.code) {
				options = law.applyLaw(options, result.code);
			}

			complete(new cookies.Popup(options));
		}, function(err) {
			delete options.law;
			delete options.location;

			error(err, new cookies.Popup(options));
		});
	};

	cookies.getCountryCode = function(options, complete, error) {
		if (options.law && options.law.countryCode) {
			complete({
				code: options.law.countryCode
			});
			return;
		}
		if (options.location) {
			var locator = new cookies.Location(options.location);
			locator.locate(function(serviceResult) {
				complete(serviceResult || {});
			}, error);
			return;
		}
		complete({});
	};

	cookies.utils = util;
	cookies.hasInitialised = true;

	window.cookieconsent = cookies;

}(window.cookieconsent || {}));