/***
*
*   SEARCH
*   Search input field
*
*   PROPS
*   callback: function executed on change and submit (function, required)
*   placeholder: placeholder text (string, optional, default: Search)
*   throttle: throttle the callback execution in ms (integer, required)
*
**********/

import { useState, useEffect } from 'react';
import { Button, ClassHelper } from 'components/lib';

import Style from './search.tailwind.js';
import InputStyle from '../form/input/input.tailwind.js';

export function Search(props){

  const [value, setValue] = useState(props.value || '');
  const [typing, setTyping] = useState(false);

  useEffect(() => {

    // throttle typing
    if (props.throttle && !typing){
      const onKeyPress = () => {

        setTyping(true);
        setTimeout(() => { setTyping(false) }, props.throttle);

      }

      window.addEventListener('keydown', onKeyPress);
      return () => window.removeEventListener('keydown', onKeyPress);
      
    }
  }, [props.throttle, typing]);

  useEffect(() => {

    // callback when typing throttle done
    if (props.throttle && !typing)
      props.callback(value);

  }, [props, typing, value]);

  const searchStyle = ClassHelper(Style, {

    base: true,
    className: props.className,
    form: true

  })

  return (
    <form className={ `${searchStyle} flex flex-row gap-0` }>

      <input
        type='text'
        className={ InputStyle.textbox }
        placeholder={ props.placeholder || 'Search' }
        value={ value }
        onChange={ e => {

          setValue(e.target.value);
          !props.throttle && props.callback(e.target.value);

        }}
      />

      <Button 
        icon='search'
        className={ Style.button }
        iconSize={ 20 }
        position='absolute'
        action={ () => props.callback(value) }
        />

    </form>
  );
}