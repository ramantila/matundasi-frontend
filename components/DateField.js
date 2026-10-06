"use client";
import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import dayjs from 'dayjs';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEAR_RANGE = 30;

function NavArrow({ direction, onClick, disabled }) {
    return (
        <button type="button" className="dp-nav-arrow" onClick={onClick} disabled={disabled} tabIndex={-1}>
            <i className={`fa-solid fa-chevron-${direction}`} />
        </button>
    );
}

function NavSelect({ value, options, onChange }) {
    return (
        <span className="dp-nav-select-wrap">
            <select className="dp-nav-select" value={value} onChange={e => onChange(Number(e.target.value))}>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <i className="fa-solid fa-chevron-down" />
        </span>
    );
}

function CustomHeader({ monthDate, changeMonth, changeYear, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) {
    const year = monthDate.getFullYear();
    const thisYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: YEAR_RANGE + 6 }, (_, i) => thisYear + 5 - i).map(y => ({ value: y, label: y }));
    if (!yearOptions.some(o => o.value === year)) yearOptions.push({ value: year, label: year });
    const monthOptions = MONTHS.map((m, i) => ({ value: i, label: m }));

    return (
        <div className="dp-nav">
            <div className="dp-nav-group">
                <NavArrow direction="left" onClick={decreaseMonth} disabled={prevMonthButtonDisabled} />
                <NavSelect value={monthDate.getMonth()} options={monthOptions} onChange={changeMonth} />
                <NavArrow direction="right" onClick={increaseMonth} disabled={nextMonthButtonDisabled} />
            </div>
            <div className="dp-nav-group">
                <NavArrow direction="left" onClick={() => changeYear(year - 1)} />
                <NavSelect value={year} options={yearOptions} onChange={changeYear} />
                <NavArrow direction="right" onClick={() => changeYear(year + 1)} />
            </div>
        </div>
    );
}

// value/onChange use ISO 'YYYY-MM-DD' strings — the format Spring's LocalDate expects.
export default function DateField({ id, label, value, onChange, placeholder = 'DD/MM/YYYY', disabled, invalid, maxDate, inputClassName = 'form-input' }) {
    const selected = value ? dayjs(value).toDate() : null;
    return (
        <div className="dp-field">
            <DatePicker
                id={id}
                selected={selected}
                onChange={d => onChange(d ? dayjs(d).format('YYYY-MM-DD') : '')}
                dateFormat="dd/MM/yyyy"
                placeholderText={placeholder}
                className={`${inputClassName} ${invalid ? 'invalid' : ''}`}
                portalId="dp-portal"
                wrapperClassName="dp-wrapper"
                disabled={disabled}
                maxDate={maxDate}
                isClearable={!!value && !disabled}
                autoComplete="off"
                formatWeekDay={name => name.charAt(0)}
                renderCustomHeader={CustomHeader}
                calendarContainer={({ className, children }) => (
                    <div className={className}>
                        <div className="dp-panel-header">
                            <div className="dp-panel-label">{label || 'Select date'}</div>
                            <div className="dp-panel-value">{selected ? dayjs(selected).format('ddd, MMM D, YYYY') : 'No date'}</div>
                        </div>
                        {children}
                    </div>
                )}
            />
            {!value && <i className="fa-solid fa-calendar-days dp-trailing" />}
        </div>
    );
}
