/**
 * Plugin: Amazon Like-nav  
 * Author: Morozov Igor (http://www.igormorozov.com)
 * https://github.com/igormorozov/aim
*/
;(function ($, window, document, notDefined) {
	var pluginName = "aim",
		activeRow,
		MOUSE_LOCS_TRACKED = 3,
		mouseLocs = [],
        lastDelayLoc = null,
        activeMouse = false,
        DELAY = 300,
		defaults = {
			closestItem: '',
			activeClass: 'active',
			itemsSelector: '> li',
			dropPosition: 'right',
			delayShow: 0,
			delayHide: 0,
			tolerance: 75,
			setHeight: false,
			click: false,
			containerDropNav: ''
		};

	/* The actual plugin constructor */
	function Plugin (element, options) {
		this.element = element;
		this.options = $.extend( {}, defaults, options );
		this.init();
		
	}

	Plugin.prototype = {
		constructor: Plugin,

		init: function () {
			var element = $(this.element),
				_this = this;

			if(_this.options.click){

				element.on('click', _this.options.itemsSelector, function () {
					
					
					var elemRow = (_this.options.closestItem) ? $(this).closest(_this.options.closestItem) : $(this);
					
					if(elemRow.hasClass(_this.options.activeClass)) {
						_this._hideNav();
					}
					else {
						if($(document).data("imaimopened") && ($(document).data("imaimopened")[0] !== $(_this.element)[0])){
							$($(document).data("imaimopened")).aim('hideNav');
						} 
						clearTimeout(element.data('delayHide'));
						clearTimeout(element.data('delayActivate'));
						_this._activeRow(elemRow);
						$(document).on('click.aim', {elem: elemRow}, $.proxy( _this._hideClick, _this ));
					}
	

					return false;
				});
			}
			else {
				element.on('mouseenter', _this.options.itemsSelector, function () {
					var elemRow = (_this.options.closestItem) ? $(this).closest(_this.options.closestItem) : $(this);
	
					clearTimeout(element.data('delayHide'));
					clearTimeout(element.data('delayActivate'));
					_this._checkActivate(elemRow);
				});
				
				element.on('mouseleave', _this.options.itemsSelector, function () {
					var elemRow = (_this.options.closestItem) ? $(this).closest(_this.options.closestItem) : $(this);
					clearTimeout(element.data('delayHide'));
					clearTimeout(element.data('delayActivate'));
	
					element.data('delayHide', setTimeout(function () {
						_this._hideNav();
					}, _this.options.delayHide));
	
				});
				
				element.on({
					mouseenter: function () {
						if(!activeMouse){
							activeMouse = true;
							$(document).on('mousemove.aim', _this._mouseMove);		
						}
					},
					mouseleave: function () {
						
						if(activeMouse){
							activeMouse = false;
							$(document).off('mousemove.aim');	
						}
					}
				});	
			}
			
			
		},
		
		hideNav: function () {
			this._hideNav();	
		},
		
		_hideClick: function (event) {
			var _this = this,
				elemRow = event.data.elem;
				
			var checkTarget = (event.target === elemRow[0]) || $(event.target).closest(elemRow).length;

			if(!checkTarget){
				this._hideNav()
			}
			
			
			
		},
		
		_hideNav: function () {
		var element = $(this.element),
			_this = this;
			_this._removeOldActive();

			clearTimeout(element.data('delayHide'));
			clearTimeout(element.data('delayActivate'));
			element.trigger('hidenav');
			$(document).removeData("imaimopened");
			$(document).off('click.aim');
		},
		
		_mouseMove: function (e) {

			mouseLocs.push({x: e.pageX, y: e.pageY});

            if (mouseLocs.length > MOUSE_LOCS_TRACKED) {
                mouseLocs.shift();
            }	
		},
		
		_checkActivate: function (row) {
			var _this = this,
				delay = _this._checkMove();

            if (delay) {
				$(_this.element).data('delayActivate', setTimeout(function() {
					_this._checkActivate(row);
				}, delay));
            } else {
                _this._activeRow(row);
            }
		},
		
		_activeRow: function(row){
			var _this = this,
				elemRow = row;
			if(!elemRow.hasClass(_this.options.activeClass)){
				
				if($(document).data("imaimopened") && ($(document).data("imaimopened")[0] !== $(_this.element)[0])){
					$($(document).data("imaimopened")).aim('hideNav');
				} 
				
				clearTimeout($(_this.element).data('delayHide'));
				clearTimeout($(_this.element).data('delayActivate'));
				$(document).off('click.aim');
				
				$(_this.element).data('delayActivate', setTimeout(function() {
					_this._removeOldActive();
					elemRow.addClass(_this.options.activeClass);
					activeRow = elemRow;
					$(_this.element).trigger('shownav', [elemRow]);
					$(document).data('imaimopened', $(_this.element));
				}, _this.options.delayShow));
			}
			
		},
		
		_removeOldActive: function () {
			var _this = this;
			
			clearTimeout($(_this.element).data('delayHide'));
			
			var elemItem = (_this.options.closestItem) ? $(_this.options.itemsSelector,_this.element).closest(_this.options.closestItem) : _this.options.itemsSelector;
			
			if(elemItem !== ''){
				$(_this.element).find(elemItem).removeClass(_this.options.activeClass);	
			}
			else {
				$(_this.element).removeClass(_this.options.activeClass);
			}
			activeRow = null;
		},
		
		_checkMove: function() {
			var _this = this,
				element = $(this.element);
            if (!activeRow) {
                // If there is no other submenu row already active, then
                // go ahead and activate immediately.
                return 0;
            }

            var offset = element.offset(),
                upperLeft = {
                    x: offset.left,
                    y: offset.top - _this.options.tolerance
                },
                upperRight = {
                    x: offset.left + element.outerWidth(),
                    y: upperLeft.y
                },
                lowerLeft = {
                    x: offset.left,
                    y: offset.top + element.outerHeight() + _this.options.tolerance
                },
                lowerRight = {
                    x: offset.left + element.outerWidth(),
                    y: lowerLeft.y
                },
                loc = mouseLocs[mouseLocs.length - 1],
                prevLoc = mouseLocs[0];

            if (!loc) {
                return 0;
            }

            if (!prevLoc) {
                prevLoc = loc;
            }

            if (prevLoc.x < offset.left || prevLoc.x > lowerRight.x ||
                prevLoc.y < offset.top || prevLoc.y > lowerRight.y) {
                // If the previous mouse location was outside of the entire
                // menu's bounds, immediately activate.
                return 0;
            }

            if (lastDelayLoc &&
                    loc.x == lastDelayLoc.x && loc.y == lastDelayLoc.y) {
                // If the mouse hasn't moved since the last time we checked
                // for activation status, immediately activate.
                return 0;
            }

            // Detect if the user is moving towards the currently activated
            // submenu.
            //
            // If the mouse is heading relatively clearly towards
            // the submenu's content, we should wait and give the user more
            // time before activating a new row. If the mouse is heading
            // elsewhere, we can immediately activate a new row.
            //
            // We detect this by calculating the slope formed between the
            // current mouse location and the upper/lower right points of
            // the menu. We do the same for the previous mouse location.
            // If the current mouse location's slopes are
            // increasing/decreasing appropriately compared to the
            // previous's, we know the user is moving toward the submenu.
            //
            // Note that since the y-axis increases as the cursor moves
            // down the screen, we are looking for the slope between the
            // cursor and the upper right corner to decrease over time, not
            // increase (somewhat counterintuitively).
            function slope(a, b) {
                return (b.y - a.y) / (b.x - a.x);
            }

            var decreasingCorner = upperRight,
                increasingCorner = lowerRight;

            // Our expectations for decreasing or increasing slope values
            // depends on which direction the submenu opens relative to the
            // main menu. By default, if the menu opens on the right, we
            // expect the slope between the cursor and the upper right
            // corner to decrease over time, as explained above. If the
            // submenu opens in a different direction, we change our slope
            // expectations.
            if (_this.options.dropPosition == "left") {
                decreasingCorner = lowerLeft;
                increasingCorner = upperLeft;
            } else if (_this.options.dropPosition == "below") {
                decreasingCorner = lowerRight;
                increasingCorner = lowerLeft;
            } else if (_this.options.dropPosition == "above") {
                decreasingCorner = upperLeft;
                increasingCorner = upperRight;
            }

            var decreasingSlope = slope(loc, decreasingCorner),
                increasingSlope = slope(loc, increasingCorner),
                prevDecreasingSlope = slope(prevLoc, decreasingCorner),
                prevIncreasingSlope = slope(prevLoc, increasingCorner);

            if (decreasingSlope < prevDecreasingSlope &&
                    increasingSlope > prevIncreasingSlope) {
                // Mouse is moving from previous location towards the
                // currently activated submenu. Delay before activating a
                // new menu row, because user may be moving into submenu.
                lastDelayLoc = loc;
                return DELAY;
            }

            lastDelayLoc = null;
            return 0;
			
		}
		
	};

	$.fn[pluginName] = function (options) {
		var args = arguments, _return;

		if (options === notDefined || typeof options === 'object') {
			_return = this.each(function () {
				if (!$.data(this, 'plugin_' + pluginName)) {
					$.data(this, 'plugin_' + pluginName, new Plugin( this, options ));
				}
			});

		} else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
			_return = this.each(function () {
				var instance = $.data(this, 'plugin_' + pluginName);
				if (instance instanceof Plugin && typeof instance[options] === 'function') {
					instance[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
				}
			});
		}

		return _return;
	};

}(jQuery, window, document));