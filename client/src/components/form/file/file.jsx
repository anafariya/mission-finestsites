/***
*
*   FILE UPLOADER
*   Drag & drop file upload component
*   Can upload multiple files
*   Includes fallback for older browsers
*   Props are passed from the form
*
*   PROPS
*   accept: filetypes to accept, eg. ['jpg', 'gif'] (array, optional)
*   errorMessage: custom error message (string, optional)
*   label: input label (string, optional)
*   max: max number of files (integer, optional)
*   maxFileSize: limit the size of file in mb (integer, optional)
*   name: input name (string, required)
*   onChange: callback function that executes on change (function, required)
*   required: this input is required (boolean, optional)
*   value: the form value
*   
**********/

import { useState, useRef, useEffect } from 'react';
import { Icon, Button, ClassHelper } from 'components/lib';
import { Label } from '../label/label';
import { Error } from '../error/error';
import Style from './file.tailwind.js';

export function FileInput(props){

  const fileInputRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [valid, setValid] = useState(undefined);
  const [error, setError] = useState(props.errorMessage || 'Please select a file');
  const [fileSize, setFileSize] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileProgress, setFileProgress] = useState('0%');
  const [fileError] = useState(false);

  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [visible, setVisible] = useState(false);

  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    let intervalId;
    let hideTimeout;

    if (progress === 100) {
      clearInterval(intervalId); // Clear the interval when the progress reaches 100%
      // Hide the progress bar
      hideTimeout = setTimeout(() => {
        setVisible(false);
        setIsRunning(false); // Stop running to reset state if needed
        setFileProgress(`0%`)
      }, 2000);

    }
    
    if (isRunning && progress <= 100) {
      setVisible(true); // Show the progress bar when it starts
      intervalId = setInterval(() => {
        setFileProgress(`${progress}%`)
        // Increment the progress randomly between 1% and 10%
        setProgress((prevProgress) => Math.min(prevProgress + Math.floor(Math.random() * 10) + 1, 100));
      }, 100); // Adjust the interval (milliseconds) to control the speed
    }

    return () => {
      clearInterval(intervalId);
      clearTimeout(hideTimeout);
    };
  }, [isRunning, progress]);

  function validate(files){
    let fileStore = [];

    // check for max files
    if (((files.length + (props.value?.length || 0)) > props.max) && !props.single){

      setValid(false);
      setError(`Maximum of ${props.max} file`);
      return false;

    }
    else {

      // check files exist
      if (files.length){
        for (let i = 0; i < files.length; i++){

          const file = files[i];
          const type = file.type.substring(file.type.indexOf('/')+1).toString();

          // validate file type
          if (props.accept?.length && !props.accept.includes(type)){

            setValid(false);            
            setError(`.${file.type.substring(file.type.indexOf('/')+1)} files are not allowed}`);

          }

          // validate file size (in mb)
          else if (file.size > (1048576 * 5)){

            setValid(false);
            setError(`Max filesize: 5mb`);

          }
          
          else {
            setProgress(0); // Reset progress if needed
            setIsRunning(true);
            // store the file in form store
            setValid(true);
            setFileName(file.name);
            setFileSize(file.size);
            if(props.single) {
              fileStore = [{ 
              
                name: file.name, 
                data: file, 
                url: URL.createObjectURL(file), 
                size: file.size, 
                type: file.type 
               
              }];
            } else {
              fileStore.push({ 
                
                name: file.name, 
                data: file, 
                url: URL.createObjectURL(file), 
                size: file.size, 
                type: file.type 
               
              });
            }
          }
        }
        setShowUpload(false)
        props.onChange(props.name, fileStore, true);

      }
    }
  }

  function deleteFile(file){

    fileInputRef.current.value = '';

    props.removeFile ? props.removeFile(props.name, [{ 
              
      name: file.name, 
      size: file.size, 
      type: file.type 
     
    }], true) :

    props.onChange(props.name, [{ 
              
      name: file.name, 
      size: file.size, 
      type: file.type 
     
    }], true);
  }

  function onDrag(e, state){

    e.preventDefault();
    e.stopPropagation();
    setDragging(state);

  }

  const fileStyle = ClassHelper(Style, {      

     dropzone: true,
     dragging: dragging,
     error: valid === false ? true : false,
     success: props.value?.length && valid === true

  });

  return(
    <div className={ Style.file }>
      { props.label && 
        <Label
          text={ props.label }
          required={ props.required }
          for={ props.name }
          className="font-bold"
        />
      }

      { ((props.value || props.preview) && !showUpload) ? 
        <div className={`${Style.preview} relative group`}>
          {/* Image with hover effect applied to the parent */}
          {
            (props.value?.[0]?.type !== 'application/zip' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test((props.preview?.split("/")?.pop()?.split("?")?.[0] || ''))) &&
            <img 
              src={props.value?.[0]?.url || props.preview} 
              alt="Template preview image" 
              className="w-full h-full min-h-[200px] max-h-[400px] object-cover transition duration-300 ease-in-out group-hover:brightness-50 rounded-xl"
            />
          }

          {/* Button inside the div remains unaffected */}
          {
            !props.disabled &&
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <button
                type="button"
                className="cursor-pointer font-sans border-solid border border-slate-200 bg-[#D5C6FB] w-max inline-block relative text-center font-semibold px-12 py-3 ease-in-out duration-500 text-black uppercase rounded-[8px] hover:bg-[#bda5fb]"
                onClick={(e) => {
                  e.preventDefault();
                  setShowUpload(!showUpload);
                  props.onChange(props.name, [], props.required ? false : true);
                }}
              >
                Upload new image
              </button>
            </div>
          }
        </div>

      :
        !props.disabled && <div className={ fileStyle }

          onClick={ e => fileInputRef.current.click() }
          onDragOver={ e => onDrag(e, true) }
          onDragEnter={ e => onDrag(e, true) }
          onDragLeave={ e => onDrag(e, false) }
          onDrop={ e => { 
            
            onDrag(e, false)
            validate(e.dataTransfer.files)
            
          }}>

          { /* fallback for old browsers */}
          <input 
            type='file' 
            className={ Style.legacyInput }
            files={ props.value }
            ref={ fileInputRef } 
            onChange={ e => {

              validate(fileInputRef.current.files)

          }}/>

          <div className={ Style.label }>
            <div className="flex flex-col justify-center items-center rounded-full bg-[#F4EBFF] w-[40px] h-[40px] mb-4">
              <Icon image={ props.value?.length ? 'check' : 'upload'} className={ Style.labelIcon }/>
            </div>

            { props.value?.length ?
              <FileList files={ props.value } delete={ deleteFile }/> :
              <div className={ Style.labelText } dangerouslySetInnerHTML={{__html: `<b>Click to upload</b> or drag and drop`}}></div>
            }

          </div>
        </div>
      }
      
      {
        (showUpload)&&
        <div className="my-4">
          <button
          type={'button'}
            className={ `cursor-pointer font-sans border-solid border border-slate-200 bg-[#D5C6FB] w-max inline-block mr-[2%] last:mr-0 relative text-center font-semibold px-12 py-3 ease-in-out duration-500 text-black uppercase rounded-[8px] hover:bg-[#bda5fb]` }
            onClick={(e) => {
              e.preventDefault()
              setShowUpload(!showUpload)
              props.onChange(props.name, undefined, props.required ? (props.preview ? true : false) : true);
            }}>
            {!showUpload ? 'Upload new image' : 'Reset image'}
          </button>
        </div>
        
      }

        
      { (valid === false || props.valid === false)
         && <Error message={ error }/> }

    </div>
  );
}

function FileList(props){
  if (!props.files?.length)
    return false;

  return (
    <div>
      { props.files?.map(file => {

        return (
          <div key={ file.name } className={ Style.fileListItem }>

          <span>{ file.name }</span>

          <Button 
            icon='x' 
            color='#d95565' 
            size={ 13 } 
            className={ Style.fileListButton }
            action={ e => (props.delete(file)) }
          />
        </div>
        )
      })}
    </div>
  )
}