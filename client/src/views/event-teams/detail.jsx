/***
*
*   EVENT/DETAIL
*   View the details of an individual event
*
**********/

import { useEffect, useState, useContext } from 'react';
import { Animate, Card, Table, Search, useAPI, Form, ViewContext, useNavigate, Breadcrumbs, useLocation } from 'components/lib';

export function TeamsDetail(props){

  const viewContext = useContext(ViewContext); 
  const router = useNavigate();
  const location = useLocation();
  const path = location?.pathname?.split('/');
  const id = path[4];

  const teamData = useAPI(`/api/event-management/team/${id}`);

  // Dummy data
  const [form, setForm] = useState({
  first_member_name: {
    label: 'Name of First Team Member',
    type: 'text',
    required: true,
  },
  team_members: {
    label: 'All Team Members',
    type: 'multiselect',
    placeholder: 'Select team members',
    required: true,
    options: []
  },
  assignment_method: {
    label: 'Assignment Method',
    type: 'select',
    required: true,
    options: [
      { label: 'Assigned by Admin', value: 'assigned by Admin' },
      { label: 'Assigned by AI', value: 'assigned by AI' }
    ]
  }
  });

  const init = (datas) => {
    if (datas.data) {
      const data = datas.data;
      
      const f = { ...form };
      
      f.first_member_name.value = data.first_member_name ?? '';
      f.first_member_name.default = data.first_member_name ?? '';

      if(data.team_members){
        const values = data.team_members?.map((dt) => {
          return { label: dt, value: dt }
        })
        
        f.team_members.options = values;
        f.team_members.value = values?.map((val) => val.value);
      }
      
      f.assignment_method.value = data.assignment_method ?? '';
      f.assignment_method.default = data.assignment_method ?? '';

      setForm(f);
    }
  }
  
  useEffect(() => {
    const timer = setTimeout(() => {
      init(teamData)
    }, 30);
    return () => clearTimeout(timer)
  }, [teamData.data]);
  
    return (
      <Animate>
  
        <Breadcrumbs items={[
          { name: 'groups', url: '/event-management' },
          { name: 'teams', url: `/event-management/teams/${id}` },
          { name: 'detail', url: `/event-management/teams/${id}` }
        ]}/>
  
        <Card loading={ teamData.loading }>
  
          { form &&
          <Form inputs={ form } disabled />}
  
        </Card>
      </Animate>
    )
}
