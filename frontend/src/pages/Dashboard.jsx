import { FaRegBell } from 'react-icons/fa';
import AdminSidebar from '../components/AdminSidebar';
import userImg from '../assets/userpic.png';
import { BsSearch } from 'react-icons/bs';
import { HiTrendingDown, HiTrendingUp } from 'react-icons/hi';
import data from '../assets/data.json';
import { BarChart, DoughnutChart } from '../components/Charts';
import Table from '../components/DashboardTable';
import { useEffect } from 'react';
import { fetchInvoices } from '../slices/invoiceSlice';
import { useDispatch, useSelector } from 'react-redux';
// import { BiMaleFemale } from 'react-icons/bi';
const Dashboard = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    console.log('Hello World');
    dispatch(fetchInvoices());
  }, [dispatch]);
  const { invoices } = useSelector((state) => state.invoice);
  let grandTotal = 0;
  const allInvoiceTotal = () => {
    invoices.forEach((invoice) => {
      grandTotal += invoice.grandTotal;
    });
    console.log(grandTotal);
    return grandTotal;
  };

  return (
    <div className='admin-container'>
      {/* AdminSideBar */}
      <AdminSidebar />
      {/* Main */}
      <main className='dashboard'>
        <div className='bar'>
          <BsSearch />
          <input type='text' placeholder='Search for data,users,docs' />
          <FaRegBell />
          <img src={userImg} alt='User' />
        </div>

        <section className='widget-container'>
          <WidgetItem
            percent={40}
            amount={true}
            value={allInvoiceTotal()}
            heading='Total'
            color='rgb(0,115,255)'
          />
          <WidgetItem
            percent={-14}
            amount={false}
            value={400}
            heading='Authentication Failure'
            color='rgb(0,198,202)'
          />
          <WidgetItem
            percent={80}
            amount={false}
            value={23000}
            heading='Authentication Success'
            color='rgb(255 196 0)'
          />
          <WidgetItem
            percent={30}
            amount={false}
            value={1000}
            heading='Level 10 or above alerts'
            color='rgb(76 0 255)'
          />
        </section>

        <section className='graph-container'>
          <div className='revenue-chart'>
            <h2>Events & Count</h2>
            <BarChart
              data_2={[300, 144, 433, 655, 237, 755, 190]}
              data_1={[200, 444, 343, 556, 778, 455, 990]}
              title_1='Events'
              title_2='Count'
              bgColor_1='rgb(0,115,255)'
              bgColor_2='rgba(53,162,235,0.8)'
            />
          </div>
          <div className='dashboard-categories'>
            <h2>Potential Threats</h2>
            <div>
              {data.categories.map((i) => (
                <CategoryItem
                  key={i.heading}
                  color={`hsl(${i.value * 4},${i.value}%,50%)`}
                  value={i.value}
                  heading={i.heading}
                />
              ))}
            </div>
          </div>
        </section>

        <section className='transaction-container'>
          <div className='gender-chart'>
            <h2>Firewall Events by Types</h2>

            <DoughnutChart
              labels={[
                'Database Access',
                'Application Denial',
                'Application Access',
                'Web Traffic Audit',
                'User Auth Audits',
              ]}
              data={[30, 42, 15, 8, 5]}
              backgroundColor={[
                'hsl(340,82%,56%)',
                'red',
                'rgba(45,162,235,0.8)',
                'rgba(53,50,10,0.8)',
                'rgba(53,66,200,0.8)',
              ]}
              cutout={90}
            />
          </div>
          <Table data={data.transaction} />
        </section>
      </main>
    </div>
  );
};

const WidgetItem = ({ heading, value, percent, color, amount = false }) => (
  <article className='widget'>
    <div className='widget-info'>
      <p>{heading}</p>
      <h4>{amount ? `$${value}` : value}</h4>
      {percent > 0 ? (
        <span className='green'>
          <HiTrendingUp />+{percent}%{' '}
        </span>
      ) : (
        <span className='red'>
          <HiTrendingDown /> {percent}%{' '}
        </span>
      )}
    </div>
    <div
      className='widget-circle'
      style={{
        background: `conic-gradient(
        ${color} ${(Math.abs(percent) / 100) * 360}deg,
        rgb(255, 255, 255) 0
      )`,
      }}
    >
      <span style={{ color }}>{percent}%</span>
    </div>
  </article>
);

const CategoryItem = ({ color, value, heading }) => (
  <div className='category-item'>
    <h5>{heading}</h5>
    <div>
      <div>
        <div
          className='inner-div-category'
          style={{ backgroundColor: color, width: `${value}%` }}
        ></div>
      </div>
    </div>
    <span>{value}%</span>
  </div>
);

export default Dashboard;
