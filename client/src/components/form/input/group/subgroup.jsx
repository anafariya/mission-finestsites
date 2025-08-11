import { useState, useEffect, useContext } from 'react';

import { ViewContext, Label, TextInput, NumberInput, EmailInput, URLInput,  
  DateInput, HiddenInput, Select, Switch, FileInput, Button } from 'components/lib'

import Style from './group.module.scss';

export function SubGroup(props){

  const viewContext = useContext(ViewContext);
  const [groups, setGroups] = useState(props.group);

  const Inputs = { text: TextInput, textarea: TextInput, email: EmailInput, number: NumberInput,
    url: URLInput, date: DateInput, hidden: HiddenInput, select: Select, switch: Switch, file: FileInput }

  useEffect(() => {

    setGroups(props.group);

  }, [props.group])

  if (!groups.length)
    return false;

  
  function addGroup(){
      
    // base it on the first group
    const group = JSON.parse(JSON.stringify(props.group[0]));

    Object.keys(group).map(key => { 
      
      if (group[key].type === 'select'){

        // set to first option
        group[key].value = group[key].options[0].value
        group[key].default = group[key].options[0].value

      }
      else {

        if(group[key] instanceof Object){
            group[key].value = '' 
        }

      }
    })

    props.onChange(props.name, [...groups, group], undefined, true, false); 

  }

  function deleteGroup(index){

    if (props.required && groups.length === 1)
      return viewContext.notification.show('At least 1 placeholder is required', 'error', true);
    
    props.onChange(props.name, [...groups.slice(0, index), ...groups.slice(index + 1)], false, true, false);

  }

  function update(value, group, valid, start, end){

    props.onChange(value, group, valid, start, end, props.name, undefined)

  }

  return (
    <div className={ Style.group }>

      { props.label && 
        <Label
          text={ props.label }
          required={ props.required }
          for={ props.name }
        /> }

      { groups.map((group, index) => {
        return (
          <fieldset className={ `${Style.fieldset} ${props.customClass}` } key={ `${props.name}_${index}` }>

            { Object.keys(group).map(key => {

              const input = group[key];
     
              if (input?.type){
                input.disabled = props.disabled;
                const InputComponent = Inputs[input.type];
                return <InputComponent {...input } key={ key } onChange={ (name, value, valid, group, start, end) => update(value, { index: index, input: key }, valid, start, end)} />
      
              }
            })}

            <Button 
              icon='trash' 
              action={ () => deleteGroup(index) }
              className={ Style.deleteButton }
            />

          </fieldset>
        );
      })}

      <Button 
        text={ `Add new ${props.name}` }
        small 
        color='slate' 
        icon='plus' 
        iconButton 
        iconColor='dark' 
        fullWidth 
        action={ addGroup }
      />

    </div>
  )
}