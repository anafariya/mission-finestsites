import { useState, useRef, useEffect } from "react";
import { Label, Error, Icon } from 'components/lib';
import Style from './text-editor.tailwind.js';
import Editor from 'react-simple-wysiwyg';

export function TextEditor(props) {
  const [html, setHtml] = useState('');
  const error = props.errorMessage || 'Please enter a value';

  const inputRef = useRef();

  useEffect(() => {
    props.value && setHtml(props.value)
    // set cursor pos
    if (inputRef.current && props.selectionStart && props.selectionEnd) {
      inputRef.current.setSelectionRange(props.selectionStart, props.selectionEnd);
    }
    
  }, [props.value]);
  
  function onChange(e) {
    setHtml(e.target.value);
    props.onChange?.(props.name, e.target.value, undefined, false, e.target.selectionStart, e.target.selectionEnd)
  }

  function validate(){

    let value = html;
    let valid = undefined;

    // input is required and value is blank
    if (props.required && value === '')
      valid = false;

    // input isn't required and value is blank
    if (!props.required && value === '')
      valid = true;

    if (props.required && value !== '')
      valid = true;

    // update the parent form
    props.onChange?.(props.name, value, valid);

  }

  return (
    <div className="flex flex-col relative mb-4">
      { props.label && 
        <Label
          text={ props.label }
          required={ props.required }
          for={ props.name }
        /> }
        <Editor
            value={html}
            onChange={onChange}
            ref={inputRef}
            onBlur={validate}
            containerProps={{ style: { resize: 'vertical' } }}/>
            { props.valid === false &&
        <Error message={ error }/> }

      { props.valid === true &&
        <Icon
          image='check'
          color='#8CC57D'
          className={ Style.successIcon }
          size={ 16 }
        />}

        { props.helper && 
          <div className={ Style.helper }>{ props.helper }</div> }
    </div>
  );
}