/***
*
*   EVENT/DETAIL
*   View the details of an individual event
*
**********/

import { useEffect, useState, useContext } from 'react';
import { Animate, Card, Table, Search, useAPI, Form, ViewContext, useNavigate } from 'components/lib';

export function Locations(props){

  const viewContext = useContext(ViewContext); 
  const router = useNavigate();

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);

  // Dummy venues data
  const [venues, setVenues] = useState([]);

  function deleteData(data, callback){

    viewContext.modal.show({
      title: 'Delete',
      text: `Are you sure you want to delete ${data.name}?`,
      form: {},
      buttonText: 'Delete',
      url: `/api/location/${data._id}`,
      method: 'DELETE',
      destructive: true,
    }, () => {

      callback();
      setReload(prev => prev + 1);
    });
  }

  return (
    <Animate>
      <Search throttle={1000} callback={(x) => setSearch(x)} /><br/>

      <FetchLocations
        search={ search }
        setLoading={ x => setLoading(x) }
        setData={ x => setVenues(x) }
        reload={reload}
      /> 

      <Card title="Locations">
        <div className="w-full flex justify-end mb-8">
          <button onClick={() => router(`/locations/new`)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + Add Location
          </button>
        </div>
        <Table  
          loading={loading}
          data={venues}
          show={[
            'name',
            'city',
            'address',
            'contact_details',
            'contact_person']
          }
          actions={{
            delete: deleteData,
            custom: [
              { icon: 'edit', action: (data, i) => router(`/locations/edit/${data._id}`) },
            ],
            view: { url: '/locations', col: '_id' },
          }}
        />
      </Card>
    </Animate>
  );
}

function FetchLocations(props){

  const locations = useAPI(`/api/location?search=${props.search}&group=name`, 'GET', props.reload);

  useEffect(() => {
    const setData = (locations, props) => {
      props.setLoading(locations.loading);
    
      if (locations.data) {
        props.setData(locations.data?.map((dt) => {
          return {
            ...dt,
            city: dt.city.name
          }
        }));
      }
    }
    const timer = setTimeout(() => {
      setData(locations, props)
    }, 20);

    return () => clearTimeout(timer)
  }, [locations, props])

  return false;

}
