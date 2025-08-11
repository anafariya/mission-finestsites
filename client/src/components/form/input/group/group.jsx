import { useState, useEffect, useContext } from 'react';

import { ViewContext, Label, TextInput, NumberInput, EmailInput, URLInput,  
  DateInput, HiddenInput, Select, Switch, FileInput, Button, SubGroup, CardSubGroup } from 'components/lib'

import Style from './group.module.scss';

export function InputGroup(props){

  const viewContext = useContext(ViewContext);
  const [groups, setGroups] = useState(props.group);

  const Inputs = { 
    text: TextInput,
    textarea: TextInput,
    email: EmailInput,
    number: NumberInput,
    url: URLInput,
    date: DateInput,
    hidden: HiddenInput,
    select: Select,
    switch: Switch,
    file: FileInput,
    group: SubGroup,
    card_selector: CardSubGroup,
  }

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

    props.onChange(props.name, [...groups, group], undefined, true); 

  }

  function deleteGroup(index){

    if (props.required && groups.length === 1)
      return viewContext.notification.show('At least 1 placeholder is required', 'error', true);

    props.onChange(props.name, [...groups.slice(0, index), ...groups.slice(index + 1)], false, true);

  }

  function update(value, group, valid, start, end, name){
    props.onChange(name || props.name, value, valid, group, start, end)

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
     
              if (input.type){

                input.disabled = props.disabled;
                const InputComponent = Inputs[input.type];
                if(input.items && ['group', 'card_selector'].includes(input.default)) {
                  return <div key={key}>
                  <InputComponent {...input } key={ key } onChange={ (name, value, valid, group, start, end) => update(value, { index: index, input: key }, valid, start, end)} />
                  {
                    ['card_selector'].includes(input.default) ? <CardSubGroup {...{
                      ...input,
                      type: 'card_selector',
                      required: true,
                      label: 'Items Card',
                      group: input.items,
                      name: 'items'
                    }} customClass="bg-[#F9F6FF]" key={ `items${key}` } onChange={ (...rest) => props.onChange(...rest, props.name, index) }/> :
                    <SubGroup {...{
                      ...input,
                      type: 'group',
                      required: true,
                      label: 'Items Group',
                      group: input.items,
                      name: 'items'
                    }} customClass="bg-[#F9F6FF]" key={ `items${key}` } onChange={ (...rest) => props.onChange(...rest, props.name, index) }/>
                  }
                  </div>
                }
                return <InputComponent {...input } key={ key } onChange={ (name, value, valid, group, start, end) => update(value, { index: index, input: key }, valid, start, end)} />
      
              }
            })}
            {
              !props.disabled &&
              <Button 
                icon='trash' 
                action={ () => deleteGroup(index) }
                className={ Style.deleteButton }
              />
            }

          </fieldset>
        );
      })}
      {
        !props.disabled &&
        <Button 
          text={ `Add new ${props.name}` }
          small 
          color='blue' 
          icon='plus' 
          iconButton 
          iconColor='light' 
          fullWidth 
          action={ addGroup }
        />
      }

    </div>
  )
}