/***
*
*   SELECT
*   Dropdown select used within the form
*   Props are passed from the form
*   
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   default: default selected option (string, optional)
*   errorMessage: custom error message (string, optional)
*   label: input label (string, optional)
*   name: name of the input to be used as the label (string, required)
*   onChange: callback function that executes on change (function, required)
*   options: array of object options (array, required)
*   required: this input is required (boolean, optional)
*   valid: determines if the input is valid (boolean, required)
*   value: initial value (string, optional)
*   warning: warning highlight (boolean, optional)
*
**********/

import { Label, Error } from 'components/lib';
import Select from "react-tailwindcss-select";
import Style from './select.tailwind.js';
import { useEffect, useState } from 'react';

function Multiselect(props){
  const [values, setValues] = useState(null)

  // let options = props.options;
  const error = props.errorMessage || 'Please select an option';

  const init = (value, options) => {
    if(options?.length && typeof value !== 'string' && value?.length){
      const mapped = [...value].map((val) => {
        return options.filter((opt) => opt.value === val)?.[0]
      })
      setValues(mapped)
    } else {
      setValues(null)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      init(props.value, props.options)
    } , 30)

    return () => clearTimeout(timer)
  }, [props.value, props.options])

  function change(e){
    let value = e || 'unselected';
    let valid = undefined;

    // validate
    valid = props.required && value === 'unselected' ? false : true;

    const updated = value !== 'unselected' ? [...e]?.map((val) => val.value) : value
    props.onChange(props.name, updated, valid);

  }

  return(
    <div className={ Style.input }>

      <Label
        text={ props.label }
        required={ props.required }
        for={ props.name }
      />

      <div >
        <Select
          value={values}
          onChange={change}
          options={props.options}
          isMultiple
          placeholder={props.placeholder}
          isSearchable
          isDisabled={props.disabled}
        />

        { props.valid === false && <Error message={ error } className={ Style.message }/> }

      </div>
    </div>
  );
}

export { Multiselect }