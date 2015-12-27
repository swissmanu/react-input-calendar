import React from 'react'
import cs from 'classnames'
import moment from 'moment'
import 'moment-range'

import DaysView from './day-view'
import MonthsView from './month-view'
import YearsView from './year-view'
import Util from './util'

var _keyDownActions = Util.keyDownActions;

function toDate(date) {
  if (date instanceof Date) {
    return date;
  }
  return new Date(date);
}

module.exports = React.createClass({

    propTypes: {
        closeOnSelect: React.PropTypes.bool,
        computableFormat: React.PropTypes.string,
        date: React.PropTypes.any,
        minDate: React.PropTypes.any,
        maxDate: React.PropTypes.any,
        format: React.PropTypes.string,
        inputFieldId: React.PropTypes.string,
        inputFieldClass: React.PropTypes.string,
        minView: React.PropTypes.number,
        onBlur: React.PropTypes.func,
        onChange: React.PropTypes.func,
        placeholder: React.PropTypes.string,
        hideTouchKeyboard: React.PropTypes.bool,
        hideIcon: React.PropTypes.bool,
    },

    getInitialState: function() {
        var date = this.props.date ? moment(toDate(this.props.date)) : null,
            minDate = this.props.minDate ? moment(toDate(this.props.minDate)) : null,
            maxDate = this.props.maxDate ? moment(toDate(this.props.maxDate)) : null,
            inputFieldId = this.props.inputFieldId ? this.props.inputFieldId : null,
            inputFieldClass = this.props.inputFieldClass ? this.props.inputFieldClass : 'input-calendar-value',
            format = this.props.format || 'MM-DD-YYYY',
            minView = parseInt(this.props.minView, 10) || 0,
            computableFormat = this.props.computableFormat || 'MM-DD-YYYY';

        return {
            date: date,
            minDate: minDate,
            maxDate: maxDate,
            format: format,
            computableFormat: computableFormat,
            inputValue: date ? date.format(format) : null,
            views: ['days', 'months', 'years'],
            minView: minView,
            currentView: minView || 0,
            isVisible: false
        };
    },

    componentDidMount: function() {
        document.addEventListener('click', this.documentClick);
    },

    componentWillUnmount: function() {
        document.removeEventListener('click', this.documentClick);
    },

    componentWillReceiveProps: function(nextProps) {
        this.setState({
            date: nextProps.date ? moment(toDate(nextProps.date)) : this.state.date,
            inputValue: nextProps.date ? moment(toDate(nextProps.date)).format(this.state.format) : null
        });
    },

    keyDown: function (e) {
        _keyDownActions.call(this, e.keyCode);
    },

    checkIfDateDisabled: function (date) {
        if (this.state.minDate && date.isBefore(this.state.minDate)) {
            return true;
        }

        if (this.state.maxDate && date.isAfter(this.state.maxDate)) {
            return true;
        }

        return false;
    },

    nextView: function () {
        if (this.checkIfDateDisabled(this.state.date)) {
            return;
        }

        this.setState({
            currentView: ++this.state.currentView
        });
    },

    prevView: function (date) {
        if (this.state.minDate && date.isBefore(this.state.minDate)) {
            date = this.state.minDate.clone();
        }

        if (this.state.maxDate && date.isAfter(this.state.maxDate)) {
            date = this.state.maxDate.clone();
        }

        if (this.state.currentView === this.state.minView) {
            this.setState({
                date: date,
                inputValue: date.format(this.state.format),
                isVisible: false
            });

            if (this.props.onChange) {
                this.props.onChange(date.format(this.state.computableFormat));
            }

        } else {
            this.setState({
                date: date,
                currentView: --this.state.currentView
            });
        }
    },

    setDate: function (date, isDayView) {
        if (this.checkIfDateDisabled(date)) {
            return;
        }

        this.setState({
            date: date,
            inputValue: date.format(this.state.format),
            isVisible: this.props.closeOnSelect && isDayView ? !this.state.isVisible : this.state.isVisible
        });

        if (this.props.onChange) {
            this.props.onChange(date.format(this.state.computableFormat));
        }
    },

    changeDate: function (e) {
        this.setState({
            inputValue: e.target.value
        })
    },

    inputBlur: function (e) {
        var date = this.state.inputValue,
            newDate = null,
            computableDate = null,
            format = this.state.format;

        if (date) {
            // format, with strict parsing true, so we catch bad dates
            newDate = moment(date, format, true);

            // if the new date didn't match our format, see if the native
            // js date can parse it
            if (!newDate.isValid()) {
                var d = new Date(date);

                // if native js cannot parse, just make a new date
                if (isNaN(d.getTime())) {
                    d = new Date();
                }

                newDate = moment(d);
            }

            computableDate = newDate.format(this.state.computableFormat);
        }

        this.setState({
            date: newDate,
            inputValue: newDate ? newDate.format(format) : null
        });

        if (this.props.onChange) {
            this.props.onChange(computableDate);
        }

        if (this.props.onBlur) {
            this.props.onBlur(e, computableDate);
        }
    },

    //small hack for hide calendar
    isCalendar: false,

    documentClick: function () {
        if (!this.isCalendar) {
            this.setVisibility(false);
        }
        this.isCalendar = false;
    },

    calendarClick: function () {
        this.isCalendar = true;
    },

    todayClick: function () {
        var today = moment().startOf('day');

        if (this.checkIfDateDisabled(today)) return;

        this.setState({
            date: today,
            inputValue: today.format(this.state.format),
            currentView: this.state.minView
        });

        if (this.props.onChange) {
            this.props.onChange(today.format(this.state.computableFormat));
        }
    },

    toggleClick: function () {
        this.isCalendar = true;
        this.setVisibility();
    },

    setVisibility: function (val) {
        var value = val !== undefined ? val : !this.state.isVisible;
        var eventMethod = value ? 'addEventListener' : 'removeEventListener';
        document[eventMethod]('keydown', this.keyDown);

        if(this.state.isVisible !== value){
            this.setState({
                isVisible: value
            });
        }
    },

    render: function () {

        // its ok for this.state.date to be null, but we should never
        // pass null for the date into the calendar pop up, as we want
        // it to just start on todays date if there is no date set
        var calendarDate = this.state.date || moment();

        var view;
        switch (this.state.currentView) {
            case 0:
                view = <DaysView
                    date={calendarDate}
                    minDate={this.state.minDate}
                    maxDate={this.state.maxDate}
                    setDate={this.setDate}
                    nextView={this.nextView} />;
                break;
            case 1:
                view = <MonthsView
                    date={calendarDate}
                    minDate={this.state.minDate}
                    maxDate={this.state.maxDate}
                    setDate={this.setDate}
                    nextView={this.nextView}
                    prevView={this.prevView} />;
                break;
            case 2:
                view = <YearsView
                    date={calendarDate}
                    minDate={this.state.minDate}
                    maxDate={this.state.maxDate}
                    setDate={this.setDate}
                    prevView={this.prevView} />;
                break;
        }

        var todayText = 'Today';
        if(moment.locale() === 'de')
          todayText = 'Heute';

        var calendarClass = cs({
            'input-calendar-wrapper': true,
            'icon-hidden': this.props.hideIcon
        });

        var calendar = !this.state.isVisible ? '' :
            <div className={calendarClass} onClick={this.calendarClick}>
                {view}
                <span
                  className={"today-btn" + (this.checkIfDateDisabled(moment().startOf('day')) ? " disabled" : "")}
                  onClick={this.todayClick}>
                  {todayText}
                </span>
            </div>;

        var iconClass = cs({
            'fa': true,
            'fa-calendar': !this.state.isVisible,
            'fa-calendar-o': this.state.isVisible
        });

        var readOnly = false;

        if(this.props.hideTouchKeyboard) {
            // do not break server side rendering:
            try {
                if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                    readOnly = true;
                }
            } catch (e) {

            }
        }

        // Do not show calendar icon if hideIcon is true
        var calendarIcon = this.props.hideIcon ? '' :
            <span onClick={this.toggleClick} className="icon-wrapper calendar-icon">
                  <i className={iconClass}></i>
            </span>;

        return (
            <div className="input-calendar">
                <input type="text"
                    id={this.props.inputFieldId}
                    className={this.props.inputFieldClass}
                    value={this.state.inputValue}
                    onBlur={this.inputBlur}
                    onChange={this.changeDate}
                    onFocus={this.props.openOnInputFocus ? this.toggleClick : ''}
                    placeholder={this.props.placeholder}
                    readOnly={readOnly} />

                    {calendarIcon}
                {calendar}
            </div>
        );
    }

});