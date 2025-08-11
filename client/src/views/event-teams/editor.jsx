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

export function TeamsEditor(props){

  const location = useLocation();
  const path = location?.pathname?.split('/');
  const idTeam = path[5];
  const id = path[3];
  const teamData = useAPI(idTeam ? `/api/event-management/team/${idTeam}` : false)
  const users = useAPI(`/api/registered-participant/event/${id}`)

const [form, setForm] = useState({
  team_members: {
    label: 'All Team Members',
    type: 'multiselect',
    placeholder: 'Select team members',
    required: true,
    options: [],
  },
  event_id: {
    type: 'hidden',
    value: id,
  },
  ...(id !== null
    ? {
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
        }
      }
    : {})
  });

  const init = (dt, ids, participants) => {
    if (ids && dt?.data && participants?.data) {
      const data = dt.data;
      const f = { ...form };

      const values = participants.data?.map((dt) => {
        return { label: (dt.first_name ? `${dt.first_name} ${dt.last_name} (${dt.age_group})` : dt.name), value: dt.user_id }
      })
      f.team_members.options = values;
      f.event_id.value = id;
      f.team_members.value = data.members?.map((val) => val._id);

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
    } else if(participants?.data){
      const f = { ...form };
      const values = participants.data?.map((dt) => {
        return { label: dt.first_name ? `${dt.first_name} ${dt.last_name} (${dt.age_group})` : dt.name, value: dt.user_id }
      })
      f.team_members.options = values;
      f.event_id.value = id;
      setForm(f);
    }
  };

  useEffect(() => {
    const timer  = setTimeout(() => {
      init(teamData, id, users)
    }, 30)

    return () => clearTimeout(timer)
  }, [teamData, id, users]);

  if (teamData.loading)
    return <Loader />

  return (
    <Animate>

      <Card >
        <Form
          cols={{ left: 4, right: Object.keys(form).length-2 }}
          inputs={ form }
          method={ idTeam ? 'patch' : 'post' }
          url={ idTeam ? `/api/team/${idTeam}` : '/api/team' }
          buttonText={ idTeam ? 'Save Changes' : 'Create Team' }
          redirect={ idTeam ? false : `/event-management/teams/${id}` }
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