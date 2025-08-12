/***
*
*   EVENT/GROUPS
*   List the events grouped by name
*
**********/
import { useState, useEffect, useContext } from 'react';
import { Animate, Card, Table, Search, useAPI, Form, ViewContext, useNavigate } from 'components/lib';

export function EventGroups(props){
  const viewContext = useContext(ViewContext); 
  const router = useNavigate();

  // state 
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  function deleteData(data, callback){

    viewContext.modal.show({
      title: 'Delete',
      text: `Are you sure you want to delete this event in ${data.city}?`,
      form: {},
      buttonText: 'Delete',
      url: `/api/event-management/${data._id}`,
      method: 'DELETE',
      destructive: true,
    }, () => {

      callback();
      setReload(prev => prev + 1);
    });
  }

  function cancelData(data, callback){

    viewContext.modal.show({
      title: data.status === 'Published' ? 'Cancel Event' : 'Reactivate Event',
      text: `Are you sure you want to ${data.status === 'Published' ? 'cancel' : 'reactivate'} this event in ${data.city}?`,
      form: {
        isCanceled: {
          type: 'hidden',
          value: data.status === 'Published'
        },
      },
      buttonText: data.status === 'Published' ? 'Cancel' : 'Reactivate',
      url: `/api/event-management/cancel/${data._id}`,
      method: 'PUT',
      destructive: true,
    }, () => {

      setReload(prev => prev + 1);
    });
  }

  function cancelAllParticipants(data, callback){

    viewContext.modal.show({
      title: 'Cancel All Participants',
      text: `Are you sure you want to cancel ALL participants for this event in ${data.city}? Vouchers will be issued if cancelled more than 24 hours in advance.`,
      form: {
        type: {
          type: 'hidden',
          value: 'event'
        },
      },
      buttonText: 'Cancel All Participants',
      url: `/api/event-management/cancel-participants/${data._id}`,
      method: 'POST',
      destructive: true,
    }, () => {

      setReload(prev => prev + 1);
    });
  }
  
  return (
    <Animate>

      <Search throttle={ 1000 } callback={ x => setSearch(x) }/><br/>

      <FetchEvents
        search={ search }
        setLoading={ x => setLoading(x) }
        setData={ x => setEvents(x) }
        reload={reload}
      /> 

       {/* Capacity Warning Alert */}
       {events && events.filter(event => event.capacity_warning || event.is_at_capacity).length > 0 && (
        <Card className="mb-4 border-orange-300 bg-orange-50">
          <div className="flex items-center">
            <div className="text-orange-600 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-orange-800 font-semibold">Capacity Warnings</h3>
              <p className="text-orange-700 text-sm">
                {events.filter(event => event.capacity_warning).length} event(s) at 90%+ capacity • 
                {events.filter(event => event.is_at_capacity).length} event(s) at full capacity
              </p>
            </div>
          </div>
        </Card>
      )}


      <Card>
        <div className="w-full flex justify-end mb-8">
          <button onClick={() => router(`/event-management/new`)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + Add Event
          </button>
        </div>
        <Table  
          loading={ loading }
          data={ events }
          badge={{ col: 'status', condition: [
            {
              value: 'Published',
              color: 'green'
            },
            {
              value: 'Canceled',
              color: 'red'
            },
            {
              value: 'Draft',
              color: 'blue'
            },
            {
              value: 'Past Event',
              color: 'orange'
            }
          ] }}
          show={['date', 'city', 'num_bars', 'registered_count', 'capacity_percentage', 'capacity_status', 'status']}
          actions={{
            view: { url: '/event-management', col: '_id' },
            delete: deleteData,
            custom: [
              { icon: 'edit', action: (data, i) => router(`/event-management/edit/${data._id}`), title: 'Edit' },
              { icon: 'pause-circle', action: (data, i) =>  cancelData(data), title: 'Cancel', condition: {
                col: 'status',
                value: 'Published'
              }},
              { icon: 'unlock', action: (data, i) =>  cancelData(data), title: 'Reactivate event', condition: {
                col: 'status',
                value: 'Canceled'
              }},
              { icon: 'users', action: (data, i) => router(`/event-management/registered-participants/${data._id}`), title: 'Registered Participants' },
              { icon: 'columns', action: (data, i) => router(`/event-management/teams/${data._id}`), title: 'All Teams' },
              { icon: 'grid', action: (data, i) => router(`/event-management/group/${data._id}`), title: 'All Groups' },
              { icon: 'message-circle', action: (data, i) => router(`/event-management/participant-messages/${data._id}`), title: 'Participant Messages' },
              { icon: 'user-x', action: (data, i) => cancelAllParticipants(data), title: 'Cancel All Participants', condition: {
                col: 'status',
                value: 'Published'
              }},
            ],
          }}
        />
      </Card>

   </Animate>
  )
}

function FetchEvents(props){

  const events = useAPI(`/api/event-management?search=${props.search}&group=name`, 'GET', props.reload);

 
  useEffect(() => {
    const setData = (events, props) => {
      props.setLoading(events.loading);
     
      if (events.data){
        const formatter = new Intl.DateTimeFormat('de-DE', {
          timeZone: 'Europe/Berlin',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        props.setData(events.data.map((dt) => {
          // Determine capacity status with emoji
          let capacityStatus = '';
          if (dt.is_at_capacity) {
            capacityStatus = '🚫 Full';
          } else if (dt.capacity_warning) {
            capacityStatus = '⚠️ 90%+ Full';
          }

          console.log(dt);

                        return {
                ...dt,
                city: dt.city.name,
                num_bars: dt.bars?.length,
                date: formatter.format(new Date(dt.date)),
                            // Capacity percentage with % symbol
                capacity_percentage: dt.capacity_percentage ? `${dt.capacity_percentage}%` : '0%',
            // Add capacity status with emoji
            capacity_status: capacityStatus
          }
        }));
      }
    }

    const timer = setTimeout(() => {
      setData(events, props)
    }, 20);

    return () => clearTimeout(timer)

  }, [events, props])

  return false;

}