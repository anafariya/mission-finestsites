/***
*
*   EVENT/GROUPS
*   List the events grouped by name
*
**********/
import { useState, useEffect, useContext } from 'react';
import { Animate, Card, Table, Search, useAPI, Form, ViewContext, useNavigate } from 'components/lib';

export function Cities(props){
  const viewContext = useContext(ViewContext); 
  const router = useNavigate();

  // state 
  const [search, setSearch] = useState('');
  const [cities, setCities] = useState([
    {
      id: '1',
      name: 'New York',
    },
    {
      id: '2',
      name: 'Los Angeles',
    },
    {
      id: '3',
      name: 'Chicago',
    },
    {
      id: '4',
      name: 'Miami',
    },
  ]);
  
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [reload, setReload] = useState(0);

  const [form, setForm] = useState({
    name: ''
  });

  const openAddModal = () => {
    setForm({
      name: ''
    });
    setEditIndex(null);
    setIsModalOpen(true);
  };

  const openEditModal = (dt) => {
    setForm(dt);
    setEditIndex(dt._id);
    setIsModalOpen(true);
  };

  function deleteData(data, callback){
    viewContext.modal.show({
      title: 'Delete',
      text: `Are you sure you want to delete ${data.name}?`,
      form: {},
      buttonText: 'Delete',
      url: `/api/city/${data._id}`,
      method: 'DELETE',
      destructive: true,
    }, () => {

      callback();
      setReload(prev => prev + 1);

    });
  }
  
  return (
    <Animate>

      <Search throttle={ 1000 } callback={ x => setSearch(x) }/><br/>

      <FetchCities
        search={ search }
        setLoading={ x => setLoading(x) }
        setData={ x => setCities(x) }
        reload={reload}
      /> 

      <Card>
        <div className="w-full flex justify-end mb-8">
          <button onClick={openAddModal} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + Add City
          </button>
        </div>
        <Table  
          loading={ loading }
          data={ cities }
          badge={{ col: 'total_triggers', color: 'blue' }}
          show={['_id', 'name']}
          actions={{
            delete: deleteData,
            custom: [
              { icon: 'edit', action: (data, i) => openEditModal(data) },
            ],
          }}
        />
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-xl relative">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
              aria-label="Close"
            >
              ×
            </button>

            <h2 className="text-xl font-semibold mb-4">
              {editIndex !== null ? 'Edit Event' : 'Add Event'}
            </h2>

            <div className="w-full max-h-[80vh] overflow-auto">
              <Form
                inputs={{
                  name: {
                    label: 'Name',
                    type: 'text',
                    required: true,
                    value: form?.name
                  }
                }}
                method={editIndex !== null ? "PATCH" : "POST"}
                buttonText={editIndex !== null ? "Update City" : "Create City"}
                url={`/api/city${editIndex !== null ? `/${editIndex}` : ''}`}
                callback={() => {
                  setReload(prev => prev + 1)
                  setIsModalOpen(false)
                }}
              />
            </div>
          </div>
        </div>
      )}

   </Animate>
  )
}

function FetchCities(props){

  const cities = useAPI(`/api/city?search=${props.search}&group=name`, 'GET', props.reload);

  useEffect(() => {

    props.setLoading(cities.loading);
   
    if (cities.data)
      props.setData(cities.data);

  }, [cities, props])

  return false;

}