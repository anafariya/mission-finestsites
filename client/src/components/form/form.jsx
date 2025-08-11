/***
*
*   FORM
*   Self-validating form that accepts an object for inputs
*
*   PROPS
*   buttonText: submit button text (string, required)
*   callback: function to be executed on successful submit (function, optional)
*   cancel: show a cancel button (boolean, optional)
*   inputs: the object containing the form inputs (object, required)
*   method: HTTP request type (string, optional)
*   onChange: callback function fired when updateOnChange is used (boolean, optional)
*   redirect: url to redirect to after a successful submit (string, optional)
*   submitOnChange: submit the form on each change (boolean, optional)
*   updateOnChange: determine if onChange callback should fire each change (boolean, optional)
*   url: url to send the form to (string, optional)
*
**********/

import { useState, useEffect, useContext, Fragment } from 'react';
import Axios from 'axios';

import { FormHeader, TextInput, NumberInput, EmailInput, URLInput,
  PhoneInput, DateInput, PasswordInput, HiddenInput, Select, FormLink,
  Switch, FileInput, Fieldset, Button, ViewContext, useNavigate, ClassHelper, 
  TimeSelector,
  TextEditor, InputGroup, Multiselect} from 'components/lib'

import Style from './form.tailwind.js';

export function Form(props){

  // context & state
  const context = useContext(ViewContext);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileStore, setFileStore] = useState([]);
  const [processCreditCard, setProcessCreditCard] = useState(false);
  const navigate = useNavigate();
  let valid = true;

  // inputs map
  const Inputs = {

    text: TextInput,
    textarea: TextInput,
    email: EmailInput,
    number: NumberInput,
    url: URLInput,
    date: DateInput,
    hidden: HiddenInput,
    phone: PhoneInput,
    password: PasswordInput,
    radio: Fieldset,
    select: Select,
    checkbox: Fieldset,
    selector: Fieldset,
    switch: Switch,
    header: FormHeader,
    link: FormLink,
    file: FileInput,
    time: TimeSelector,
    editor: TextEditor,
    group: InputGroup,
    multiselect: Multiselect,
  }

  useEffect(() => {

    // if the form is valid and using
    // live updates, refresh the form
    if (valid && props.updateOnChange){

      setForm(props.inputs);

    }

    // otherwise, only init if no form set
    else if (!form){

      let data = {...props.inputs };

      // init credit card
      if (data?.token){

        data?.plan?.default === 'free' ?
        setProcessCreditCard(false) :
        setProcessCreditCard(true);

      }

       setForm(data);
    }
  }, [props, form, valid]);

  if (!form)
    return false;

  function update(input, value, valid, group, start, end, subValue, source, indexSource){
    
    let data = {...form }
    // is it a file?
    if (value && value.length && value[0]?.name && value[0]?.type && value[0]?.size){

      if (!fileStore[input]?.length)
        fileStore[input] = [];

      const newFiles = {...fileStore }
      const labelImg = group?.input ? `${input}_${group.input}_${(value[0].name).replaceAll('/', '').replaceAll('/', '').replaceAll(' ', '')}_${Date.now()}` : input;
      !newFiles[labelImg] && (newFiles[labelImg] = []);
      
      value.forEach(file => {

        // add or delete the file
        if (file.data && !fileStore[labelImg]?.find(x => x.name === file.name)){

          newFiles[labelImg].push(file);

        }
        else if (!file.data) {

          newFiles[labelImg].splice(newFiles[labelImg].findIndex(x => x.name === file.name), 1);

        }
      })
      if(group?.input){
        data[input].group[group.index][group.input].value = newFiles[labelImg];
        data[input].group[group.index][group.input].valid = valid;
      } else {
        data[input].value = newFiles[labelImg];
        data[input].valid = valid;
      }
      setFileStore(newFiles);

    }

    // is it a group?
    else if (group){
      // sub group for placeholders (card selector)
      if(subValue){
        if(typeof subValue === 'string' && subValue === 'styles'){
          data[source].group[indexSource].type.items[end].styles = value;
        } else if(typeof subValue === 'string' && subValue === 'card'){
          data[source].group[indexSource].type.items = value;
        } else {
          data[source].group[indexSource].type[end][value.index][value.input][subValue.index][subValue.input].value = input
        }
        setForm(data);
      } else if(input === 'items'){
        // deep copy the group to ensure no shared references
        data[end].group[source].type.items = value;
        data[end].group[source].selectionStart = start;
        data[end].group[source].selectionEnd = end;
        setForm(data);

      } else {
        if (group.hasOwnProperty('index')){
            
            // deep copy the group to ensure no shared references
            const newGroup = JSON.parse(JSON.stringify(data[input].group));
    
            // update existing group
            newGroup[group.index][group.input].value = value;
            newGroup[group.index][group.input].valid = valid
            newGroup[group.index][group.input].selectionStart = start;
            newGroup[group.index][group.input].selectionEnd = end;
            data[input].group = newGroup;
          }
        else {
          
          if(end && source){
            data[source].group[indexSource].type[end][value.index][value.input].value = input
            setForm(data);
          } else {
            // add group - full obj is passed from group.jsx
            data[input].group = value;
            data[input].selectionStart = start;
            data[input].selectionEnd = end;
            setForm(data);
          }

        }
      }
    }
    else {
      if(end && source){
        if (input && input.length && input[0]?.name && input[0]?.type && input[0]?.size){
    
          const newFiles = {...fileStore }
          const labelImg = value.input ? `${source}_${indexSource}_${value.input}_${value.index}_${(input[0].name).replaceAll('/', '').replaceAll('/', '').replaceAll(' ', '')}_${Date.now()}` : source;
          !newFiles[labelImg] && (newFiles[labelImg] = []);
          
          input.forEach(file => {
    
            // add or delete the file
            if (file.data && !fileStore[labelImg]?.find(x => x.name === file.name)){
    
              newFiles[labelImg].push(file);
    
            }
            else if (!file.data) {
    
              newFiles[labelImg].splice(newFiles[labelImg].findIndex(x => x.name === file.name), 1);
    
            }
          })
          data[source].group[indexSource].type[end][value.index][value.input].value = newFiles[labelImg];
          data[source].group[indexSource].type[end][value.index][value.input].valid = valid;
          data[source].group[indexSource].type[end][value.index][value.input].isDelete = false
          setFileStore(newFiles);
        } else {
          if(subValue) {
            data[source].group[indexSource].type[end][value.index][value.input][subValue.index][subValue.input].value = input
            data[source].group[indexSource].type[end][value.index][value.input][subValue.index][subValue.input].valid = valid
          } else {

            if(typeof input === 'boolean') {
              data[source].group[indexSource].type[end][value.index][value.input].default = input;
            }
            if(data[source].group[indexSource].type[end][value.index][value.input].type === 'file'){
              if(JSON.stringify(input) === '[]'){
                data[source].group[indexSource].type[end][value.index][value.input].isDelete = true
              } else {
                data[source].group[indexSource].type[end][value.index][value.input].isDelete = false
              }
            }
            data[source].group[indexSource].type[end][value.index][value.input].value = input
            data[source].group[indexSource].type[end][value.index][value.input].valid = valid
          }
          
        }
        setForm(data);
      } else {
        // update input value & valid state
        data[input].value = value;
        data[input].valid = valid;
        if(typeof value === 'boolean') {
          data[input].default = value;
        }
        setForm(data);
      }

      // hide credit card input when selecting free plan
      if (props.inputs.token){
        if (input === 'plan' && value === 'free'){

          setProcessCreditCard(false)

        }
        else if (input === 'plan' && value !== 'free') {

          setProcessCreditCard(true)

        }
      }
    }
    setForm(data);
    
    props.updateOnChange &&
    props.onChange({ input: input, value: value, valid: valid, group: group, indexSource, source });

    props.submitOnChange && submit();

  }

  function validate(){

    // loop over each input and check it's valid
    // show error if input is required and value is
    // blank, input validation will be executed on blur

    let errors = [];
    let data = {...form };

    // loop the inputs
    for (let input in data){

      let inp = data[input];
      // group input
      if (inp.type === 'group'){
        

        let groupErrors = [];

        inp.group.forEach(group => {
          Object.keys(group).map(key => {

            const input = group[key]
            
            if (input.required){  
              if (!input.value || input.value === 'unselected'){
  
                input.valid = false;
                errors.push(false);
                groupErrors.push(false);
      
              }
              if (input.value === 'group'){
        
                input.items.forEach(group => {
                  Object.keys(group).map(key => {
        
                    const input = group[key]
                    
                    
                    if (input?.required){  
                      if (!input.value || input.value === 'unselected'){
          
                        input.valid = false;
                        errors.push(false);
                        groupErrors.push(false);
              
                      }
                    }
                  })
                });
                input.valid = groupErrors.length ? false : true;
              }
                if (input.value === 'card_selector'){
        
                  input.items.forEach(group => {
                    Object.keys(group).map(key => {
          
                      const input = group[key]
                      
                      if (input?.required){  
                        if (!input.value || input.value === 'unselected'){
            
                          input.valid = false;
                          errors.push(false);
                          groupErrors.push(false);
                
                        }
                      }

                      if(Array.isArray(input)){
                        input?.map((sub, i) => {
                          Object.keys(sub).map((dt, ind) => {
                            if(!sub[dt].value || sub[dt].value === ''){
                              
                              input[i][dt].valid = false;
                              errors.push(false);
                              groupErrors.push(false);
                            }
                          })
                        })
                      }
                    })
                  });
        
                  input.valid = groupErrors.length ? false : true;
        
              }
              else {
        
                // standard input
                if (input.value === undefined && input.default)
                  data[input].value = input.default;
        
                if (input.required){
                  if (!input.value || input.value === 'unselected'){
        
                    input.valid = false;
                    errors.push(false);
        
                  }
                }
              }
            }
          })
        });

        inp.valid = groupErrors.length ? false : true;

      }
      else {
        
        // standard input
        if (inp.value === undefined && inp.default)
          data[input].value = inp.default;

        if (inp.required){
          if (!inp.value || inp.value === 'unselected'){

            inp.valid = false;
            errors.push(false);

          }
        }
      }

      if (inp.valid === false)
        errors.push(false);

    }

    if (errors.length){

      // form isn't valid
      valid = false;
      setForm(data);
      return false;

    }
    else {

      // form is valid
      return true;

    }
  }

  function getFile(name) {

    // iterate over all keys in the fileStore object
    for (let key in fileStore) {
      if (fileStore.hasOwnProperty(key)){

        // find the file in the array of files under each key
        let file = fileStore[key].find(file => file.name === name);
        if (file) return file;  

      }
    }

    return null; 

  }

  async function submit(is_draft){
    
    // submit the form
    setLoading(true);
    let data = {...form };

    // is the form valid?
    if (!validate()){
      setLoading(false);
      return false;
    }
      
    // optimise data for server
    for (let key in form){
      
      const input = form[key];

      if (input.type !== 'header'){

        // process group
        if (input.type === 'group'){

          data[key] = [];
          
          input.group.forEach(inp => {

            let g = {}
            Object.keys(inp).map((childKey, index) => {
              g[childKey] = inp[childKey].type === 'switch' ? inp[childKey].value || inp[childKey].default || false : inp[childKey].value
              // handle group items
              if (['group', 'card_selector'].includes(inp[childKey].value)){
          
                  inp[childKey].items.map((group, i) => {
                    let w = {}
                    Object.keys(group).map(key => {
                      if(Array.isArray(group[key])){
                        const sub = group[key]
                        w[key] = []
                        sub.map((child, i) => {
                          w[key][i] = {}
                          Object.keys(child).map(c => {
                            w[key][i][c] = child[c].value
                          })
                        })
                      } else if(group[key]){
                        if(group[key].type === 'file'){
                          if(!group[key].value && group[key].preview){
                            const match = group[key].preview.match(/\/template\/[^\/]+\.\w+/);
                            const filename = match ? match[0].substring(1) : null;
                            w[key] = filename
                          } else if (group[key].value){
                            w[key] = group[key].value[0]?.name || null
                          }
                        } else {
                          w[key] = group[key].type === 'switch' ? group[key].default || false :  group[key].value
                        }
                      }
                      
                    })
                    if(g.items){
                      g.items[i] = w
                    } else {
                      g.items = [w]
                    }
                  });
          
                }
            })

            data[key].push(g);
          })
        }
        else {
          data[key] = input.type === 'switch' ? input.value || input.default || false : input.value
        }

      }
    }
    
    delete data.header;
    // submit the form or execute callback
    if (!props.url){

      if (props.callback)
        props.callback(null);

      return false;

    }
    try {

      let formData = new FormData(), headers = {};
      if (Object.keys(fileStore).length){
      
        // for client side uploads just pass the filename not the file
        if (props.clientSideUpload){

          for (let key in data) {
            if (
              Array.isArray(data[key]) &&
              data[key].length > 0 &&
              typeof data[key][0] === "object" &&
              data[key][0] !== null &&
              "data" in data[key][0] // Safer check for property existence
            ) {
              data[key] = data[key][0].name; // Update value
            }
          }
          data.changeImage = true
        }
        else {

          headers['Content-Type'] = 'multipart/form-data';
          headers['Accept'] = 'application/json';

          for (let key in data){

            // append files
            if (Array.isArray(data[key]) && data[key][0].hasOwnProperty('data')){
              for (let i = 0; i < data[key].length; i++){

                formData.append(key, data[key][i].data);
              
              }
            }
            else {

              // append text values
              if (typeof data[key] === 'object')
                formData.append(key, JSON.stringify(data[key]));
              else 
                formData.append(key, data[key]);

            }
          }

          data = formData;

        }
      }

      if(is_draft){
        data.is_draft = true
      }
      // return
      let res = await Axios({

        method: props.method,
        url: props.url,
        data: data

      });

      // client sideupload
      if (res.data.files_to_upload?.length){

        // warning notification
        context.notification.show(res.data.message, 'warning', false);

        for (const fileToUpload of res.data.files_to_upload){

          const file = getFile(fileToUpload.name);
          if (file){            
            await fetch(fileToUpload.url, {

              method: 'PUT',
              headers: { 'Content-Type': file.type },
              body: file.data

            });
          }
        }
      }

      // upload callback
      if (res.data.upload_callback)
        Axios({ method: 'post', url: res.data.upload_callback });

      // finish loading
      setLoading(false);

      // close the modal
      context.modal.hide(false, res.data.data);

      // callback?
      if (props.callback)
        props.callback(res);

      // redirect?
      if (props.redirect)
        navigate(props.redirect);

      // success notification
      if (res.data.message)
        context.notification.show(res.data.message, 'success', true);
  
    }
    catch (err){

      // handle error
      console.log(err);
      setLoading(false);
      context.modal.hide(true);

      // show error on input
      if (err.response?.data?.inputError){

        let data = {...form }
        const input = err.response.data.inputError;
        data[input].valid = false;
        data[input].errorMessage = err.response.data.message;
        valid = false;
        setForm(data);
        return false;

      }
      else {

        // general errors handled by view
        context.handleError(err);

      }
    }
  }
  // function update(input, value, valid){

  //   let data = {...form }

  //    // is it a file?
  //    if (value.length && value[0].name && value[0].type && value[0].size){

  //   if (!fileStore[input]?.length)
  //     fileStore[input] = [];

  //    const newFiles = {...fileStore }
  //    value.forEach(file => {

  //       // add or delete the file
  //       if (file.data && !fileStore[input].find(x => x.name === file.name)){

  //         newFiles[input].push(file);


  //       }
  //       else if (!file.data) {

  //         newFiles[input].splice(newFiles[input].findIndex(x => x.name === file.name), 1);

  //       }
  //     })

  //     data[input].value = newFiles[input];
  //     data[input].valid = valid;
  //     setFileStore(newFiles);

  //   }
  //   else {

  //     // update input value & valid state
  //     data[input].value = value;
  //     data[input].valid = valid;

  //     // hide credit card input when selecting free plan
  //     if (props.inputs.token){
  //       if (input === 'plan' && value === 'free'){

  //         setProcessCreditCard(false)

  //       }
  //       else if (input === 'plan' && value !== 'free') {

  //         setProcessCreditCard(true)

  //       }
  //     }
  //   }

  //   setForm(data);
    
  //   props.updateOnChange &&
  //   props.onChange({ input: input, value: value, valid: valid });

  //   props.submitOnChange && submit();

  // }

  // function validate(){

  //   // loop over each input and check it's valid
  //   // show error if input is required and value is
  //   // blank, input validation will be executed on blur

  //   let errors = [];
  //   let data = {...form };

  //   // loop the inputs
  //   for (let input in data){

  //     // standard input
  //     let inp = data[input];
  //     if (inp.value === undefined && inp.default){

  //       data[input].value = inp.default;

  //     }

  //     if (inp.required){
  //       if (!inp.value || inp.value === 'unselected'){

  //         inp.valid = false;
  //         errors.push(false);

  //       }
  //     }

  //     if (inp.valid === false){

  //       errors.push(false);

  //     }
  //   }

  //   if (errors.length){

  //     // form isn't valid
  //     valid = false;
  //     setForm(data);
  //     return false;

  //   }
  //   else {

  //     // form is valid
  //     return true;

  //   }
  // }

  // async function submit(){

  //   // submit the form
  //   setLoading(true);
  //   let data = {...form };

  //   // is the form valid?
  //   if (!validate()){

  //     setLoading(false);
  //     return false;

  //   }
      
  //   // optimise data for server
  //   for (let input in form){
  //     if (input !== 'header'){

  //       // process single input & ignore headers
  //       data[input] = form[input].value;

  //     }
  //   }

  //   delete data.header;

  //   // submit the form or execute callback
  //   if (!props.url){

  //     if (props.callback)
  //       props.callback(null);

  //     return false;

  //   }

  //   try {

  //     let formData = new FormData(), headers = {};
  //     if (Object.keys(fileStore).length){

  //       headers['Content-Type'] = 'multipart/form-data';
  //       headers['Accept'] = 'application/json';

  //       for (let key in data){

  //         // append files
  //         if (Array.isArray(data[key]) && data[key][0].hasOwnProperty('data')){
  //           for (let i = 0; i < data[key].length; i++){

  //             formData.append(key, data[key][i].data);
            
  //           }
  //         }
  //         else {

  //           // append text values
  //           formData.append(key, data[key]);

  //         }
  //       }

  //       data = formData;

  //     }

  //     let res = await Axios({

  //       method: props.method,
  //       url: props.url,
  //       data: data

  //     });

  //     // finish loading
  //     setLoading(false);

  //     // close the modal
  //     context.modal.hide(false, res.data.data);

  //     // callback?
  //     if (props.callback)
  //       props.callback(res);

  //     // redirect?
  //     if (props.redirect)
  //       navigate(props.redirect);

  //     // success notification
  //     if (res.data.message)
  //       context.notification.show(res.data.message, 'success', true);

  //   }
  //   catch (err){

  //     // handle error
  //     setLoading(false);
  //     context.modal.hide(true);

  //     // show error on input
  //     if (err.response?.data?.inputError){

  //       let data = {...form }
  //       const input = err.response.data.inputError;
  //       data[input].valid = false;
  //       data[input].errorMessage = err.response.data.message;
  //       valid = false;
  //       setForm(data);
  //       return false;

  //     }
  //     else {

  //       // general errors handled by view
  //       context.handleError(err);

  //     }
  //   }
  // }

  let inputsToRender = [];
  const formStyle = ClassHelper(Style, {...props, ...{
    
    loading: props.loading || loading,
    columns: props.cols
  }});

  // map the inputs
  Object.keys(form).map(name => {

    // get the values for this input
    const data = form[name];
    data.name = name;
    inputsToRender.push(data);
    return inputsToRender;

  });

  const inputsToRender2 = inputsToRender.map(input => {

        if (input.type === null)
          return false;

        if (!input.type)
          input.type = 'text';

        if (input.type === 'creditcard' && !processCreditCard)
          return false;

        const Input = Inputs[input.type];

        return (
          <Input
           key={ input.name }
           type={ input.type }
           form={ props.name }
           label={ input.label }
           className={ input.class }
           name={ input.name }
           value={ input.value }
           required={ input.required }
           valid={ input.valid }
           min={ input.min }
           max={ input.max }
           options={ input.options }
           default={ input.default }
           url={ input.url }
           text={ input.text }
           title={ input.title }
           accept={ input.accept }
           description={ input.description }
           readonly={ input.readonly }
           maxFileSize={ input.maxFileSize }
           handleLabel={ input.handleLabel }
           placeholder={ input.placeholder }
           errorMessage={ input.errorMessage }
           onChange={ update }
           complexPassword={ input.complexPassword }
           disabled={props.disabled}
           isDetail={input.isDetail}
           group={input.group}
           preview={input.preview}
          />
        );
  })

  // render the form
  return(

    <form
      action={ props.action }
      method = { props.method }
      onSubmit={ submit }
      className={ formStyle }
      encType={ fileStore.length && 'multipart/form-data' }
      noValidate>

        { props.cols ? (
          <Fragment>

            <div className={ Style.column }>
              { inputsToRender2.slice(0, props.cols.left) }
            </div>
            <div className={ Style.column }>
              { inputsToRender2.slice(props.cols.left, props.cols.left + props.cols.right || inputsToRender.length) }
            </div>

          </Fragment>
        ) : inputsToRender2 }
      <div className="mt-4 flex lg:flex-row gap-2 flex-col">
        { props.buttonDraftText &&
          <Button
            color={ props.destructive ? 'red' : 'blue' }
            loading={ loading }
            text={ props.buttonDraftText }
            action={() => submit('draft') }
            className={ Style.button }
            fullWidth={ !props.cancel }
          />
        }
        { props.buttonText &&
          <Button
            color={ props.destructive ? 'red' : 'green' }
            loading={ loading }
            text={ props.buttonText }
            action={ submit }
            className={ Style.button }
            fullWidth={ !props.cancel }
          />
        }


        { props.cancel &&
          <Button 
            color={ props.destructive ? 'green' : 'red' } 
            outline 
            text='Cancel' 
            className={ Style.button }
            action={ props.cancel } 
          />
        }
      </div>
    </form>
  );
}
