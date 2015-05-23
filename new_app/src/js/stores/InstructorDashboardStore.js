/**
 * Created by omelvin on 5/22/15.
 */

var AppDispatcher = require('../dispatcher/ChatAppDispatcher');
var AppConstants = require('../constants/ChatConstants');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var CHANGE_EVENT = 'change';

var _students = {};

var InstructorDashboardStore = assign({}, EventEmitter.prototype, {

    emitChange: function () {
        this.emit(CHANGE_EVENT);
    },

    /**
     * @param {function} callback
     */
    addChangeListener: function (callback) {
        this.on(CHANGE_EVENT, callback);
    },

    removeChangeListener: function (callback) {
        this.removeListener(CHANGE_EVENT, callback);
    },

    getAllStudents: function() {
        return _students;
    }

});

InstructorDashboardStore.dispatchToken = AppDispatcher.register(function(action) {

    switch(action.type) {

        case AppConstants.GET_STUDENTS:
            InstructorDashboardStore.emitChange();
            break;

        default:
        // do nothing
    }

});

module.exports = InstructorDashboardStore;