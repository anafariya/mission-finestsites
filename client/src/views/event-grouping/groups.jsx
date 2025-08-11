/***
*
*   EVENT/GROUPS
*   List the events grouped by name
*
**********/
import { useState, useEffect, useContext } from 'react';
import { Animate, Card, Table, Search, useAPI, Form, ViewContext, useNavigate } from 'components/lib';

export function EventGrouping(props){
  const viewContext = useContext(ViewContext); 
  const router = useNavigate();

  // state 
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState([
    {
      id: '1',
      date: '2025-06-15',
      city: 'New York',
      numBars: 4,
      startTime: '18:00',
      endTime: '22:00',
      finalLocation: 'Central Bar',
      minParticipants: 12,
      total_group: 3
    },
    {
      id: '2',
      date: '2025-06-20',
      city: 'Los Angeles',
      numBars: 3,
      startTime: '19:00',
      endTime: '23:00',
      finalLocation: 'Sunset Lounge',
      minParticipants: 10,
      total_group: 2
    },
    {
      id: '3',
      date: '2025-07-01',
      city: 'Chicago',
      numBars: 5,
      startTime: '17:30',
      endTime: '21:30',
      finalLocation: 'Riverwalk Pub',
      minParticipants: 15,
      total_group: 3
    },
    {
      id: '4',
      date: '2025-07-10',
      city: 'Miami',
      numBars: 4,
      startTime: '18:30',
      endTime: '22:30',
      finalLocation: 'Oceanview Club',
      minParticipants: 8,
      total_group: 4
    },
  ]);
  const [loading, setLoading] = useState(false);
  
  return (
    <Animate>

      <Search throttle={ 1000 } callback={ x => setSearch(x) }/><br/>

      {/* <FetchEvents
        search={ search }
        setLoading={ x => setLoading(x) }
        setData={ x => setEvents(x) }
      />  */}

      <Card>
        <Table  
          loading={ loading }
          data={ events }
          badge={{ col: 'total_triggers', color: 'blue' }}
          show={['id', 'date', 'city', 'numBars', 'total_group']}
          actions={{
            custom: [
              { icon: 'eye', action: (data, i) =>  router(`/event-grouping/${data.id}`)},
            ],
          }}
        />
      </Card>

   </Animate>
  )
}

function FetchEvents(props){

  const events = useAPI(`/api/event?search=${props.search}&group=name`);

  useEffect(() => {

    props.setLoading(events.loading);
   
    if (events.data)
      props.setData(events.data);

  }, [events, props])

  return false;

}