import { useState, useEffect, useContext } from 'react';

import { ViewContext, Label, TextInput, NumberInput, EmailInput, URLInput,  
  DateInput, HiddenInput, Select, Switch, FileInput, Button } from 'components/lib'

import Style from './group.module.scss';

export function CardSubGroup(props){

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

    props.onChange(props.name, [...groups, group], undefined, true, false, 0, 'card'); 

  }

  function deleteGroupStyle(indexParent, indexItem){
      
    // base it on the first group
    const group = JSON.parse(JSON.stringify(props.group[indexParent])); // Deep copy group

    if (group.styles.length === 1)
      return viewContext.notification.show('At least 1 placeholder is required', 'error', true);

    props.onChange(props.name, [...group.styles.slice(0, indexItem), ...group.styles.slice(indexItem + 1)], false, true, false, indexParent, 'styles');


  }

  function addGroupStyle(index){
      
    // base it on the first group
    const group = JSON.parse(JSON.stringify(props.group[index])); // Deep copy group
    const styles = JSON.parse(JSON.stringify(group.styles[0])); // Deep copy styles

    Object.keys(styles).map(key => { 
      
      if (styles[key].type === 'select'){

        // set to first option
        styles[key].value = styles[key].options[0].value
        styles[key].default = styles[key].options[0].value

      }
      else {

        if(styles[key] instanceof Object){
            styles[key].value = '' 
            styles[key].valid = undefined
        }

      }
    })

    group.styles = [
      ...group.styles,
      styles
    ]

    props.onChange(props.name, group.styles, undefined, true, false, index, 'styles'); 

  }

  function deleteGroup(index){

    if (props.required && groups.length === 1)
      return viewContext.notification.show('At least 1 placeholder is required', 'error', true);
    
    props.onChange(props.name, [...groups.slice(0, index), ...groups.slice(index + 1)], false, true, false, index, 'card');

  }

  function update(value, group, valid, start, end, sub){
    props.onChange(value, group, valid, start, end, props.name, sub)

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

            { Object.keys(group).map((key) => {

              const input = group[key];
              
              if (input?.type){
                input.disabled = props.disabled;
                const InputComponent = Inputs[input.type];
                return <InputComponent {...input } key={ key } onChange={ (name, value, valid, group, start, end) => update(value, { index: index, input: key }, valid, start, end)} />
      
              }

              if(Array.isArray(input)) {
                return <div className="p-4 border rounded-lg bg-white shadow-md">
                  <h3 className="mb-2 font-bold after:text-red-500 after:ml-1 after:font-semibold after:content-['*']">Styles</h3>
                  <div className="space-y-2">
                    {input.map((style, i) => (
                      <div key={i} className="flex gap-2 justify-center">
                      { Object.keys(style).map((sub)=> {
                        return <TextInput 
                          key={sub}
                          {...style[sub] }
                          label={null}
                          onChange={ (name, value, valid, group, start, end) => (update(value, { index: index, input: key }, valid, start, end, { index: i, input: sub }))}
                          className="flex-1"
                        />
                      })}
                        {
                          input.length > 1 &&
                          <Button 
                            small 
                            color='slate' 
                            icon='trash' 
                            iconButton 
                            iconColor='red' 
                            className="!py-6 !px-[25px]"
                            action={ () => deleteGroupStyle(index, i) }
                          />
                        }
                    </div>
                  ))}
                </div>
                <Button 
                    small 
                    color='slate' 
                    icon='plus' 
                    iconButton 
                    iconColor='dark' 
                    className="!py-5 mt-4"
                    action={ () => addGroupStyle(index) }
                  />
              </div>
              }
            })}
            {
              groups.length > 1 &&
              <Button 
                icon='trash' 
                action={ () => deleteGroup(index) }
                className={ `${Style.deleteButton} mt-4` }
              />
            }

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