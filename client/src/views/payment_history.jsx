/***
*
*   ACCOUNTS
*   Manage all accounts signed up to your application
*
**********/

import { useContext } from 'react';
import { AuthContext, ViewContext, Card, Table, Animate, usePlans, useAPI, useLocation } from 'components/lib';

export function PaymentHistory(props){
  const location = useLocation();
  const path = location?.pathname?.split('/');
  const id = path[2];
  const viewContext = useContext(ViewContext);
  const authContext = useContext(AuthContext);
  const transactions = useAPI(`/api/transaction/${id}`);

  return(
    <Animate>
      <Card loading={ false }>

        <Table
          search
          show={[
            'date',
            'item', 
            'amount',
            'quantity',
            'payment_status'
          ]}
          data={ transactions?.data }
          loading={ transactions?.loading }
          badge={{ col: 'payment_status', condition: [
            {
              value: 'paid',
              color: 'green'
            },
            {
              value: 'failed',
              color: 'red'
            },
            {
              value: 'unpaid',
              color: 'blue'
            }
          ] }}
          // actions={{
          //   custom: [{ icon: 'download', action: () => true }]
          // }}
        />

      </Card>
    </Animate>
  );
}
