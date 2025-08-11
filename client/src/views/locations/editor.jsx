/***
*
*   NEW TEMPLATE
*   Upload a new template
*
**********/

import { useState, useEffect } from 'react';
import { Animate, Card, Form, useLocation, Helper, Loader, useAPI } from 'components/lib';

import Settings from 'settings';
const BUCKET = Settings[process.env.NODE_ENV].s3_bucket;

export function LocationEditor(props){

  const location = useLocation();
  const path = location?.pathname?.split('/');
  const group = path[2];
  const id = path[3];
  const locations = useAPI(id ? `/api/location/${id}` : false)
  const city = useAPI(`/api/city`)
  const [form, setForm] = useState({
    name: {
      type: 'text',
      required: true,
      label: 'Name of the Location',
      errorMessage: 'Please enter the name of the location',
    },
    city: {
      label: 'City',
      type: 'select',
      required: true,
      options: null
    },
    address: {
      type: 'text',
      required: true,
      label: 'Address',
      errorMessage: 'Please enter the address',
    },
    directions: {
      type: 'textarea',
      required: false,
      label: 'Directions',
      placeholder: 'Provide any specific directions if needed',
    },
    image: {
      type: 'file',
      required: false,
      label: 'Optional Image',
      accept: ['jpg', 'jpeg', 'png'],
      max: 1,
      errorMessage: 'Please upload a valid image file',
    },
    contact_person: {
      type: 'text',
      required: true,
      label: 'Contact Person',
      errorMessage: 'Please provide a contact person',
    },
    contact_details: {
      type: 'text',
      required: true,
      label: 'Contact Details',
      errorMessage: 'Please provide contact details (email or phone)',
    },
    internal_notes: {
      type: 'textarea',
      required: false,
      label: 'Internal Notes',
      placeholder: 'Notes only visible to admins or staff',
    },
  });

  const handleForm = (id, locations) => {
    if (id && locations.data) {
      const data = locations.data;
      const f = { ...form };
  
      f.name.value = data.name;
      f.city.value = data.city._id;
      f.city.default = data.city._id;
      f.address.value = data.address;
      f.directions.value = data.directions;
      
      if (data.image) {
        f.image.preview = data.image.startsWith('http')
          ? data.image
          : `${BUCKET}/locations/${data.image}`;
      }
  
      f.contact_person.value = data.contact_person;
      f.contact_details.value = data.contact_details;
      f.internal_notes.value = data.internal_notes;
  
      setForm(f);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      handleForm(id, locations)
    }, 30)

    return () => clearTimeout(timer)
  }, [locations, id]);

  const handleCity = (city, form) => {
    const f = { ...form };
    f.city.options = city?.data?.map((ct) => {
      return {
        label: ct.name, value: ct._id
      }
    })
    setForm(f);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      handleCity(city, form)
    }, 30)

    return () => clearTimeout(timer)
  }, [city, form])

  if (locations.loading)
    return <Loader />

  return (
    <Animate>

      <Card title={ id ? 'Edit Location' : 'New Location' }>
        <Form
          cols={{ left: Object.keys(form).length-1, right: 1 }}
          inputs={ form }
          clientSideUpload
          method={ id ? 'patch' : 'post' }
          url={ id ? `/api/location/${id}` : '/api/location' }
          buttonText={ id ? 'Save Changes' : 'Create Location' }
          redirect={ id ? false : '/locations' }
          callback={ res => {

            // clear file inputs after uploading
            const f = {...form }

            setForm(f);

          }}
        />
      </Card>
    </Animate>
  )
}