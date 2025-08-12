/***
*
*   EVENT/GROUPS
*   List the events grouped by name
*
**********/
import { useState, useEffect, useContext } from 'react';
import { Animate, Card, Table, Search, useAPI, Form, ViewContext, useNavigate, useLocation } from 'components/lib';

export function TeamsLists() {
  const viewContext = useContext(ViewContext); 
  const location = useLocation();
  const path = location?.pathname?.split('/');
  const group = path[2];
  const id = path[3];
  const [loading, setLoading] = useState(false);
  const router = useNavigate();
  const [reload, setReload] = useState(0);

  const teams = useAPI(`/api/event-management/${id}/teams`, 'get', reload);

  function deleteData(data, callback){

    viewContext.modal.show({
      title: 'Delete',
      text: `Are you sure you want to delete the team?`,
      form: {},
      buttonText: 'Delete',
      url: `/api/team/${data._id}`,
      method: 'DELETE',
      destructive: true,
    }, () => {
      setReload(prev => prev + 1)
      // callback();

    });
  }

  return (
    <Animate>
      <Card title={`Teams for Event ID: ${id}`}>
        <div className="w-full flex justify-end mb-8">
          <button onClick={() => router(`/event-management/teams/${id}/new`)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + Add Team
          </button>
        </div>
        <Table
          loading={loading}
          data={teams?.data}
          show={['no', 'first_member_name', 'team_members', 'assignment_method']}
          actions={{
            delete: deleteData,
            custom: [
              {
                icon: 'edit', action: (data, i) =>  router(`/event-management/teams/${id}/edit/${data._id}`), title: 'Edit'
              },
              {
                icon: 'eye', action: (data, i) =>  router(`/event-management/teams/${id}/${data._id}`), title: 'View'
              },
            ],
          }}
        />
      </Card>
    </Animate>
  );
}