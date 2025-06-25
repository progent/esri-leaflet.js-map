 /* Polyfill of .addEventListener, .removeEventListener, DOMContentLoaded for IE < 9
 * CustomEvent for IE < 9
 * Monkey patch custom event for IE9 - 11
 */
/*global define: false, module: false */
/*jslint bitwise: true, forin: true, sloppy: true */
(function eventModule(global, definition) { // non-exporting module magic dance
    'use strict';

    var
        amd = 'amd',
        exports = 'exports'; // keeps the method names for CommonJS / AMD from being compiled to single character variable

    if (typeof define === 'function' && define[amd]) {
        define(function definer() {
            return definition(global);
        });
    } else if (typeof module === 'function' && module[exports]) {
        module[exports] = definition(global);
    } else {
        definition(global);
    }
}(this, function eventPolyfill(global) {
    var
        document = global.document,
        elementPrototype,
        eventDefaults,
        eventMethods,
        eventPhaseEnum,
        eventPrototype,
        forEach = Array.prototype.forEach || function forEach(fn, context) {
            var
                counter = 0,
                object = ({}).valueOf.call(this),
                length = object.length >>> 0;

            while (counter < length) {
                if (counter in object) {
                    fn.call(context, object[counter], counter, object);
                }

                counter += 1;
            }
        },
        hasOwnProperty = Object.prototype.hasOwnProperty,
        htmlDocumentPrototype = 'HTMLDocument' in global ? global.HTMLDocument.prototype : null,
        htmlEvents,
        indexOf = Array.prototype.indexOf || function indexOf(value) {
            var
                counter = 0,
                object = ({}).valueOf.call(this),
                length = object.length >>> 0;

            while (counter < length) {
                if (counter in object && object[counter] === value) {
                    return counter;
                }

                counter += 1;
            }

            return -1;
        },
        keys = Object.keys || function keys(object) {
            var
                array = [],
                key;

            for (key in object) {
                if (hasOwnProperty.call(object, key)) {
                    array.push(key);
                }
            }

            return array;
        },
        windowPrototype = 'Window' in global ? global.Window.prototype : null,
        T = global.TypeError;

    if (!global.Element) {
        return;
    }

    try { // do we need to define from scratch (or override IE9 - 11)?
        return new global.CustomEvent('?');
    } catch (ignore) {}

    elementPrototype = global.Element.prototype;
    eventPhaseEnum = {
        CAPTURING_PHASE: 1,
        AT_TARGET: 2,
        BUBBLING_PHASE: 3
    };

    htmlEvents = { // list of real events
        // <body> and <frameset> Events
        load: 1,
        unload: 1,
        // Form Events
        blur: 1,
        change: 1,
        focus: 1,
        reset: 1,
        select: 1,
        submit: 1,
        // Image Events
        abort: 1,
        // Keyboard Events
        keydown: 1,
        keypress: 1,
        keyup: 1,
        // Mouse Events
        click: 1,
        dblclick: 1,
        mousedown: 1,
        mousemove: 1,
        mouseout: 1,
        mouseover: 1,
        mouseup: 1
    };

    eventDefaults = {
        bubbles: false,
        cancelBubble: false,
        cancelable: false,
        clipboardData: undefined,
        currentTarget: null,
        defaultPrevented: false,
        detail: null,
        eventPhase: 0,
        returnValue: true,
        srcElement: null,
        target: null,
        timeStamp: undefined,
        type: null
    };

    function domContentLoaded() {
        if (document.readyState === 'complete') {
            document.detachEvent('onreadystatechange', domContentLoaded);
            document.dispatchEvent(new global.CustomEvent('DOMContentLoaded')); // dogfooding, though a POJO { type: 'DOMContentLoaded' } would suffice
        }
    }

    /**
     * @constructor
     */
    function Event() {
        return this;
    }

    /**
     * @param {string} type
     * @param {Function} handler
     */
    function addEventListener(type, handler) {
        if (!type || typeof type !== 'string' || !handler) {
            throw new T('Invalid type or handler');
        }

        if (this.attachEvent && htmlEvents[type]) { // < IE9 'real' event
            this.attachEvent('on' + type, handler);
        } else { // all others
            this.events = this.events || {}; // set up container if necessary
            this.events[type] = this.events[type] || []; // set up type container if necessary
            if (indexOf.call(this.events[type], handler) === -1) { // only add if we haven't got it already
                this.events[type].push(handler);
            }

            if (type === 'DOMContentLoaded' && !global.Event.o_O) {
                document.attachEvent('onreadystatechange', domContentLoaded);
                global.setTimeout(domContentLoaded); // we might have already missed it, so run as soon as possible
            }
        }
    }

    function createEvent() {
        var
            event,
            key;

        if (document.createEventObject) {
            event = document.createEventObject();
            for (key in eventPrototype) {
                if (hasOwnProperty.call(eventPrototype, key) && !hasOwnProperty.call(event, key)) {
                    event[key] = eventPrototype[key];
                }
            }
        }

        return event;
    }

    /**
     * @param {Event} event
     */
    function dispatchEvent(event) {
        var
            eventType,
            type = event ? event.type : null;

        if (!type) {
            throw new T('Event or event type not specified');
        }

        if (this.fireEvent && htmlEvents[type]) { // < IE9 'real' event
            this.fireEvent('on' + type, event);
        } else if (this.events && this.events[type]) {
            event.currentTarget = this;
            event.target = event.srcElement;
            event.timeStamp = (new Date()).getTime();
            eventType = this.events[type];
            forEach.call(eventType, function dispatcher(fn) {
                fn.call(global, event);
            });

            event.currentTarget = null;
        }

        return event.defaultPrevented !== true;
    }

    function eventPhase() {
        return this.srcElement === this.currentTarget ? eventPhaseEnum.AT_TARGET : eventPhaseEnum.BUBBLING_PHASE;
    }

    /**
     * @param {string} type
     * @param {boolean?} opt_bubbles
     * @param {boolean?} opt_cancelable
     */
    function initEvent(type, opt_bubbles, opt_cancelable) {
        if (!type || typeof type !== 'string') {
            throw new T('Event type not specified');
        }

        this.type = type;
        this.bubbles = opt_bubbles || eventDefaults.bubbles;
        this.cancelable = opt_cancelable || eventDefaults.cancelable;

        if (!this.bubbles) {
            this.stopPropagation();
        }
    }

    function preventDefault() {
        if (this.cancelable) {
            this.defaultPrevented = true;
            this.returnValue = false;
        }
    }

    function removeEventListener(type, handler) {
        var
            index;

        if (!type || typeof type !== 'string' || !handler) {
            throw new T('Type or handler is invalid');
        }

        if (this.detachEvent && htmlEvents[type]) { // < IE9 'real' event
            this.detachEvent('on' + type, handler);
        } else {
            if (this.events === undefined || !this.events[type] || this.events[type].length === 0) {
                return;
            }

            index = indexOf.call(this.events[type], handler);
            if (index !== -1) { // clean up listeners object
                this.events[type].splice(index, 1); // take it away
                if (this.events[type].length === 0) {
                    delete this.events[type]; // remove type container
                    if (keys(this.events).length === 0) {
                        delete this.events; // remove container altogether
                    }
                }
            }
        }
    }

    function stopImmediatePropagation() {
        this.stoppedImmediatePropagation = true;
        this.stopPropagation();
    }

    function stopPropagation() {
        this.stoppedPropagation = true;
        this.cancelBubble = true;
    }

    if (!global.Event) {
        global.Event = Event;
    } else {
        if (document.createEvent) { // let's leave a flag denoting a monkey patch was required (IE9 - 11)
            global.Event.o_O = true;
        }
    }

    eventMethods = {
        addEventListener: addEventListener,
        createEvent: createEvent,
        dispatchEvent: dispatchEvent,
        removeEventListener: removeEventListener
    };

    eventPrototype = global.Event.prototype;
    eventPrototype.eventPhase = eventPhase;
    eventPrototype.initEvent = initEvent;
    eventPrototype.preventDefault = preventDefault;
    eventPrototype.stopImmediatePropagation = stopImmediatePropagation;
    eventPrototype.stopPropagation = stopPropagation;

    global.CustomEvent = (function definition(eventName, defaultInitDict) {
        /**
         * @param {string} type
         * @param {boolean?} opt_bubbles
         * @param {boolean?} opt_cancelable
         * @param {*?} opt_detail
         */
        function initCustomEvent(type, opt_bubbles, opt_cancelable, opt_detail) {
            var
                bubbles = opt_bubbles || defaultInitDict.bubbles,
                cancelable = opt_cancelable || defaultInitDict.cancelable,
                detail = opt_detail || defaultInitDict.detail;

            this['init' + eventName](type, bubbles, cancelable, detail);
            if (!hasOwnProperty.call(this, 'detail')) {
                this.detail = detail;
            }
        }

        /**
         * @constructor
         * @param {string} type
         * @param {Object?} opt_eventInitDict
         */
        function CustomEvent(type, opt_eventInitDict) {
            var
                event = document.createEvent(eventName),
                eventInitDict,
                key;

            if (type !== null) {
                eventInitDict = opt_eventInitDict || defaultInitDict;
                if (eventInitDict !== defaultInitDict) {
                    for (key in defaultInitDict) {
                        if (defaultInitDict.hasOwnProperty(key) && !eventInitDict.hasOwnProperty(key)) {
                            eventInitDict[key] = defaultInitDict[key];
                        }
                    }
                }

                initCustomEvent.call(event, type, eventInitDict.bubbles, eventInitDict.cancelable, eventInitDict.detail);
            } else {
                event.initCustomEvent = initCustomEvent;
            }

            return event;
        }

        return CustomEvent;
    }(global.CustomEvent ? 'CustomEvent' : 'Event', {
        bubbles: eventDefaults.bubbles,
        cancelable: eventDefaults.cancelable,
        detail: eventDefaults.detail
    }));

    forEach.call([elementPrototype, htmlDocumentPrototype, windowPrototype, document], function iterator(object) {
        if (!object) {
            return;
        }

        forEach.call(keys(eventMethods), function delegate(method) {
            if (!object[method]) {
                object[method] = eventMethods[method];
            }
        });
    });
}));