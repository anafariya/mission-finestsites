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

export function GroupEditor(props){

  const location = useLocation();
  const path = location?.pathname?.split('/');
  const eventId = path[3];
  const id = path[5];
  const groupData = useAPI(id ? `/api/group/${id}` : false)
  const teams = useAPI(`/api/teams/event/${eventId}`)
  const locations = useAPI(`/api/event-management/locations/${eventId}`)

  console.log(locations);
  

  const [form, setForm] = useState({
    event_id: {
      type: 'hidden',
      value: eventId,
    },
    group_name: {
      label: 'Name',
      type: 'text',
      required: true,
      value: groupData?.group_name
    },
    slot: {
      label: 'Slot',
      type: 'number',
      min: 1,
      max: 3,
      required: true,
      value: groupData?.slot
    },
    bar_id: {
      type: 'select',
      label: 'Location',
      placeholder: 'Select location',
      required: true,
      options: [],
      default: groupData?.bar_id
    },
    group_members: {
      type: 'multiselect',
      label: 'Add Teams',
      placeholder: 'Select teams',
      required: true,
      options: [],
      default: groupData?.teams
    },
    status: {
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Active', value: 'Active'
        },
        {
          label: 'Cancelled', value: 'Cancelled'
        }
      ],
      default: groupData?.status
    },
    ...id !== null ? {
      subject_email: {
        label: 'Subject Email',
        type: 'text',
        required: false,
        value: ''
      },
      body_email: {
        label: 'Body Email',
        type: 'editor',
        required: false,
        value: ''
      },
    } : {}
  });

  const init = (dt, ids, teamsData, locationData) => {
    if (ids && dt?.data && teamsData?.data && locationData?.data) {
      const data = dt.data;
      const f = { ...form };

      f.group_name.value = data.group_name;
      // f.group_members.value = data.group_members;
      f.status.value = data.status;
      f.status.default = data.status;
      f.slot.value = data.slot;
      f.slot.default = data.slot;

      const values = teamsData.data?.map((dt) => {
        const members = dt?.members?.map((member) => `${member.first_name ? `${member.first_name}` : member.name} `)?.join(', ')
        return { label: `${members} (${dt.age_group})`, value: dt._id }
      })
      f.group_members.options = values;
      f.event_id.value = eventId;
      f.group_members.value = data.team_ids?.map((val) => val._id);
      const locationOptions = locationData.data?.bars?.map((dt) => {
        return { label: dt._id.name, value: dt._id._id }
      })
      f.bar_id.options = locationOptions;
      f.bar_id.value = data.bar_id._id;

      if (ids !== null) {
        f.subject_email = {
          label: 'Subject Email',
          type: 'text',
          required: false,
          value: ''
        };
        f.body_email = {
          label: 'Body Email',
          type: 'editor',
          required: false,
          value: ''
        };
      }

      setForm(f);
    } else if(teamsData?.data && locationData?.data){
      const f = { ...form };
      const values = teamsData.data?.map((dt) => {
        const members = dt?.members?.map((member) => `${member.first_name ? `${member.first_name}` : member.name} `)?.join(', ')
        return { label: `${members} (${dt.age_group})`, value: dt._id }
      })
      const locationOptions = locationData.data?.bars?.map((dt) => {
        return { label: dt._id.name, value: dt._id._id }
      })
      f.bar_id.options = locationOptions;
      f.group_members.options = values;
      f.event_id.value = eventId;
      setForm(f);
    }
  }

  useEffect(() => {
    const timer  = setTimeout(() => {
      init(groupData, id, teams, locations)
    }, 30)

    return () => clearTimeout(timer)
  }, [groupData, id, teams, locations]);

  function update(data){
    if (data.input === 'group_members') {
      const f = { ...form };
    
      f.group_members.value = data.value;
    
      setForm(f);
    }
  }


  if (groupData.loading)
    return <Loader />

  return (
    <Animate>

      <Card title={ id ? 'Edit Group' : 'New Group' }>
        <Form
          cols={{ left: 6, right: Object.keys(form).length-2 }}
          inputs={ form }
          clientSideUpload
          updateOnChange
          onChange={ update }
          method={ id ? 'patch' : 'post' }
          url={ id ? `/api/group/${id}` : '/api/group' }
          buttonText={ id ? 'Save Changes' : 'Create Group' }
          redirect={ id ? false : `/event-management/group/${eventId}` }
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