/***
*
*   EVENT BOOKING
*   View the lists of an individual event
*
**********/

import { useEffect, useState, useContext } from 'react';
import { Animate, Card, Table, Search, useAPI, Form, ViewContext, useNavigate, useLocation } from 'components/lib';

export function EventBooking(props){

  const viewContext = useContext(ViewContext); 
  const router = useNavigate();
  const location = useLocation();
  const path = location?.pathname?.split('/');
  const id = path[3];
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const registeredUsers = useAPI(`/api/transaction/event/${id}`)

  return (
    <Animate>
      <Search throttle={1000} callback={(x) => setSearch(x)} /><br/>

      <Card title="Registered Users">
        <Table  
          loading={loading}
          data={registeredUsers?.data}
          isProfileView={true}
          show={['name', 'age', 'status', 'team_partner', 'team_partner_age']}
          badge={{ col: 'status', condition: [
            {
              value: 'paid',
              color: 'green'
            },
            {
              value: 'cancelled',
              color: 'red'
            },
            {
              value: 'unpaid',
              color: 'orange'
            }
          ] }}
        />
      </Card>
    </Animate>
  );
}
