/***
*
*   EVENT/DETAIL
*   View the details of an individual event
*
**********/

import { useEffect, useState, useContext } from 'react';
import { Animate, Card, Table, Search, useAPI, Form, ViewContext, useNavigate, useLocation, Breadcrumbs } from 'components/lib';

export function EventGroupingDetail(props){

  const viewContext = useContext(ViewContext); 
    const router = useNavigate();
    const location = useLocation();
    const path = location?.pathname?.split('/');
    const id = path[4];
  
    const teamData = useAPI(`/api/group/${id}`);
  
    // Dummy data
    const [form, setForm] = useState({
    group_name: {
      label: 'Group Name',
      type: 'text',
      required: true,
    },
    teams: {
      type: 'multiselect',
      label: 'Add Teams',
      placeholder: 'Select teams',
      required: true,
      options: []
    },
    age_group: {
      label: 'Age Group',
      type: 'text',
      required: true,
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
      ]
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
        
        f.group_name.value = data.group_name ?? '';
        f.group_name.default = data.group_name ?? '';
  
        if(data.team_ids){
          const values = data.team_ids?.map((dt) => {
            const members = dt?.members?.map((member) => member.first_name ? `${member.first_name} ${member.last_name}` : member.name)?.join(', ')
            return { label: members, value: members }
          })
          
          f.teams.options = values;
          f.teams.value = values?.map((val) => val.value);
        }
        
        f.status.value = data.status ?? '';
        f.status.default = data.status ?? '';
        f.age_group.value = data.age_group ?? '';
        f.age_group.default = data.age_group ?? '';
  
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
            { name: 'detail', url: `/event-management/group/${id}` }
          ]}/>
    
          <Card loading={ teamData.loading }>
    
            { form &&
            <Form inputs={ form } disabled />}
    
          </Card>
        </Animate>
      )
}
