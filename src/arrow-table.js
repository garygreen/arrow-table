import $ from 'jquery';

/*
 *  Copyright 2014 Gary Green.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

function ArrowTable(table, options) {

	this.init(table, options);

};

ArrowTable.prototype = {

	defaults: {
		namespace: 'arrowtable', // Namespace for the keybinding, etc
		beforeMove: $.noop,      // Function to call before navigating
		afterMove: $.noop,       // Function to call after navigating
		listenTarget: 'input',   // Listen for move/key events from this target
		focusTarget: 'input',    // Focus this target after the move has completed
		enabledKeys: ['left', 'right', 'up', 'down'], // Key's enabled
		continuousDelay: 50      // Delay in milliseconds for continuous movement when holding down arrow keys
	},

	KEYS: {
		37: 'left',
		39: 'right',
		38: 'up',
		40: 'down'
	},

	/**
	 * Initialise the plugin
	 * @param  {element} table   Table element
	 * @param  {object} options  Custom plugin options
	 * @return {void}
	 */
	init: function(table, options) {
		
		this.options = $.extend({}, this.defaults, options);
		this.$table = $(table);

		// Bind main plugin events
		this.bindEvents();
	},

	findMoveTarget: function(direction, $element) {

		var $target;

		// Get the move to td container
		switch (direction)
		{
			case 'right':
				$target = $element.closest('td').next();
				break;

			case 'left':
				$target = $element.closest('td').prev();
				break;

			case 'down':
				$target = $element.closest('tr').next().find('td:eq(' + $element.closest('td').index() + ')');
				break;

			case 'up':
				$target = $element.closest('tr').prev().find('td:eq(' + $element.closest('td').index() + ')');
				break;
		}

		return $target;
	},

	/**
	 * Handle moving from one td to another and focussing the target
	 * @param  {DOMElement} Current dom element 
	 * @param  {string} Direction to move
	 * @return {void}
	 */
	move: function(element, direction) {

		var $this = $(element);

		var findMoveTarget = $.proxy(function() {
			return this.findMoveTarget(direction, $this);
		}, this);

		// Allow move to not happen if beforeMove function returns 'false'
		var move = this.options.beforeMove($this[0], findMoveTarget, direction);
		if (move === false)
		{
			return;
		}

		var $target = findMoveTarget();

		if ($target.length)
		{
			// Focus the target
			this.focusTarget($target);

			// Let the afterMove callback know we're finished
			this.options.afterMove($this[0], $target[0], direction);
		}
	},

	/**
	 * Focus the input target
	 * @param  {jQuery} $target
	 * @return {void}
	 */
	focusTarget: function($target) {
		$target.find(this.options.focusTarget).focus();
	},

	/**
	 * Bind main plugin events
	 * @return {void}
	 */
	bindEvents: function() {
		var	moveTimer;

		var moveEvent = function(event) {

			var direction = this.KEYS[event.which];

			// Check the key/direction is enabled
			if ($.inArray(direction, this.options.enabledKeys) === -1)
			{
				return;
			}

			if (this.options.continuousDelay > 0)
			{
				if (moveTimer)
				{
					return;
				}

				moveTimer = setTimeout(function() {
					moveTimer = null;
				}, this.options.continuousDelay);
			}

			event.preventDefault();
			this.move(event.target, direction);
		};

		var keyup = function() {
			moveTimer = null;
		};

		this.$table
			.on('keydown.' + this.options.namespace, this.options.listenTarget, $.proxy(moveEvent, this))
			.on('keyup.' + this.options.namespace, this.options.listenTarget, keyup);
	},

	/**
	 * Unbind main plugin events
	 * @return {void}
	 */
	unbindEvents: function() {
		this.$table.off('.' + this.options.namespace);
	},

	/**
	 * Destroy the plugin
	 * @return {self}
	 */
	destroy: function() {
		this.unbindEvents();
		return this;
	}

};

$.fn.arrowTable = function(options) {
	
	options = options || {};

	var namespace = options.namespace || ArrowTable.prototype.defaults.namespace,
		isMethodCall = typeof options === 'string';

	return $(this).each(function() {

		var $this = $(this);

		// Get plugin instance
		var arrowTable = $this.data(namespace);

		if (isMethodCall)
		{
			if (!arrowTable) return this;

			switch (options)
			{
				case 'destroy':
					arrowTable.destroy();
					$this.removeData(namespace);
					break;

			}

			return this;
		}

		// Initialise?
		if (arrowTable === undefined)
		{
			arrowTable = new ArrowTable(this, options);
			$this.data(namespace, arrowTable);
		}
		else
		{
			// Reinitialise arrowTable
			arrowTable.destroy().init(this, options);
		}

		return this;

	});

};

export default ArrowTable;
