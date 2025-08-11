/***
*
*   useAPI hook
*   Interact with API calls – handle errors, return loading state and data
*
*   PROPS
*   method: get, post, put (string, required, default: get)
*   url: endpoint url (string, required)
*
**********/

import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import Axios from 'axios';
import { ViewContext } from 'components/lib';

export function useAPI(url, method, trigger){

  // wrap in useRef to prevent triggering useEffect multiple times  
  const context = useRef(useContext(ViewContext));
  const [state, setState] = useState({ data: undefined, loading: false })

  const fetch = useCallback(async () => {
    try {

      if (!url){

        setState({ data: null, loading: false });
        return false;

      }

      setState({ loading: true });
      const res = await Axios({

        url: url,
        method: method || 'get',
        
      })

      setState({ data: res.data.data, loading: false });

    }
    catch (err){

      context?.current &&
      context.current.handleError(err);
      setState({ data: null, loading: false, err: err.response.data });


    }
  }, [url, method, context, trigger]);

  useEffect(() => {

    fetch()

  }, [fetch]);

  return state

}
