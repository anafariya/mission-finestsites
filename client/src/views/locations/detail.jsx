/***
*
*   EVENT/DETAIL
*   View the details of an individual event
*
**********/

import { useEffect, useState } from 'react';
import { Animate, Card, Breadcrumbs, Form, useAPI, useLocation } from 'components/lib';

export function LocationsDetail(props){

  const location = useLocation();
  const path = location?.pathname?.split('/');
  const group = path[2];
  const id = path[2];

  // fetch
  const locations = useAPI(`/api/location/${id}`);
  const [form, setForm] = useState(null);

  const handleForm = (id, locations) => {
    if (id && locations.data) {
      if (locations.data){

        let time = locations.data.time?.split('T');

        const f = {};
        Object.keys(locations.data).forEach(key => {
          if(key !== 'createdAt' && key !== 'updatedAt' && key !== '_id') {
            f[key] = {
              label: key.replaceAll('_', ''),
              value: typeof locations.data[key] === 'object' ? locations.data[key]?.name : locations.data[key],
              type: locations.data[key] ? 'text' : null,
            }
          }
        });

        if (f.internal_notes?.value)
          f.internal_notes.type = 'textarea';

        if (f.directions?.value)
          f.directions.type = 'textarea';

        if (f.image?.value) {
          f.image.value = [f.image.value];
          f.image.preview = [f.image.value];
          f.image.type = 'file';
          f.image.isDetail = true;
        }

        setForm(f);      
      }
    }
  }
  
  useEffect(() => {
    const timer = setTimeout(() => {
      handleForm(id, locations)
    }, 30)
  
    return () => clearTimeout(timer)
  }, [locations, id]);

  return (
    <Animate>

      <Breadcrumbs items={[
        { name: 'groups', url: '/locations' },
        { name: 'detail', url: `/locations/${id}` }
      ]}/>

      <Card loading={ locations.loading }>

        { form &&
        <Form inputs={ form } disabled />}

      </Card>
    </Animate>
  )
}