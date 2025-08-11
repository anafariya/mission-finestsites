/***
*
*   EVENT/GROUPS
*   List the events grouped by name
*
**********/
import { useState, useEffect, useContext } from 'react';
import { Animate, Card, Table, Search, useAPI, Form, ViewContext, useNavigate, useLocation } from 'components/lib';

export function EventGroupLists() {
  const viewContext = useContext(ViewContext); 
  const location = useLocation();
  const path = location?.pathname?.split('/');
  const group = path[2];
  const id = path[3];
  const [loading, setLoading] = useState(false);
  const router = useNavigate();

  const [reload, setReload] = useState(0);

  const groups = useAPI(`/api/group/event/${id}`, 'get', reload);

  function deleteData(data, callback){

    viewContext.modal.show({
      title: 'Delete',
      text: `Are you sure you want to delete ${data.group_name}?`,
      form: {},
      buttonText: 'Delete',
      url: `/api/group/${data.id}`,
      method: 'DELETE',
      destructive: true,
    }, () => {

      callback();

    });
  }

  function cancelGroup(data, callback){

    viewContext.modal.show({
      title: 'Cancel Group',
      text: `Are you sure you want to cancel ${data.group_name}? All group members will receive vouchers for future events.`,
      form: {},
      buttonText: 'Cancel Group',
      url: `/api/event-management/cancel-group/${data.id}`,
      method: 'PUT',
      destructive: true,
    }, (formData, response) => {

      if (response && (response.data || response.group_id)) {
        // Refresh the groups list
        setReload(prev => prev + 1);
      } 
      if (callback) {
        callback();
      }
    });
  }

  return (
    <Animate>
      <Card title={`Groups for Event ID: ${id}`}>
        <div className="w-full flex justify-end mb-8">
          <button onClick={() => router(`/event-management/group/${id}/new`)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + Add Group
          </button>
        </div>
        <Table
          loading={loading}
          data={groups?.data}
          show={['group_name', 'participants', 'age_group', 'total_teams', 'status', 'assignment_method']}
          badge={{ col: 'status', condition: [
            {
              value: 'Active',
              color: 'green'
            },
            {
              value: 'Cancelled',
              color: 'red'
            }
          ] }}
          actions={{
            delete: deleteData,
            custom: [
              {
                icon: 'edit', action: (data, i) =>  router(`/event-management/group/${id}/edit/${data.id}`), title: 'View'
              },
              { 
                icon: 'pause-circle', action: (data, i) => cancelGroup(data), title: 'Cancel Group'
              },
              {
                icon: 'eye', action: (data, i) =>  router(`/event-management/group/${id}/${data.id}`), title: 'View'
              },
            ],
          }}
        />
      </Card>
    </Animate>
  );
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