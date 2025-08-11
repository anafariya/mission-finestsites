import { useState, useRef, useEffect } from "react";
import { Label, Error, Icon } from 'components/lib';
import Style from './time-selector.tailwind.js';

export function TimeSelector(props) {
  const [value, setValue] = useState('');
  const inputRef = useRef();
  const error = props.errorMessage || 'Please enter a valid time';

  useEffect(() => {
    if (inputRef.current && props.selectionStart && props.selectionEnd) {
      inputRef.current.setSelectionRange(props.selectionStart, props.selectionEnd);
    }

    if (props.value) {
      setValue(props.value);
    }
  }, [props.value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    props.onChange?.(props.name, newValue, undefined, false, e.target.selectionStart, e.target.selectionEnd);
  };

  function validate(e) {
    const value = e?.target.value || '';
    let valid = undefined;

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm format

    if (props.required && value === '') valid = false;
    else if (!props.required && value === '') valid = true;
    else valid = timeRegex.test(value);

    props.onChange?.(props.name, value, valid);
  }

  return (
    <div className="flex flex-col relative mb-4">
      {props.label &&
        <Label
          text={props.label}
          required={props.required}
          htmlFor={props.name}
        />}
      <div className="flex items-center p-2">
        <input
          ref={inputRef}
          id={props.id}
          name={props.name}
          type="time"
          value={value}
          disabled={props.disabled}
          placeholder={props.placeholder}
          onChange={handleInputChange}
          onBlur={validate}
          className="w-32 border border-gray-300 rounded px-2 py-1"
        />
      </div>
      {props.valid === false &&
        <Error message={error} />}

      {props.valid === true &&
        <Icon
          image="check"
          color="#8CC57D"
          className={Style.successIcon}
          size={16}
        />}

      {props.helper &&
        <div className={Style.helper}>{props.helper}</div>}
    </div>
  );
}
