/***
*
*   EVENT BOOKING
*   View the lists of an individual event
*
**********/

import { useEffect, useState, useContext } from 'react';
import { Animate, Card, Table, Search, useAPI, Form, ViewContext, useNavigate, useLocation } from 'components/lib';

export function ParticipantMessages(props){

  const viewContext = useContext(ViewContext); 
  const router = useNavigate();
  const location = useLocation();
  const path = location?.pathname?.split('/');
  const id = path[3];
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(1);
  const chats = useAPI(`/api/event-management/participant-messages/${id}`, 'GET', reload);

  function archiveData(data, callback){

    viewContext.modal.show({
      title: 'Archive',
      text: `Are you sure you want to ${data.status === 'active' ? 'archive' : 'reactivate'} this converstion?`,
      form: {
        isArchive: {
          type: 'hidden',
          value: data.status === 'active'
        },
      },
      buttonText: data.status === 'active' ? 'Archive' : 'Reactivate',
      url: `/api/event-management/archive-chat/${data._id}`,
      method: 'PUT',
      destructive: true,
    }, () => {

      setReload(prev => prev + 1);
    });
  }

  return (
    <Animate>
      <Search throttle={1000} callback={(x) => setSearch(x)} /><br/>

      <Card title="Participant Messages">
        <Table  
          loading={loading}
          data={chats?.data}
          isProfileView={true}
          show={['user_1', 'user_2', 'last_message_by', 'last_message_time', 'status']}
          badge={{ col: 'status', condition: [
            {
              value: 'active',
              color: 'green'
            },
            {
              value: 'archive',
              color: 'red'
            }
          ] }}
          actions={{
            custom: [
              { icon: 'archive', action: (data, i) =>  archiveData(data), title: 'Archive', condition: {
                col: 'status',
                value: 'active'
              }},
              { icon: 'unlock', action: (data, i) =>  archiveData(data), title: 'Reactivate message', condition: {
                col: 'status',
                value: 'archive'
              }}
            ],
          }}
        />
      </Card>
    </Animate>
  );
}
